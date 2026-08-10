# conftest.py — shared fixtures for the test suite
import os
import sys
from pathlib import Path
from uuid import uuid4
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

backend_path = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_path))

# CRITICAL: point the app at an isolated test DB BEFORE any app import,
# otherwise the per-test reset below would wipe the dev database (qb_dev.db).
_TEST_DB = backend_path / "qb_test.db"
os.environ.setdefault("DATABASE_URL", f"sqlite+aiosqlite:///{_TEST_DB.as_posix()}")
os.environ.setdefault("SECRET_KEY", "pytest-secret-key-not-for-production-0123456789abcdef")

from app.main import app, init_db_seed


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Reset DB tables on the dev SQLite DB and re-seed admin."""
    from app.core.database import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    await init_db_seed()


@pytest_asyncio.fixture
async def client():
    """Unauthenticated ASGI client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _login(client: AsyncClient, email: str, password: str) -> str:
    res = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"login failed for {email}: {res.text}"
    return res.json()["data"]["access_token"]


@pytest_asyncio.fixture
async def admin_token(client):
    return await _login(client, "admin@qb.com", "admin123")


@pytest_asyncio.fixture
async def admin_client(admin_token):
    transport = ASGITransport(app=app)
    ac = AsyncClient(transport=transport, base_url="http://test")
    ac.headers.update(_headers(admin_token))
    yield ac
    await ac.aclose()


async def _create_user_for_role(admin_token, role: str, email_prefix: str) -> tuple[str, str]:
    """Admin creates a user of given role, returns (email, password)."""
    email = f"{email_prefix}_{uuid4().hex[:6]}@qb.com"
    password = f"{role}123"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as tmp_client:
        res = await tmp_client.post(
            "/api/v1/users",
            headers=_headers(admin_token),
            json={"email": email, "full_name": f"Test {role}", "password": password, "role": role},
        )
        assert res.status_code == 200, res.text
    return email, password


async def _make_role_client(admin_token, role: str) -> AsyncClient:
    email, password = await _create_user_for_role(admin_token, role, role)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as tmp_client:
        res = await tmp_client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert res.status_code == 200, f"login failed for {role}: {res.text}"
        token = res.json()["data"]["access_token"]
    new_client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    new_client.headers.update(_headers(token))
    return new_client


@pytest_asyncio.fixture
async def project_manager_client(admin_token):
    client = await _make_role_client(admin_token, "project_manager")
    yield client
    await client.aclose()


@pytest_asyncio.fixture
async def engineer_client(admin_token):
    client = await _make_role_client(admin_token, "engineer")
    yield client
    await client.aclose()


@pytest_asyncio.fixture
async def accountant_client(admin_token):
    client = await _make_role_client(admin_token, "accountant")
    yield client
    await client.aclose()


@pytest_asyncio.fixture
async def contractor_client(admin_token):
    client = await _make_role_client(admin_token, "contractor")
    yield client
    await client.aclose()


@pytest_asyncio.fixture
async def seeded():
    """Ids of the demo entities created by init_db_seed (fresh DB per test → deterministic)."""
    from sqlalchemy.future import select
    from app.core.database import AsyncSessionLocal
    from app.models.project import Project
    from app.models.building import Building
    from app.models.stage import Stage
    from app.models.contractor import Contractor
    from app.models.contract import Contract

    async with AsyncSessionLocal() as db:
        project = (await db.execute(select(Project))).scalars().first()
        building = (await db.execute(select(Building))).scalars().first()
        stage = (await db.execute(select(Stage))).scalars().first()
        contractor = (await db.execute(select(Contractor))).scalars().first()
        contract = (await db.execute(select(Contract))).scalars().first()
    return {
        "project_id": project.id,
        "project_name": project.name,
        "building_id": building.id,
        "stage_id": stage.id,
        "contractor_id": contractor.id,
        "contract_id": contract.id,
    }


# ----- entity bootstrap helpers (per-test convenience) -----

async def make_project(client) -> dict:
    res = await client.post("/api/v1/projects", json={"name": "مشروع اختبار", "status": "in_progress"})
    assert res.status_code == 200, res.text
    return res.json()["data"]


async def make_building(client, project_id: int) -> dict:
    res = await client.post("/api/v1/buildings", json={"name": "مبنى الاختبار", "project_id": project_id, "floors_count": 4})
    assert res.status_code == 200, res.text
    return res.json()["data"]


async def make_stage(client, building_id: int, weight_percent: float = 10.0, progress_percent: float = 0.0) -> dict:
    res = await client.post("/api/v1/stages", json={
        "name": "مرحلة الاختبار", "building_id": building_id,
        "weight_percent": weight_percent, "progress_percent": progress_percent,
    })
    assert res.status_code == 200, res.text
    return res.json()["data"]


async def make_contractor(client) -> dict:
    email = f"contractor_{uuid4().hex[:8]}@test.com"
    res = await client.post("/api/v1/contractors", json={"company_name": "مقاول اختبار", "contact_person": "ك", "email": email})
    assert res.status_code == 200, res.text
    return res.json()["data"]


async def make_contract(client, contractor_id: int, building_id: int,
                       total_value: float = 100000.0, retention_percent: float = 10.0) -> dict:
    res = await client.post("/api/v1/contracts", json={
        "contractor_id": contractor_id, "building_id": building_id,
        "title": "عقد اختبار", "total_value": total_value,
        "retention_percent": retention_percent, "status": "active",
    })
    assert res.status_code == 200, res.text
    return res.json()["data"]


async def make_payment(client, contract_id: int, stage_id: int) -> dict:
    res = await client.post("/api/v1/payments", json={
        "contract_id": contract_id, "stage_id": stage_id,
        "amount": 0.0, "notes": "test",
    })
    assert res.status_code == 200, res.text
    return res.json()["data"]


async def make_qc(client, stage_id: int, status: str = "pending") -> dict:
    res = await client.post("/api/v1/quality-checks", json={"stage_id": stage_id, "notes": "qc test"})
    assert res.status_code == 200, res.text
    qc = res.json()["data"]
    if status != "pending":
        res = await client.patch(f"/api/v1/quality-checks/{qc['id']}", json={"status": status, "notes": "qc override"})
        assert res.status_code == 200, res.text
        qc = res.json()["data"]
    return qc