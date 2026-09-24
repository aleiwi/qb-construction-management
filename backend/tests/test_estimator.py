"""Estimator merge (legacy QuantumBuild calculator): stateless compute."""
import pytest


@pytest.mark.asyncio
async def test_catalog_lists_villa_items(admin_client):
    res = await admin_client.get("/api/v1/estimate/catalog")
    assert res.status_code == 200, res.text
    items = res.json()["data"]
    names = {i["name"] for i in items}
    assert {"القواعد", "الميدا", "الأرضي", "كل المصاعد"} <= names
    assert all(i["steel_ratio"] >= 0 for i in items)


@pytest.mark.asyncio
async def test_calculate_known_quantities(admin_client):
    payload = {
        "items": [
            {"name": "القواعد", "length": 10, "width": 5, "thickness": 0.5},
            {"name": "الميدا", "length": 20, "width": 0, "thickness": 0.3},
        ],
        "prices": {"concrete_price": 400, "steel_price": 3000, "block_price": 5},
    }
    res = await admin_client.post("/api/v1/estimate/calculate", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()["data"]
    foot = next(i for i in data["items"] if i["name"] == "القواعد")
    assert foot["concrete_m3"] == pytest.approx(25.0)
    assert foot["steel_tons"] == pytest.approx(3.75)  # 25 * 150 / 1000
    assert foot["blocks"] == 0.0
    assert foot["total_cost"] == pytest.approx(25 * 400 + 3.75 * 3000)
    mida = next(i for i in data["items"] if i["name"] == "الميدا")
    assert mida["blocks"] == pytest.approx((0.4 / 20) * 2)
    assert data["totals"]["materials_cost"] == pytest.approx(
        foot["total_cost"] + mida["total_cost"]
    )


@pytest.mark.asyncio
async def test_calculate_totals_profit_formula(admin_client):
    payload = {
        "items": [{"name": "الأرضي", "length": 10, "width": 8, "thickness": 0.3}],
        "prices": {
            "concrete_price": 400, "steel_price": 3000, "block_price": 5,
            "factory_rate": 100, "overhead": 500, "profit_rate": 10,
            "backfill_qty": 10, "backfill_price": 20,
            "insulation_qty": 5, "insulation_price": 30,
        },
    }
    res = await admin_client.post("/api/v1/estimate/calculate", json=payload)
    assert res.status_code == 200, res.text
    t = res.json()["data"]["totals"]
    # concrete=24, steel=2.88, area=10
    assert t["concrete_m3"] == pytest.approx(24.0)
    assert t["area_m2"] == pytest.approx(10.0)
    before = t["materials_cost"] + 10 * 100 + 500 + 200 + 150
    assert t["total_before_profit"] == pytest.approx(before)
    assert t["final_price"] == pytest.approx(before * 1.1)
    assert t["profit"] == pytest.approx(before * 0.1)
    assert t["cost_per_m2"] == pytest.approx(before / 10)


@pytest.mark.asyncio
async def test_calculate_rejects_unknown_item(admin_client):
    res = await admin_client.post("/api/v1/estimate/calculate", json={
        "items": [{"name": "بند وهمي", "length": 1, "width": 1, "thickness": 1}],
        "prices": {},
    })
    assert res.status_code == 422, res.text


@pytest.mark.asyncio
async def test_calculate_rejects_negative(admin_client):
    res = await admin_client.post("/api/v1/estimate/calculate", json={
        "items": [{"name": "القواعد", "length": -5, "width": 1, "thickness": 1}],
        "prices": {},
    })
    assert res.status_code == 422, res.text


@pytest.mark.asyncio
async def test_estimator_rbac(accountant_client, contractor_client):
    res = await accountant_client.get("/api/v1/estimate/catalog")
    assert res.status_code == 200, res.text
    res = await contractor_client.post("/api/v1/estimate/calculate", json={"items": [], "prices": {}})
    assert res.status_code == 403, res.text
