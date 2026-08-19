"""M5: Row-Level Security (RLS) tests.

A user linked to project A (via user_projects) may only access entities of
project A; project B entities must return 403.
Users with no project links yet remain unrestricted (legacy/compat mode).
"""
import pytest
from httpx import ASGITransport, AsyncClient
from uuid import uuid4

from app.main import app


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _login(email: str, password: str) -> str:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert r.status_code == 200, r.text
        return r.json()["data"]["access_token"]


async def _create_user(admin_token: str, role: str, project_ids: list[int], prefix: str = "rls") -> tuple[str, str]:
    email = f"{prefix}_{role}_{uuid4().hex[:6]}@qb.com"
    password = f"{role}123"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post(
            "/api/v1/users",
            headers=_headers(admin_token),
            json={"email": email, "full_name": f"RLS {role}", "password": password, "role": role, "project_ids": project_ids},
        )
        assert r.status_code == 200, r.text
    return email, password


async def _make_client(email: str, password: str) -> AsyncClient:
    token = await _login(email, password)
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers.update(_headers(token))
    return c


async def _new_project(admin_client: AsyncClient, name: str) -> int:
    r = await admin_client.post("/api/v1/projects", json={"name": name, "status": "in_progress"})
    assert r.status_code == 200, r.text
    return r.json()["data"]["id"]


async def _new_building(admin_client: AsyncClient, project_id: int, name: str = "مبنى") -> int:
    r = await admin_client.post("/api/v1/buildings", json={"name": name, "project_id": project_id, "floors_count": 4})
    assert r.status_code == 200, r.text
    return r.json()["data"]["id"]


async def _new_stage(admin_client: AsyncClient, building_id: int, name: str = "مرحلة") -> int:
    r = await admin_client.post("/api/v1/stages", json={"name": name, "building_id": building_id, "weight_percent": 10, "progress_percent": 0})
    assert r.status_code == 200, r.text
    return r.json()["data"]["id"]


async def _new_contractor(admin_client: AsyncClient) -> int:
    r = await admin_client.post(
        "/api/v1/contractors",
        json={"company_name": f"شركة {uuid4().hex[:6]}", "contact_person": "ك", "email": f"{uuid4().hex[:6]}@contractor.com"},
    )
    assert r.status_code == 200, r.text
    return r.json()["data"]["id"]


async def _new_contract(admin_client: AsyncClient, contractor_id: int, building_id: int) -> int:
    r = await admin_client.post(
        "/api/v1/contracts",
        json={"title": "عقد", "contractor_id": contractor_id, "building_id": building_id, "total_value": 100000, "retention_percent": 5, "status": "active"},
    )
    assert r.status_code == 200, r.text
    return r.json()["data"]["id"]


async def _new_qc(admin_client: AsyncClient, stage_id: int) -> int:
    r = await admin_client.post("/api/v1/quality-checks", json={"stage_id": stage_id, "notes": "فحص"})
    assert r.status_code == 200, r.text
    return r.json()["data"]["id"]


async def _new_report(admin_client: AsyncClient, project_id: int) -> int:
    r = await admin_client.post(
        "/api/v1/completion-reports",
        json={
            "project_id": project_id,
            "report_period": "سبتمبر 2026",
            "period_type": "monthly",
            "status": "draft",
            "report_data": {"structureItems": [{"name": "القواعد", "progress": 40}], "finishingItems": [{"name": "التشطيبات", "progress": 10}]},
        },
    )
    assert r.status_code == 200, r.text
    return r.json()["data"]["id"]


@pytest.mark.asyncio
async def test_linked_user_sees_only_own_projects_in_list(admin_client):
    pa = await _new_project(admin_client, "مشروع أ")
    await _new_project(admin_client, "مشروع ب")
    email, password = await _create_user(admin_token=admin_client.headers["Authorization"].split()[1], role="engineer", project_ids=[pa])
    client = await _make_client(email, password)
    try:
        r = await client.get("/api/v1/projects")
        assert r.status_code == 200, r.text
        ids = [p["id"] for p in r.json()["data"]]
        assert ids == [pa], f"expected only project {pa}, got {ids}"
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_linked_user_blocked_from_other_project_project_entity(admin_client):
    token = admin_client.headers["Authorization"].split()[1]
    pa = await _new_project(admin_client, "مشروع أ")
    pb = await _new_project(admin_client, "مشروع ب")
    email, password = await _create_user(token, "engineer", [pa])
    client = await _make_client(email, password)
    try:
        r = await client.get(f"/api/v1/projects/{pb}")
        assert r.status_code == 403, r.text
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_linked_user_blocked_from_other_project_building(admin_client):
    token = admin_client.headers["Authorization"].split()[1]
    pa = await _new_project(admin_client, "مشروع أ")
    pb = await _new_project(admin_client, "مشروع ب")
    b_pb = await _new_building(admin_client, pb)
    email, password = await _create_user(token, "engineer", [pa])
    client = await _make_client(email, password)
    try:
        r = await client.get(f"/api/v1/buildings/{b_pb}")
        assert r.status_code == 403, r.text
        r2 = await client.put(f"/api/v1/buildings/{b_pb}", json={"name": "اختراق", "type": "residential", "floors": 3})
        assert r2.status_code == 403, r2.text
        r3 = await client.delete(f"/api/v1/buildings/{b_pb}")
        assert r3.status_code == 403, r3.text
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_linked_user_blocked_from_other_project_drawing(admin_client):
    token = admin_client.headers["Authorization"].split()[1]
    pa = await _new_project(admin_client, "مشروع أ")
    pb = await _new_project(admin_client, "مشروع ب")
    b_pb = await _new_building(admin_client, pb)
    email, password = await _create_user(token, "engineer", [pa])
    client = await _make_client(email, password)
    try:
        r = await client.get("/api/v1/drawings", params={"building_id": b_pb})
        assert r.status_code == 403, r.text
        r2 = await client.get("/api/v1/drawings")
        assert r2.status_code == 200, r2.text
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_linked_user_blocked_from_other_project_contract_and_payment(admin_client):
    token = admin_client.headers["Authorization"].split()[1]
    pa = await _new_project(admin_client, "مشروع أ")
    pb = await _new_project(admin_client, "مشروع ب")
    b_pb = await _new_building(admin_client, pb)
    contractor = await _new_contractor(admin_client)
    contract_pb = await _new_contract(admin_client, contractor, b_pb)
    email, password = await _create_user(token, "accountant", [pa])
    client = await _make_client(email, password)
    try:
        r = await client.get(f"/api/v1/contracts/{contract_pb}")
        assert r.status_code == 403, r.text
        r2 = await client.get("/api/v1/contracts")
        assert r2.status_code == 200, r2.text
        assert contract_pb not in [c["id"] for c in r2.json()["data"]]
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_linked_user_blocked_from_other_project_qc_and_report(admin_client):
    token = admin_client.headers["Authorization"].split()[1]
    pa = await _new_project(admin_client, "مشروع أ")
    pb = await _new_project(admin_client, "مشروع ب")
    b_pb = await _new_building(admin_client, pb)
    s_pb = await _new_stage(admin_client, b_pb)
    qc_pb = await _new_qc(admin_client, s_pb)
    report_pb = await _new_report(admin_client, pb)
    email, password = await _create_user(token, "engineer", [pa])
    client = await _make_client(email, password)
    try:
        r = await client.get(f"/api/v1/quality-checks/{qc_pb}")
        assert r.status_code == 403, r.text
        r2 = await client.get("/api/v1/quality-checks")
        assert r2.status_code == 200, r2.text
        assert qc_pb not in [q["id"] for q in r2.json()["data"]]
        r3 = await client.get(f"/api/v1/completion-reports/{report_pb}")
        assert r3.status_code == 403, r3.text
        r4 = await client.get(f"/api/v1/completion-reports", params={"project_id": pb})
        assert r4.status_code == 403, r4.text
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_contractor_auto_link_on_user_creation(admin_client):
    """Creating a CONTRACTOR user with the same email as a contractor record
    auto-links the account (M4). The contractor then sees only his own records."""
    token = admin_client.headers["Authorization"].split()[1]
    contractor_email = f"contractor_{uuid4().hex[:6]}@qb.com"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post(
            "/api/v1/contractors",
            headers=_headers(token),
            json={"company_name": "شركة الربط", "contact_person": "ك", "email": contractor_email},
        )
        assert r.status_code == 200, r.text
        contractor_id = r.json()["data"]["id"]

    pa = await _new_project(admin_client, "مشروع أ")
    pb = await _new_project(admin_client, "مشروع ب")
    b_pa = await _new_building(admin_client, pa)
    b_pb = await _new_building(admin_client, pb)
    my_contract = await _new_contract(admin_client, contractor_id, b_pa)
    other_contractor = await _new_contractor(admin_client)
    other_contract = await _new_contract(admin_client, other_contractor, b_pb)

    password = "contractor123"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post(
            "/api/v1/users",
            headers=_headers(token),
            json={"email": contractor_email, "full_name": "ربط مقاول", "password": password, "role": "contractor", "project_ids": []},
        )
        assert r.status_code == 200, r.text
    client = await _make_client(contractor_email, password)
    try:
        r = await client.get("/api/v1/contractors")
        assert r.status_code == 200, r.text
        assert contractor_id in [x["id"] for x in r.json()["data"]]

        r2 = await client.get(f"/api/v1/contractors/{contractor_id}")
        assert r2.status_code == 200, r2.text

        r3 = await client.get("/api/v1/contracts")
        assert r3.status_code == 200, r3.text
        ids = [x["id"] for x in r3.json()["data"]]
        assert my_contract in ids and other_contract not in ids, f"contracts {ids}"

        r4 = await client.get(f"/api/v1/contracts/{other_contract}")
        assert r4.status_code == 404, r4.text

        r5 = await client.get(f"/api/v1/contracts/{my_contract}")
        assert r5.status_code == 200, r5.text

        r6 = await client.get("/api/v1/payments")
        assert r6.status_code == 200, r6.text
        assert all(p["contract_id"] == my_contract for p in r6.json()["data"])
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_contractor_unlinked_user_gets_no_contracts(admin_client):
    """A contractor user with no matching contractor record sees nothing."""
    token = admin_client.headers["Authorization"].split()[1]
    email, password = await _create_user(token, "contractor", [])
    client = await _make_client(email, password)
    try:
        r = await client.get("/api/v1/contracts")
        assert r.status_code == 200, r.text
        assert r.json()["data"] == []
        r2 = await client.get("/api/v1/payments")
        assert r2.status_code == 200, r2.text
        assert r2.json()["data"] == []
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_contractor_auto_link_reverse_on_contractor_creation(admin_client):
    """Creating a contractor record whose email matches an existing
    CONTRACTOR user auto-links it too."""
    token = admin_client.headers["Authorization"].split()[1]
    email, password = await _create_user(token, "contractor", [])
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post(
            "/api/v1/contractors",
            headers=_headers(token),
            json={"company_name": "شركة عكسية", "contact_person": "ك", "email": email},
        )
        assert r.status_code == 200, r.text
        contractor_id = r.json()["data"]["id"]
    client = await _make_client(email, password)
    try:
        r = await client.get(f"/api/v1/contractors/{contractor_id}")
        assert r.status_code == 200, r.text
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_unlinked_user_unrestricted_legacy_compat(admin_client):
    token = admin_client.headers["Authorization"].split()[1]
    pa = await _new_project(admin_client, "مشروع أ")
    email, password = await _create_user(token, "engineer", [])
    client = await _make_client(email, password)
    try:
        r = await client.get(f"/api/v1/projects/{pa}")
        assert r.status_code == 200, r.text
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_linked_user_can_access_own_project_entities(admin_client):
    token = admin_client.headers["Authorization"].split()[1]
    pa = await _new_project(admin_client, "مشروع أ")
    b_pa = await _new_building(admin_client, pa)
    s_pa = await _new_stage(admin_client, b_pa)
    contractor = await _new_contractor(admin_client)
    contract_pa = await _new_contract(admin_client, contractor, b_pa)
    qc_pa = await _new_qc(admin_client, s_pa)
    report_pa = await _new_report(admin_client, pa)
    email, password = await _create_user(token, "project_manager", [pa])
    client = await _make_client(email, password)
    try:
        assert (await client.get(f"/api/v1/projects/{pa}")).status_code == 200
        assert (await client.get(f"/api/v1/buildings/{b_pa}")).status_code == 200
        assert (await client.get(f"/api/v1/contracts/{contract_pa}")).status_code == 200
        assert (await client.get(f"/api/v1/quality-checks/{qc_pa}")).status_code == 200
        assert (await client.get(f"/api/v1/completion-reports/{report_pa}")).status_code == 200
        r = await client.get(f"/api/v1/completion-reports", params={"project_id": pa})
        assert r.status_code == 200, r.text
    finally:
        await client.aclose()