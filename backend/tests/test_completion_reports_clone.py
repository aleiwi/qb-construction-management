import pytest
from conftest import make_project, make_building, make_stage, make_contractor, make_contract, make_payment


@pytest.mark.asyncio
async def test_clone_previous_creates_new_report_with_parent_link(admin_client):
    """Clone creates a new draft report linked to the previous report via parent_report_id."""
    proj = await admin_client.post("/api/v1/projects", json={"name": "Clone_Proj", "status": "in_progress"})
    assert proj.status_code == 200, proj.text
    pid = proj.json()["data"]["id"]

    original = await admin_client.post("/api/v1/completion-reports", json={
        "project_id": pid,
        "period_type": "weekly",
        "period_start": "2026-01-01",
        "period_end": "2026-01-07",
        "status": "submitted",
        "report_data": {"items": [{"section": "test", "progress": 42}]},
    })
    assert original.status_code in (200, 201), original.text
    orig_data = original.json()["data"]
    orig_id = orig_data["id"]

    cloned = await admin_client.post(f"/api/v1/completion-reports/projects/{pid}/clone-previous", json={
        "report_period": "2026-01-08 to 2026-01-14",
        "period_type": "weekly",
        "period_start": "2026-01-08",
        "period_end": "2026-01-14",
    })
    assert cloned.status_code in (200, 201), cloned.text
    clone_data = cloned.json()["data"]
    assert clone_data["project_id"] == pid
    assert clone_data["status"] == "draft"
    assert clone_data["parent_report_id"] == orig_id
    assert clone_data["report_data"]["items"] == [{"section": "test", "progress": 42}]
    assert clone_data["report_period"] == "2026-01-08 to 2026-01-14"


@pytest.mark.asyncio
async def test_clone_guard_with_no_previous(admin_client):
    """Clone should fail with 400 when no previous report exists."""
    proj = await admin_client.post("/api/v1/projects", json={"name": "Clone_Empty", "status": "in_progress"})
    assert proj.status_code == 200, proj.text
    pid = proj.json()["data"]["id"]

    res = await admin_client.post(f"/api/v1/completion-reports/projects/{pid}/clone-previous", json={
        "report_period": "irrelevant",
        "period_type": "weekly",
        "period_start": "2026-01-01",
        "period_end": "2026-01-07",
    })
    assert res.status_code == 400, res.text
    assert "لا يوجد تقرير سابق للاستنساخ" in res.json().get("error", {}).get("message", "")


@pytest.mark.asyncio
async def test_clone_preserves_original_report_data_as_archive(admin_client):
    """Clone should not overwrite or alter the original (archived) report."""
    proj = await admin_client.post("/api/v1/projects", json={"name": "Clone_Archive", "status": "in_progress"})
    assert proj.status_code == 200, proj.text
    pid = proj.json()["data"]["id"]

    original = await admin_client.post("/api/v1/completion-reports", json={
        "project_id": pid,
        "period_type": "weekly",
        "period_start": "2026-01-01",
        "period_end": "2026-01-07",
        "status": "submitted",
        "report_data": {"items": [{"id": "a", "progress": 100}]},
    })
    orig_id = original.json()["data"]["id"]

    cloned = await admin_client.post(f"/api/v1/completion-reports/projects/{pid}/clone-previous", json={
        "report_period": "2026-01-08 to 2026-01-14",
        "period_type": "weekly",
        "period_start": "2026-01-08",
        "period_end": "2026-01-14",
    })
    clone_id = cloned.json()["data"]["id"]

    fetched = await admin_client.get(f"/api/v1/completion-reports/{orig_id}")
    assert fetched.status_code == 200
    original_again = fetched.json()["data"]
    assert original_again["status"] == "submitted"
    assert original_again["report_data"]["items"] == [{"id": "a", "progress": 100}]
    assert original_again["parent_report_id"] is None


@pytest.mark.asyncio
async def test_clone_chain_deepness(admin_client):
    """A->B->C chain: each clone links to previous, original stays root."""
    proj = await admin_client.post("/api/v1/projects", json={"name": "Clone_Chain", "status": "in_progress"})
    assert proj.status_code == 200, proj.text
    pid = proj.json()["data"]["id"]

    a = await admin_client.post("/api/v1/completion-reports", json={
        "project_id": pid, "period_type": "weekly",
        "period_start": "2026-01-01", "period_end": "2026-01-07",
        "status": "submitted", "report_data": {"items": [{"x": 1}]},
    })
    aid = a.json()["data"]["id"]

    b = await admin_client.post(f"/api/v1/completion-reports/projects/{pid}/clone-previous", json={
        "report_period": "2026-01-08 to 2026-01-14", "period_type": "weekly",
        "period_start": "2026-01-08", "period_end": "2026-01-14",
    })
    bid = b.json()["data"]["id"]
    assert b.json()["data"]["parent_report_id"] == aid

    c = await admin_client.post(f"/api/v1/completion-reports/projects/{pid}/clone-previous", json={
        "report_period": "2026-01-15 to 2026-01-21", "period_type": "weekly",
        "period_start": "2026-01-15", "period_end": "2026-01-21",
    })
    cid = c.json()["data"]["id"]
    assert c.json()["data"]["parent_report_id"] == bid

    all_reports = await admin_client.get(f"/api/v1/completion-reports?project_id={pid}")
    assert all_reports.status_code == 200
    reports = all_reports.json()["data"]
    ids = [r["id"] for r in reports]
    assert aid in ids
    assert bid in ids
    assert cid in ids