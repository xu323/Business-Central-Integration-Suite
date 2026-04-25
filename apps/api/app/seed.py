"""Seed initial demo data so the dashboard is non-empty on first boot."""
from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import (
    AuditLog,
    PurchaseRequest,
    PurchaseRequestLine,
    RequestStatus,
    SyncStatus,
)

SEED_REQUESTS = [
    {
        "number": "PR202604010001",
        "description": "Office laptops for Q2 onboarding",
        "requester": "alice.chen",
        "department": "IT",
        "vendor_no": "V0001",
        "vendor_name": "Acme IT Supplies",
        "status": RequestStatus.SUBMITTED,
        "lines": [
            {"item_no": "ITEM-LAPTOP-13", "description": "13\" Laptop", "quantity": 5, "unit_price": 38000},
        ],
    },
    {
        "number": "PR202604010002",
        "description": "Server hardware refresh",
        "requester": "bob.lin",
        "department": "Infrastructure",
        "vendor_no": "V0002",
        "vendor_name": "Northwind Hardware",
        "status": RequestStatus.APPROVED,
        "approver": "manager",
        "lines": [
            {"item_no": "ITEM-SVR-RACK", "description": "Rack server", "quantity": 2, "unit_price": 95000},
        ],
    },
    {
        "number": "PR202604010003",
        "description": "Monthly office supplies",
        "requester": "carol.wang",
        "department": "Admin",
        "vendor_no": "V0003",
        "vendor_name": "Generic Office Co.",
        "status": RequestStatus.DRAFT,
        "lines": [
            {"item_no": "ITEM-PAPER-A4", "description": "A4 paper", "quantity": 50, "unit_price": 80},
            {"item_no": "ITEM-PEN-BLU", "description": "Ballpoint pen", "quantity": 200, "unit_price": 15},
        ],
    },
    {
        "number": "PR202604010004",
        "description": "Marketing event sponsorship",
        "requester": "dan.huang",
        "department": "Marketing",
        "vendor_no": "V0004",
        "vendor_name": "EventPro Inc.",
        "status": RequestStatus.SYNCED,
        "approver": "manager",
        "bc_document_id": "PO-MOCK-PR202604010004",
        "lines": [
            {"item_no": "SVC-EVENT", "description": "Booth + sponsorship", "quantity": 1, "unit_price": 250000},
        ],
    },
]


def init_db() -> None:
    Base.metadata.create_all(engine)


def seed_if_empty(db: Session | None = None) -> None:
    init_db()
    own_session = db is None
    db = db or SessionLocal()
    try:
        if db.scalar(select(PurchaseRequest).limit(1)):
            return

        now = datetime.utcnow()
        for idx, item in enumerate(SEED_REQUESTS):
            req = PurchaseRequest(
                number=item["number"],
                description=item["description"],
                requester=item["requester"],
                department=item["department"],
                vendor_no=item["vendor_no"],
                vendor_name=item["vendor_name"],
                document_date=now - timedelta(days=idx),
                required_date=now + timedelta(days=14 - idx),
                status=item["status"],
                approver=item.get("approver", ""),
                bc_document_id=item.get("bc_document_id", ""),
                submitted_at=now - timedelta(days=idx, hours=2)
                if item["status"] != RequestStatus.DRAFT
                else None,
                decided_at=now - timedelta(days=idx, hours=1)
                if item["status"] in (RequestStatus.APPROVED, RequestStatus.REJECTED, RequestStatus.SYNCED)
                else None,
                synced_at=now - timedelta(hours=1)
                if item["status"] == RequestStatus.SYNCED
                else None,
            )
            total = 0.0
            for li, line in enumerate(item["lines"]):
                amount = round(line["quantity"] * line["unit_price"], 2)
                total += amount
                req.lines.append(
                    PurchaseRequestLine(
                        line_no=(li + 1) * 10000,
                        item_no=line["item_no"],
                        description=line["description"],
                        quantity=line["quantity"],
                        unit_price=line["unit_price"],
                        line_amount=amount,
                    )
                )
            req.total_amount = round(total, 2)
            req.high_risk = total >= 100000
            db.add(req)
            db.flush()

            db.add(
                AuditLog(
                    actor=req.requester,
                    action="seed",
                    target_id=req.id,
                    sync_status=SyncStatus.SUCCESS,
                    request_payload="{}",
                    response_payload=f'{{"number": "{req.number}"}}',
                )
            )
        db.commit()
    finally:
        if own_session:
            db.close()
