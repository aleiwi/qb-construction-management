"""M2 merge (legacy QuantumBuild price_history idea): price timeline."""
import pytest


@pytest.mark.asyncio
async def test_price_history_tracks_create_update_delete(admin_client):
    # create
    res = await admin_client.post("/api/v1/price-library", json={
        "element_type": "test_hist_wall", "unit": "م3", "unit_price": 500.0,
    })
    assert res.status_code == 200, res.text
    pid = res.json()["data"]["id"]

    # update (PUT path)
    res = await admin_client.put(f"/api/v1/price-library/{pid}", json={"unit_price": 550.0})
    assert res.status_code == 200, res.text

    # history shows create + update, newest first
    res = await admin_client.get(f"/api/v1/price-library/{pid}/history")
    assert res.status_code == 200, res.text
    entries = res.json()["data"]
    assert [e["change"] for e in entries] == ["update", "create"]
    assert float(entries[0]["unit_price"]) == 550.0
    assert float(entries[1]["unit_price"]) == 500.0

    # delete keeps the timeline (no FK wipe)
    res = await admin_client.delete(f"/api/v1/price-library/{pid}")
    assert res.status_code == 200, res.text
    res = await admin_client.get(f"/api/v1/price-library/{pid}/history")
    assert [e["change"] for e in res.json()["data"]] == ["delete", "update", "create"]


@pytest.mark.asyncio
async def test_price_history_rbac(accountant_client, engineer_client):
    # mirror price-library list roles: accountant allowed, engineer denied
    res = await accountant_client.get("/api/v1/price-library/999999/history")
    assert res.status_code == 200, res.text
    res = await engineer_client.get("/api/v1/price-library/999999/history")
    assert res.status_code == 403, res.text
