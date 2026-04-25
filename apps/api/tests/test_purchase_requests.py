def _create_payload(amount=5000):
    return {
        "description": "Pytest request",
        "requester": "tester",
        "department": "QA",
        "vendor_no": "V-TEST",
        "vendor_name": "Test Vendor",
        "currency_code": "TWD",
        "lines": [
            {"item_no": "ITEM-T", "description": "test item", "quantity": 1, "unit_price": amount},
        ],
    }


def test_create_and_list_request(client):
    r = client.post("/api/purchase-requests", json=_create_payload())
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["status"] == "Draft"
    assert body["total_amount"] == 5000
    assert body["high_risk"] is False

    r = client.get("/api/purchase-requests")
    assert r.status_code == 200
    items = r.json()
    assert any(item["id"] == body["id"] for item in items)


def test_full_lifecycle_to_synced(client):
    create = client.post("/api/purchase-requests", json=_create_payload(amount=8000)).json()
    rid = create["id"]

    assert client.post(f"/api/purchase-requests/{rid}/submit", json={"actor": "tester"}).status_code == 200
    approved = client.post(
        f"/api/purchase-requests/{rid}/approve",
        json={"actor": "manager", "comment": "ok"},
    ).json()
    assert approved["status"] == "Approved"

    synced = client.post(f"/api/purchase-requests/{rid}/sync-to-bc").json()
    assert synced["status"] == "Synced"
    assert synced["bc_document_id"].startswith("PO-MOCK-")


def test_high_risk_flag_sets_when_over_threshold(client):
    body = client.post("/api/purchase-requests", json=_create_payload(amount=250000)).json()
    rid = body["id"]
    submitted = client.post(f"/api/purchase-requests/{rid}/submit", json={"actor": "tester"}).json()
    assert submitted["high_risk"] is True


def test_cannot_approve_draft(client):
    body = client.post("/api/purchase-requests", json=_create_payload()).json()
    r = client.post(f"/api/purchase-requests/{body['id']}/approve", json={"actor": "manager"})
    assert r.status_code == 400


def test_reject_request(client):
    body = client.post("/api/purchase-requests", json=_create_payload()).json()
    rid = body["id"]
    client.post(f"/api/purchase-requests/{rid}/submit", json={"actor": "tester"})
    rejected = client.post(
        f"/api/purchase-requests/{rid}/reject",
        json={"actor": "manager", "comment": "no budget"},
    ).json()
    assert rejected["status"] == "Rejected"


def test_audit_logs_capture_actions(client):
    body = client.post("/api/purchase-requests", json=_create_payload()).json()
    client.post(f"/api/purchase-requests/{body['id']}/submit", json={"actor": "tester"})
    logs = client.get("/api/audit-logs", params={"target_id": body["id"]}).json()
    actions = [log["action"] for log in logs]
    assert "create" in actions
    assert "submit" in actions


def test_dashboard_summary(client):
    r = client.get("/api/dashboard/summary")
    assert r.status_code == 200
    body = r.json()
    assert "by_status" in body
    assert "total_requests" in body
