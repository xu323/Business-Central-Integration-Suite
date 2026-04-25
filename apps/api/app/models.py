"""SQLAlchemy ORM models."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class RequestStatus(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    SYNCED = "Synced"


class SyncStatus(str, enum.Enum):
    PENDING = "Pending"
    SUCCESS = "Success"
    FAILED = "Failed"


class PurchaseRequest(Base):
    __tablename__ = "purchase_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(200), default="")
    requester: Mapped[str] = mapped_column(String(80), default="")
    department: Mapped[str] = mapped_column(String(40), default="")
    vendor_no: Mapped[str] = mapped_column(String(20), default="")
    vendor_name: Mapped[str] = mapped_column(String(120), default="")
    document_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    required_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    currency_code: Mapped[str] = mapped_column(String(10), default="TWD")
    status: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus, name="request_status"),
        default=RequestStatus.DRAFT,
        index=True,
    )
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)
    high_risk: Mapped[bool] = mapped_column(Boolean, default=False)
    approver: Mapped[str] = mapped_column(String(80), default="")
    approval_comment: Mapped[str] = mapped_column(Text, default="")
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    bc_document_id: Mapped[str] = mapped_column(String(50), default="")
    synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    lines: Mapped[list[PurchaseRequestLine]] = relationship(
        "PurchaseRequestLine",
        back_populates="request",
        cascade="all, delete-orphan",
    )


class PurchaseRequestLine(Base):
    __tablename__ = "purchase_request_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    request_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("purchase_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    line_no: Mapped[int] = mapped_column(Integer, default=10000)
    item_no: Mapped[str] = mapped_column(String(20), default="")
    description: Mapped[str] = mapped_column(String(200), default="")
    quantity: Mapped[float] = mapped_column(Float, default=0.0)
    unit_of_measure: Mapped[str] = mapped_column(String(10), default="PCS")
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)
    line_amount: Mapped[float] = mapped_column(Float, default=0.0)

    request: Mapped[PurchaseRequest] = relationship("PurchaseRequest", back_populates="lines")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    actor: Mapped[str] = mapped_column(String(80), default="system")
    action: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    target_type: Mapped[str] = mapped_column(String(40), default="PurchaseRequest")
    target_id: Mapped[str] = mapped_column(String(36), default="", index=True)
    sync_status: Mapped[SyncStatus] = mapped_column(
        Enum(SyncStatus, name="sync_status"),
        default=SyncStatus.PENDING,
    )
    request_payload: Mapped[str] = mapped_column(Text, default="")
    response_payload: Mapped[str] = mapped_column(Text, default="")
    error_message: Mapped[str] = mapped_column(Text, default="")
