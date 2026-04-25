"""Purchase Request endpoints."""
from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.audit import write_audit
from app.config import settings
from app.database import get_db
from app.models import (
    PurchaseRequest,
    PurchaseRequestLine,
    RequestStatus,
    SyncStatus,
)
from app.schemas import (
    ApprovalDecision,
    PurchaseRequestCreate,
    PurchaseRequestOut,
)
from app.services.business_central_client import get_bc_client

router = APIRouter(prefix="/api/purchase-requests", tags=["purchase-requests"])


def _generate_number(db: Session) -> str:
    today = datetime.utcnow().strftime("%Y%m%d")
    prefix = f"PR{today}"
    count = (
        db.query(PurchaseRequest)
        .filter(PurchaseRequest.number.like(f"{prefix}%"))
        .count()
    )
    return f"{prefix}{count + 1:04d}"


def _recalc_totals(req: PurchaseRequest) -> None:
    total = 0.0
    for line in req.lines:
        line.line_amount = round(line.quantity * line.unit_price, 2)
        total += line.line_amount
    req.total_amount = round(total, 2)
    req.high_risk = req.total_amount >= settings.high_risk_threshold


def _load(db: Session, request_id: str) -> PurchaseRequest:
    stmt = (
        select(PurchaseRequest)
        .options(selectinload(PurchaseRequest.lines))
        .where(PurchaseRequest.id == request_id)
    )
    obj = db.execute(stmt).scalar_one_or_none()
    if obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase request not found")
    return obj


@router.get("", response_model=list[PurchaseRequestOut])
def list_requests(
    status_filter: RequestStatus | None = Query(default=None, alias="status"),
    q: str | None = Query(default=None, description="Search description / vendor / requester"),
    db: Session = Depends(get_db),
) -> list[PurchaseRequest]:
    stmt = select(PurchaseRequest).options(selectinload(PurchaseRequest.lines))
    if status_filter is not None:
        stmt = stmt.where(PurchaseRequest.status == status_filter)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (PurchaseRequest.description.ilike(like))
            | (PurchaseRequest.vendor_name.ilike(like))
            | (PurchaseRequest.requester.ilike(like))
        )
    stmt = stmt.order_by(PurchaseRequest.created_at.desc())
    return list(db.execute(stmt).scalars().all())


@router.get("/{request_id}", response_model=PurchaseRequestOut)
def get_request(request_id: str, db: Session = Depends(get_db)) -> PurchaseRequest:
    return _load(db, request_id)


@router.post("", response_model=PurchaseRequestOut, status_code=status.HTTP_201_CREATED)
def create_request(payload: PurchaseRequestCreate, db: Session = Depends(get_db)) -> PurchaseRequest:
    req = PurchaseRequest(
        number=_generate_number(db),
        description=payload.description,
        requester=payload.requester or "anonymous",
        department=payload.department,
        vendor_no=payload.vendor_no,
        vendor_name=payload.vendor_name,
        required_date=payload.required_date,
        currency_code=payload.currency_code or "TWD",
    )
    for idx, line_in in enumerate(payload.lines):
        line = PurchaseRequestLine(
            line_no=line_in.line_no or (idx + 1) * 10000,
            item_no=line_in.item_no,
            description=line_in.description,
            quantity=line_in.quantity,
            unit_of_measure=line_in.unit_of_measure or "PCS",
            unit_price=line_in.unit_price,
        )
        line.line_amount = round(line.quantity * line.unit_price, 2)
        req.lines.append(line)
    _recalc_totals(req)
    db.add(req)
    db.flush()
    write_audit(
        db,
        actor=req.requester,
        action="create",
        target_id=req.id,
        sync_status=SyncStatus.SUCCESS,
        request_payload=payload.model_dump(),
        response_payload={"number": req.number, "total_amount": req.total_amount},
    )
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/submit", response_model=PurchaseRequestOut)
def submit_request(
    request_id: str,
    decision: ApprovalDecision | None = None,
    db: Session = Depends(get_db),
) -> PurchaseRequest:
    req = _load(db, request_id)
    if req.status != RequestStatus.DRAFT:
        raise HTTPException(400, f"Only Draft can be submitted (current: {req.status.value})")
    if not req.lines:
        raise HTTPException(400, "Cannot submit a request without lines")

    _recalc_totals(req)
    req.status = RequestStatus.SUBMITTED
    req.submitted_at = datetime.utcnow()
    actor = (decision.actor if decision else "") or req.requester
    write_audit(
        db,
        actor=actor,
        action="submit",
        target_id=req.id,
        request_payload={"number": req.number, "total_amount": req.total_amount},
    )
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/approve", response_model=PurchaseRequestOut)
def approve_request(
    request_id: str,
    decision: ApprovalDecision,
    db: Session = Depends(get_db),
) -> PurchaseRequest:
    req = _load(db, request_id)
    if req.status != RequestStatus.SUBMITTED:
        raise HTTPException(400, f"Only Submitted can be approved (current: {req.status.value})")

    req.status = RequestStatus.APPROVED
    req.approver = decision.actor or "approver"
    req.approval_comment = decision.comment
    req.decided_at = datetime.utcnow()
    write_audit(
        db,
        actor=req.approver,
        action="approve",
        target_id=req.id,
        request_payload={"comment": decision.comment, "high_risk": req.high_risk},
    )
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/reject", response_model=PurchaseRequestOut)
def reject_request(
    request_id: str,
    decision: ApprovalDecision,
    db: Session = Depends(get_db),
) -> PurchaseRequest:
    req = _load(db, request_id)
    if req.status != RequestStatus.SUBMITTED:
        raise HTTPException(400, f"Only Submitted can be rejected (current: {req.status.value})")

    req.status = RequestStatus.REJECTED
    req.approver = decision.actor or "approver"
    req.approval_comment = decision.comment
    req.decided_at = datetime.utcnow()
    write_audit(
        db,
        actor=req.approver,
        action="reject",
        target_id=req.id,
        request_payload={"comment": decision.comment},
    )
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/sync-to-bc", response_model=PurchaseRequestOut)
def sync_to_bc(request_id: str, db: Session = Depends(get_db)) -> PurchaseRequest:
    req = _load(db, request_id)
    if req.status != RequestStatus.APPROVED:
        raise HTTPException(400, f"Only Approved can be synced (current: {req.status.value})")

    payload = {
        "number": req.number,
        "description": req.description,
        "vendor_no": req.vendor_no,
        "vendor_name": req.vendor_name,
        "currency_code": req.currency_code,
        "total_amount": req.total_amount,
        "required_date": req.required_date.isoformat() if req.required_date else None,
        "lines": [
            {
                "line_no": line.line_no,
                "item_no": line.item_no,
                "description": line.description,
                "quantity": line.quantity,
                "unit_price": line.unit_price,
                "line_amount": line.line_amount,
            }
            for line in req.lines
        ],
    }
    bc = get_bc_client()
    result = bc.sync_purchase_request(payload)

    if result.success:
        req.status = RequestStatus.SYNCED
        req.bc_document_id = result.bc_document_id
        req.synced_at = datetime.utcnow()
        write_audit(
            db,
            actor=req.approver or req.requester,
            action="sync",
            target_id=req.id,
            sync_status=SyncStatus.SUCCESS,
            request_payload=payload,
            response_payload=result.response,
        )
    else:
        write_audit(
            db,
            actor=req.approver or req.requester,
            action="sync",
            target_id=req.id,
            sync_status=SyncStatus.FAILED,
            request_payload=payload,
            response_payload=result.response,
            error_message=result.error,
        )
        db.commit()
        raise HTTPException(502, f"BC sync failed: {result.error}")

    db.commit()
    db.refresh(req)
    return req


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_request(request_id: str, db: Session = Depends(get_db)):
    req = _load(db, request_id)
    if req.status not in (RequestStatus.DRAFT, RequestStatus.REJECTED):
        raise HTTPException(400, "Only Draft or Rejected requests can be deleted")
    write_audit(db, actor="system", action="delete", target_id=req.id)
    db.delete(req)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/_debug/recent-cutoff", include_in_schema=False)
def recent_cutoff(days: int = 7) -> dict[str, str]:
    return {"cutoff": (datetime.utcnow() - timedelta(days=days)).isoformat()}
