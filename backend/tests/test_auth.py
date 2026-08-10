"""Authentication & token lifecycle tests."""
import pytest


@pytest.mark.asyncio
async def test_login_success_admin(client):
    r = await client.post("/api/v1/auth/login", json={"email": "admin@qb.com", "password": "admin123"})
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["data"]["access_token"]
    assert body["data"]["refresh_token"]


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    r = await client.post("/api/v1/auth/login", json={"email": "admin@qb.com", "password": "wrong-pass"})
    assert r.status_code == 401
    assert r.json()["success"] is False
    assert r.json()["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_login_unknown_user(client):
    r = await client.post("/api/v1/auth/login", json={"email": "ghost@qb.com", "password": "x"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_login_missing_fields_validation_error(client):
    r = await client.post("/api/v1/auth/login", json={"email": "not-an-email"})
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_me_returns_current_user(client, admin_token):
    r = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert r.json()["data"]["email"] == "admin@qb.com"


@pytest.mark.asyncio
async def test_me_without_token(client):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_me_invalid_token(client):
    r = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not.a.jwt"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_flow(client):
    login = (await client.post("/api/v1/auth/login", json={"email": "pm@qb.com", "password": "pm123"})).json()["data"]
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": login["refresh_token"]})
    assert r.status_code == 200
    assert r.json()["data"]["access_token"]


@pytest.mark.asyncio
async def test_refresh_with_invalid_token(client):
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": "garbage"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_me_context_admin(client, admin_token):
    r = await client.get("/api/v1/auth/me/context", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    body = r.json()["data"]
    assert body["role"] == "admin"
    assert body["total_projects"] >= 1
    assert body["total_contracts"] >= 1


@pytest.mark.asyncio
async def test_me_context_contractor_linked(client):
    """Seeded contractor user (full_name matches company) → linked contractor context."""
    login = (await client.post(
        "/api/v1/auth/login",
        json={"email": "contractor@qb.com", "password": "contractor123"},
    )).json()["data"]
    r = await client.get("/api/v1/auth/me/context", headers={"Authorization": f"Bearer {login['access_token']}"})
    assert r.status_code == 200
    body = r.json()["data"]
    assert body["role"] == "contractor"
    assert body["linked_contractor"] is not None
    assert body["linked_contractor"]["company_name"] == "مؤسسة المقاول الذهبية"
