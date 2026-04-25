"""Dashboard summary endpoint."""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AuditLog, PurchaseRequest, RequestStatus, SyncStatus
from app.schemas import DashboardSummary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db)) -> DashboardSummary:
    total = db.scalar(select(func.count()).select_from(PurchaseRequest)) or 0

    by_status: dict[str, int] = defaultdict(int)
    rows = db.execute(
        select(PurchaseRequest.status, func.count()).group_by(PurchaseRequest.status)
    ).all()
    for s, c in rows:
        by_status[s.value] = c
    for st in RequestStatus:
        by_status.setdefault(st.value, 0)

    high_risk = (
        db.scalar(
            select(func.count())
            .select_from(PurchaseRequest)
            .where(PurchaseRequest.high_risk.is_(True))
        )
        or 0
    )

    open_amount = (
        db.scalar(
            select(func.coalesce(func.sum(PurchaseRequest.total_amount), 0.0)).where(
                PurchaseRequest.status.in_(
                    [RequestStatus.DRAFT, RequestStatus.SUBMITTED, RequestStatus.APPROVED]
                )
            )
        )
        or 0.0
    )
    synced_amount = (
        db.scalar(
            select(func.coalesce(func.sum(PurchaseRequest.total_amount), 0.0)).where(
                PurchaseRequest.status == RequestStatus.SYNCED
            )
        )
        or 0.0
    )

    cutoff = datetime.utcnow() - timedelta(days=7)
    recent_failures = (
        db.scalar(
            select(func.count())
            .select_from(AuditLog)
            .where(AuditLog.sync_status == SyncStatus.FAILED)
            .where(AuditLog.timestamp >= cutoff)
        )
        or 0
    )

    return DashboardSummary(
        total_requests=total,
        by_status=dict(by_status),
        high_risk_count=high_risk,
        total_amount_open=float(open_amount),
        total_amount_synced=float(synced_amount),
        recent_sync_failures=recent_failures,
    )
