"""Pytest fixtures: per-test SQLite database, no module reloads."""
from __future__ import annotations

import os
import tempfile
from collections.abc import Generator

# Set env BEFORE app/* is imported so settings pick them up cleanly.
_TMP_DIR = tempfile.mkdtemp(prefix="bcsuite-test-")
os.environ.setdefault("DATABASE_URL", f"sqlite:///{_TMP_DIR}/test.db")
os.environ.setdefault("BC_MODE", "mock")
os.environ.setdefault("APP_ENV", "development")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import AuditLog, PurchaseRequest, PurchaseRequestLine  # noqa: E402,F401


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    # Reset schema for every test so each one starts blank.
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        db.query(AuditLog).delete()
        db.query(PurchaseRequestLine).delete()
        db.query(PurchaseRequest).delete()
        db.commit()
    finally:
        db.close()

    with TestClient(app) as c:
        yield c
