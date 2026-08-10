"""Reports KPIs — regression for the production 500 bug (F2: undefined drawings_total)
plus completion-block behavior and RBAC.

Regression: GET /api/v1/reports/kpis must return 200 with `drawings`, `boq` and
`completion` blocks populated — see plans/quality_testing_infrastructure_plan.md.
"""
import pytest


async def get_kpis(client):
    r = await client.get("/api/v1/reports/kpis")
    assert r.status_code == 200
    assert r.json()["success"] is True
    return r.json()["data"]


@pytest.mark.asyncio
async def test_kpis_returns_200_with_all_blocks(admin_client):
    """F2 regression: the endpoint previously crashed with 500 (NameError)."""
    data = await get_kpis(admin_client)
    for key in ("projects", "contracts", "payments", "hr", "boq", "completion"):
        assert key in data, f"missing kpis block: {key}"
    assert data["boq"]["drawings"] >= 0
    assert data["boq"]["elements_total"] >= 0
    assert data["completion"]["reports_total"] >= 0
    assert isinstance(data["completion"]["latest_by_project"], list)
    assert data["projects"]["total"] >= 1


@pytest.mark.asyncio
async def test_kpis_rbac_matrix(client, project_manager_client, accountant_client, engineer_client):
    assert (await project_manager_client.get("/api/v1/reports/kpis")).status_code == 200
    assert (await accountant_client.get("/api/v1/reports/kpis")).status_code == 200
    assert (await engineer_client.get("/api/v1/reports/kpis")).status_code == 403
    assert (await client.get("/api/v1/reports/kpis")).status_code == 401


@pytest.mark.asyncio
async def test_kpis_completion_tracks_new_report(admin_client):
    pid = (await admin_client.post(
        "/api/v1/projects", json={"name": "مشروع تتبع المؤشر", "status": "in_progress"},
    )).json()["data"]["id"]
    before = (await get_kpis(admin_client))["completion"]["reports_total"]
    r = await admin_client.post(
        "/api/v1/completion-reports",
        json={"project_id": pid, "report_period": "سبتمبر 2026 (شهر 9)",
              "report_data": {"structureItems": [{"name": "القواعد", "progress": 100}], "finishingItems": []}},
    )
    assert r.status_code == 200
    after = (await get_kpis(admin_client))["completion"]
    assert after["reports_total"] == before + 1
    assert any(e["project_id"] == pid for e in after["latest_by_project"])
    entry = next(e for e in after["latest_by_project"] if e["project_id"] == pid)
    # structure avg 100, finishing empty → overall = 100 × 0.5 = 50
    assert entry["overall"] == 50.0


@pytest.mark.asyncio
async def test_kpis_project_without_reports_not_in_latest(admin_client):
    """A project with no completion reports must not pollute latest_by_project."""
    pid = (await admin_client.post(
        "/api/v1/projects", json={"name": "مشروع بلا تقارير", "status": "in_progress"},
    )).json()["data"]["id"]
    after = (await get_kpis(admin_client))["completion"]
    assert all(e["project_id"] != pid for e in after["latest_by_project"])
