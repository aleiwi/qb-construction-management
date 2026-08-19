"""Social login (OAuth2) tests — provider HTTP calls are mocked via httpx transport.

The redirect callback flow is tested by monkeypatching the exchange in
social_auth_service, and the token (SPA) flow by mocking httpx transport.
"""
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.config import settings
import app.services.social_auth_service as sas


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def _configure_providers(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "test-google-id")
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_SECRET", "test-google-secret")
    monkeypatch.setattr(settings, "FACEBOOK_CLIENT_ID", "")
    monkeypatch.setattr(settings, "FACEBOOK_CLIENT_SECRET", "")
    monkeypatch.setattr(settings, "FRONTEND_URL", "http://localhost:5173")


async def _fake_exchange(provider, code, http=None):
    assert provider == "google"
    if code == "bad-code":
        raise sas.OAuthExchangeError("فشل تبادل رمز التفويض مع المزود")
    return "user_123", "social.user@example.com", "مستخدم اجتماعي"


@pytest.fixture
async def mock_exchange(monkeypatch):
    monkeypatch.setattr(sas, "exchange_code", _fake_exchange)


@pytest.mark.asyncio
async def test_oauth_providers_list_public():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.get("/api/v1/auth/oauth/providers")
        assert r.status_code == 200, r.text
        assert r.json()["data"] == ["google"]


@pytest.mark.asyncio
async def test_oauth_authorize_redirects_to_provider():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", follow_redirects=False) as c:
        r = await c.get("/api/v1/auth/oauth/google")
        assert r.status_code in (302, 307), r.text
        location = r.headers["location"]
        assert location.startswith("https://accounts.google.com/o/oauth2/v2/auth")
        assert "client_id=test-google-id" in location
        assert "redirect_uri=http%3A%2F%2F127.0.0.1%3A8000%2Fapi%2Fv1%2Fauth%2Foauth%2Fgoogle%2Fcallback" in location
        assert "state=" in location


@pytest.mark.asyncio
async def test_oauth_authorize_unconfigured_provider_404():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.get("/api/v1/auth/oauth/facebook")
        assert r.status_code == 404, r.text


@pytest.mark.asyncio
async def test_oauth_authorize_unknown_provider_404():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.get("/api/v1/auth/oauth/twitter")
        assert r.status_code == 404, r.text


@pytest.mark.asyncio
async def test_callback_creates_user_and_redirects_with_tokens(mock_exchange):
    state = sas.create_state_token("google")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", follow_redirects=False) as c:
        r = await c.get("/api/v1/auth/oauth/google/callback", params={"code": "ok-code", "state": state})
        assert r.status_code in (302, 307), r.text
        location = r.headers["location"]
        assert location.startswith("http://localhost:5173/oauth-success?")
        assert "access_token=" in location
        assert "refresh_token=" in location


@pytest.mark.asyncio
async def test_callback_tampered_state_redirects_with_error(mock_exchange):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", follow_redirects=False) as c:
        r = await c.get("/api/v1/auth/oauth/google/callback", params={"code": "ok-code", "state": "forged-state"})
        assert r.status_code in (302, 307), r.text
        assert "error=oauth_failed" in r.headers["location"]


@pytest.mark.asyncio
async def test_callback_exchange_failure_redirects_with_error(mock_exchange):
    state = sas.create_state_token("google")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", follow_redirects=False) as c:
        r = await c.get("/api/v1/auth/oauth/google/callback", params={"code": "bad-code", "state": state})
        assert r.status_code in (302, 307), r.text
        assert "error=oauth_failed" in r.headers["location"]


@pytest.mark.asyncio
async def test_callback_denied_by_user_redirects_with_error(mock_exchange):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", follow_redirects=False) as c:
        r = await c.get("/api/v1/auth/oauth/google/callback", params={"error": "access_denied"})
        assert r.status_code in (302, 307), r.text
        assert "error=oauth_denied" in r.headers["location"]


@pytest.mark.asyncio
async def test_callback_links_existing_user_by_email(mock_exchange):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        login = await c.post("/api/v1/auth/login", json={"email": "admin@qb.com", "password": "admin123"})
        assert login.status_code == 200, login.text
        token = login.json()["data"]["access_token"]
        created = await c.post(
            "/api/v1/users",
            headers=_headers(token),
            json={"email": "social.user@example.com", "full_name": "موجود", "password": "pass123", "role": "accountant"},
        )
        assert created.status_code == 200, created.text
        existing_id = created.json()["data"]["id"]

        state = sas.create_state_token("google")
        r = await c.get("/api/v1/auth/oauth/google/callback", params={"code": "ok-code", "state": state},
                        follow_redirects=False)
        assert r.status_code in (302, 307), r.text

        me = await c.get("/api/v1/auth/me", headers=_headers(r.headers["location"].split("access_token=")[1].split("&")[0]))
        assert me.status_code == 200, me.text
        assert me.json()["data"]["id"] == existing_id


@pytest.mark.asyncio
async def test_token_flow_creates_user(monkeypatch):
    async def fake_fetch(provider, access_token, http=None):
        assert provider == "google"
        if access_token == "invalid":
            raise sas.OAuthExchangeError("فشل جلب بيانات المستخدم من المزود")
        return "user_999", "token.flow@example.com", "تيست"

    monkeypatch.setattr(sas, "fetch_profile", fake_fetch)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post("/api/v1/auth/oauth/google/token", json={"access_token": "valid-token"})
        assert r.status_code == 200, r.text
        data = r.json()["data"]
        assert data["access_token"]
        assert data["refresh_token"]
        assert data["user"]["email"] == "token.flow@example.com"
        assert data["user"]["is_email_verified"] is True

        me = await c.get("/api/v1/auth/me", headers=_headers(data["access_token"]))
        assert me.status_code == 200, me.text
        assert me.json()["data"]["email"] == "token.flow@example.com"

        r2 = await c.post("/api/v1/auth/oauth/google/token", json={"access_token": "valid-token"})
        assert r2.status_code == 200, r2.text
        assert r2.json()["data"]["user"]["email"] == "token.flow@example.com"


@pytest.mark.asyncio
async def test_token_flow_rejects_invalid_provider_token(monkeypatch):
    async def fake_fetch(provider, access_token, http=None):
        raise sas.OAuthExchangeError("فشل جلب بيانات المستخدم من المزود")

    monkeypatch.setattr(sas, "fetch_profile", fake_fetch)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post("/api/v1/auth/oauth/google/token", json={"access_token": "invalid"})
        assert r.status_code == 400, r.text