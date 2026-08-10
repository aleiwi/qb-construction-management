"""Contracts & payments: CRUD, RBAC, zero-value edge, negative-amount validation."""
import pytest


@pytest.mark.asyncio
async def test_list_contracts_admin(admin_client):
    r = await admin_client.get("/api/v1/contracts")
    assert r.status_code == 200
    assert len(r.json()["data"]) >= 1


@pytest.mark.asyncio
async def test_list_contracts_engineer_forbidden(engineer_client):
    r = await engineer_client.get("/api/v1/contracts")
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_create_contract_admin(admin_client, seeded):
    r = await admin_client.post(
        "/api/v1/contracts",
        json={
            "title": "عقد اختبار المراحل",
            "contractor_id": seeded["contractor_id"],
            "building_id": seeded["building_id"],
            "total_value": 250000.0,
            "retention_percent": 10.0,
        },
    )
    assert r.status_code == 200
    assert r.json()["data"]["id"]


@pytest.mark.asyncio
async def test_create_contract_zero_value_edge(admin_client, seeded):
    """Edge case per testing-conventions: zero monetary value is allowed."""
    r = await admin_client.post(
        "/api/v1/contracts",
        json={"title": "عقد بقيمة صفرية", "contractor_id": seeded["contractor_id"],
              "building_id": seeded["building_id"], "total_value": 0.0},
    )
    assert r.status_code == 200
    assert r.json()["data"]["total_value"] == 0.0


@pytest.mark.asyncio
async def test_create_contract_negative_value_422(admin_client, seeded):
    r = await admin_client.post(
        "/api/v1/contracts",
        json={"title": "عقد سالب", "contractor_id": seeded["contractor_id"],
              "building_id": seeded["building_id"], "total_value": -5000.0},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_create_contract_engineer_forbidden(engineer_client, seeded):
    r = await engineer_client.post(
        "/api/v1/contracts",
        json={"title": "عقد محظور", "contractor_id": seeded["contractor_id"],
              "building_id": seeded["building_id"]},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_create_contract_missing_building_404(admin_client, seeded):
    r = await admin_client.post(
        "/api/v1/contracts",
        json={"title": "عقد لمبنى وهمي", "contractor_id": seeded["contractor_id"], "building_id": 999999},
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_create_payment_flow(admin_client, accountant_client, project_manager_client, seeded):
    """Payment is auto-calculated from stage progress; net = amount − retention."""
    r = await accountant_client.post(
        "/api/v1/payments",
        json={"contract_id": seeded["contract_id"], "stage_id": seeded["stage_id"], "notes": "دفعة اختبار"},
    )
    assert r.status_code == 200
    body = r.json()["data"]
    assert body["net_amount"] >= 0
    assert body["status"] in ("pending", "draft")
    payment_id = body["id"]
    got = await project_manager_client.get(f"/api/v1/payments/{payment_id}")
    assert got.status_code == 200
    assert got.json()["data"]["id"] == payment_id


@pytest.mark.asyncio
async def test_create_payment_negative_amount_422(accountant_client, seeded):
    r = await accountant_client.post(
        "/api/v1/payments",
        json={"contract_id": seeded["contract_id"], "stage_id": seeded["stage_id"], "amount": -100},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_list_payments_engineer_forbidden(engineer_client):
    r = await engineer_client.get("/api/v1/payments")
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_list_payments_accountant_ok(accountant_client):
    r = await accountant_client.get("/api/v1/payments")
    assert r.status_code == 200
