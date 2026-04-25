"""Pydantic v2 request / response schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import RequestStatus, SyncStatus

# --- Lines ---------------------------------------------------------------

class PurchaseRequestLineIn(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    line_no: int = Field(default=10000, ge=0)
    item_no: str = Field(default="", max_length=20)
    description: str = Field(default="", max_length=200)
    quantity: float = Field(default=0.0, ge=0.0)
    unit_of_measure: str = Field(default="PCS", max_length=10)
    unit_price: float = Field(default=0.0, ge=0.0)


class PurchaseRequestLineOut(PurchaseRequestLineIn):
    id: str
    line_amount: float


# --- Header --------------------------------------------------------------

class PurchaseRequestCreate(BaseModel):
    description: str = Field(default="", max_length=200)
    requester: str = Field(default="", max_length=80)
    department: str = Field(default="", max_length=40)
    vendor_no: str = Field(default="", max_length=20)
    vendor_name: str = Field(default="", max_length=120)
    required_date: datetime | None = None
    currency_code: str = Field(default="TWD", max_length=10)
    lines: list[PurchaseRequestLineIn] = Field(default_factory=list)


class PurchaseRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    number: str
    description: str
    requester: str
    department: str
    vendor_no: str
    vendor_name: str
    document_date: datetime
    required_date: datetime | None
    currency_code: str
    status: RequestStatus
    total_amount: float
    high_risk: bool
    approver: str
    approval_comment: str
    submitted_at: datetime | None
    decided_at: datetime | None
    bc_document_id: str
    synced_at: datetime | None
    created_at: datetime
    updated_at: datetime
    lines: list[PurchaseRequestLineOut] = Field(default_factory=list)


class ApprovalDecision(BaseModel):
    actor: str = Field(default="", max_length=80)
    comment: str = Field(default="", max_length=500)


# --- Audit ---------------------------------------------------------------

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp: datetime
    actor: str
    action: str
    target_type: str
    target_id: str
    sync_status: SyncStatus
    error_message: str


# --- Dashboard / Health --------------------------------------------------

class DashboardSummary(BaseModel):
    total_requests: int
    by_status: dict[str, int]
    high_risk_count: int
    total_amount_open: float
    total_amount_synced: float
    recent_sync_failures: int


class HealthResponse(BaseModel):
    status: str
    bc_mode: str
    version: str
