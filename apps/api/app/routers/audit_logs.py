"""Audit log endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AuditLog, SyncStatus
from app.schemas import AuditLogOut

router = APIRouter(prefix="/api/audit-logs", tags=["audit-logs"])


@router.get("", response_model=list[AuditLogOut])
def list_audit_logs(
    target_id: str | None = Query(default=None),
    action: str | None = Query(default=None),
    sync_status: SyncStatus | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> list[AuditLog]:
    stmt = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)
    if target_id:
        stmt = stmt.where(AuditLog.target_id == target_id)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if sync_status:
        stmt = stmt.where(AuditLog.sync_status == sync_status)
    return list(db.execute(stmt).scalars().all())
