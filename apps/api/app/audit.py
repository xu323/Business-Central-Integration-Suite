"""Helpers for writing AuditLog rows in a single canonical place."""
from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditLog, SyncStatus


def _safe_dump(obj: Any) -> str:
    if obj is None:
        return ""
    try:
        return json.dumps(obj, default=str, ensure_ascii=False)
    except (TypeError, ValueError):
        return str(obj)


def write_audit(
    db: Session,
    *,
    actor: str,
    action: str,
    target_id: str,
    target_type: str = "PurchaseRequest",
    sync_status: SyncStatus = SyncStatus.SUCCESS,
    request_payload: Any = None,
    response_payload: Any = None,
    error_message: str = "",
) -> AuditLog:
    """Create an AuditLog row and flush (without committing)."""
    log = AuditLog(
        actor=actor or "system",
        action=action,
        target_type=target_type,
        target_id=target_id,
        sync_status=sync_status,
        request_payload=_safe_dump(request_payload),
        response_payload=_safe_dump(response_payload),
        error_message=error_message,
    )
    db.add(log)
    db.flush()
    return log
