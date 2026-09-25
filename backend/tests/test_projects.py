"""Projects CRUD, RBAC, validation, and 404 edge cases."""
import pytest


@pytest.mark.asyncio
async def test_list_projects_admin(admin_client, seeded):
    r = await admin_client.get("/api/v1/projects")
    assert r.status_code == 200
    names = [p["name"] for p in r.json()["data"]]
    assert seeded["project_name"] in names


@pytest.mark.asyncio
async def test_list_projects_engineer_allowed(engineer_client):
    r = await engineer_client.get("/api/v1/projects")
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_list_projects_accountant_forbidden(accountant_client):
    r = await accountant_client.get("/api/v1/projects")
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_list_projects_no_token(client):
    r = await client.get("/api/v1/projects")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_list_projects_invalid_pagination(admin_client):
    r = await admin_client.get("/api/v1/projects?page=0")
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_get_project_by_id(admin_client, seeded):
    r = await admin_client.get(f"/api/v1/projects/{seeded['project_id']}")
    assert r.status_code == 200
    assert r.json()["data"]["id"] == seeded["project_id"]


@pytest.mark.asyncio
async def test_get_missing_project_404(admin_client):
    r = await admin_client.get("/api/v1/projects/999999")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_create_project_admin(admin_client):
    r = await admin_client.post(
        "/api/v1/projects",
        json={"name": "مشروع الاختبار المؤقت", "location": "الرياض - حي الملقا"},
    )
    assert r.status_code == 200
    assert r.json()["success"] is True


@pytest.mark.asyncio
async def test_create_project_engineer_forbidden(engineer_client):
    r = await engineer_client.post("/api/v1/projects", json={"name": "مشروع محظور"})
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_create_project_empty_name_422(admin_client):
    r = await admin_client.post("/api/v1/projects", json={"name": ""})
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_update_project_pm(project_manager_client, seeded):
    r = await project_manager_client.put(
        f"/api/v1/projects/{seeded['project_id']}",
        json={"name": "مشروع الأمواج السكني (محدّث)"},
    )
    assert r.status_code == 200
    assert r.json()["data"]["name"] == "مشروع الأمواج السكني (محدّث)"


@pytest.mark.asyncio
async def test_delete_project_pm_forbidden(project_manager_client, seeded):
    r = await project_manager_client.delete(f"/api/v1/projects/{seeded['project_id']}")
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_delete_project_admin(admin_client):
    created = (await admin_client.post(
        "/api/v1/projects", json={"name": "مشروع للحذف"},
    )).json()["data"]["id"]
    r = await admin_client.delete(f"/api/v1/projects/{created}")
    assert r.status_code == 200
    r = await admin_client.get(f"/api/v1/projects/{created}")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_delete_missing_project_404(admin_client):
    r = await admin_client.delete("/api/v1/projects/999999")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_update_project_rates_and_summary_uses_them(admin_client, seeded):
    pid = seeded["project_id"]
    r = await admin_client.put(
        f"/api/v1/projects/{pid}",
        json={"profit_percent": 0.0, "vat_rate": 0.0},
    )
    assert r.status_code == 200, r.text
    assert r.json()["data"]["profit_percent"] == 0.0

    s = await admin_client.get(f"/api/v1/boq-summary/project/{pid}")
    assert s.status_code == 200, s.text
    summary = s.json()["data"]["summary"]
    assert summary["rates"]["profit_margin"] == 0.0
    assert summary["rates"]["vat_rate"] == 0.0
    assert summary["custom_rates"] is True
    # profit 0 + vat 0 → total equals pre-vat subtotal math
    assert summary["total"] == round(
        (summary["total_base_cost"] + summary["overhead"]
         + summary["profit"] + summary["contingency"]), 2)


@pytest.mark.asyncio
async def test_update_project_rates_validation(admin_client, seeded):
    r = await admin_client.put(
        f"/api/v1/projects/{seeded['project_id']}",
        json={"profit_percent": 1.5},
    )
    assert r.status_code == 422, r.text
