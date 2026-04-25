"""BusinessCentralClient — switch between mock and real BC API.

Real mode uses Microsoft Entra ID (Azure AD) Service-to-Service auth:
client_credentials grant against
  https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
with scope `https://api.businesscentral.dynamics.com/.default`,
then POSTs to the custom API page exposed by the AL extension.
"""
from __future__ import annotations

import logging
import time
import uuid
from dataclasses import dataclass
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class BCSyncResult:
    success: bool
    bc_document_id: str
    response: dict[str, Any]
    error: str = ""


class BusinessCentralClient:
    """Adapter around Business Central's Custom API page.

    In `mock` mode (default) it returns a deterministic fake document id
    so the whole stack can be demoed without a real BC tenant.
    In `real` mode it acquires an OAuth token and POSTs to the BC custom
    API URL constructed from settings.
    """

    def __init__(self) -> None:
        self.mode = settings.bc_mode
        self._token: str | None = None
        self._token_expires_at: float = 0.0

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def sync_purchase_request(self, payload: dict[str, Any]) -> BCSyncResult:
        if self.mode == "mock":
            return self._mock_sync(payload)
        return self._real_sync(payload)

    def healthcheck(self) -> dict[str, Any]:
        return {
            "mode": self.mode,
            "configured": self._is_real_configured() if self.mode == "real" else True,
        }

    # ------------------------------------------------------------------
    # Mock connector
    # ------------------------------------------------------------------

    def _mock_sync(self, payload: dict[str, Any]) -> BCSyncResult:
        number = str(payload.get("number") or "")
        bc_id = f"PO-MOCK-{number or uuid.uuid4().hex[:8].upper()}"
        response = {
            "@odata.context": "mock://businesscentral/$metadata#purchaseOrders",
            "id": bc_id,
            "number": bc_id,
            "vendorNumber": payload.get("vendor_no", ""),
            "totalAmount": payload.get("total_amount", 0.0),
            "status": "Open",
        }
        return BCSyncResult(success=True, bc_document_id=bc_id, response=response)

    # ------------------------------------------------------------------
    # Real connector
    # ------------------------------------------------------------------

    def _is_real_configured(self) -> bool:
        return all(
            [
                settings.bc_tenant_id,
                settings.bc_client_id,
                settings.bc_client_secret,
                settings.bc_company_id,
            ]
        )

    def _get_token(self) -> str:
        if self._token and time.time() < self._token_expires_at - 60:
            return self._token

        url = f"https://login.microsoftonline.com/{settings.bc_tenant_id}/oauth2/v2.0/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": settings.bc_client_id,
            "client_secret": settings.bc_client_secret,
            "scope": "https://api.businesscentral.dynamics.com/.default",
        }
        with httpx.Client(timeout=20.0) as client:
            resp = client.post(url, data=data)
            resp.raise_for_status()
            payload = resp.json()
            self._token = payload["access_token"]
            self._token_expires_at = time.time() + int(payload.get("expires_in", 3600))
        return self._token

    def _api_url(self) -> str:
        return (
            f"{settings.bc_base_url.rstrip('/')}/{settings.bc_tenant_id}/{settings.bc_environment}"
            f"/api/{settings.bc_api_publisher}/{settings.bc_api_group}/{settings.bc_api_version}"
            f"/companies({settings.bc_company_id})/purchaseRequests"
        )

    def _real_sync(self, payload: dict[str, Any]) -> BCSyncResult:
        if not self._is_real_configured():
            return BCSyncResult(
                success=False,
                bc_document_id="",
                response={},
                error="Real BC mode is not fully configured (BC_TENANT_ID/CLIENT_ID/CLIENT_SECRET/COMPANY_ID).",
            )
        try:
            token = self._get_token()
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(self._api_url(), headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
            bc_id = str(data.get("number") or data.get("id") or "")
            return BCSyncResult(success=True, bc_document_id=bc_id, response=data)
        except httpx.HTTPStatusError as exc:
            logger.error("BC HTTP %s: %s", exc.response.status_code, exc.response.text[:500])
            return BCSyncResult(
                success=False,
                bc_document_id="",
                response={"status_code": exc.response.status_code, "body": exc.response.text[:500]},
                error=f"HTTP {exc.response.status_code}",
            )
        except httpx.HTTPError as exc:
            logger.exception("BC sync failed")
            return BCSyncResult(success=False, bc_document_id="", response={}, error=str(exc))


_client: BusinessCentralClient | None = None


def get_bc_client() -> BusinessCentralClient:
    global _client
    if _client is None:
        _client = BusinessCentralClient()
    return _client
