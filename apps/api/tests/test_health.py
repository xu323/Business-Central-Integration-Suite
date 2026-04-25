def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["bc_mode"] in ("mock", "real")


def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "Business Central" in r.json()["name"]
