import pytest

from app.core.config import settings
from app.main import init_db_seed


async def _try_login(client, email: str, password: str):
    return await client.post("/api/v1/auth/login", json={"email": email, "password": password})


async def test_failed_attempts_lock_account(client, monkeypatch):
    """5 failed logins lock the account; even correct credentials are refused."""
    monkeypatch.setattr(settings, "MAX_FAILED_LOGIN_ATTEMPTS", 5)
    monkeypatch.setattr(settings, "ACCOUNT_LOCKOUT_MINUTES", 15)

    for _ in range(4):
        res = await _try_login(client, "admin@qb.com", "wrong-password")
        assert res.status_code == 401, res.text

    res = await _try_login(client, "admin@qb.com", "wrong-password")
    assert res.status_code == 403, res.text
    assert "قفل" in res.json()["error"]["message"]

    res = await _try_login(client, "admin@qb.com", "admin123")
    assert res.status_code == 403, res.text
    assert "قفل" in res.json()["error"]["message"]


async def test_lockout_is_audit_logged(client, monkeypatch, admin_token):
    monkeypatch.setattr(settings, "MAX_FAILED_LOGIN_ATTEMPTS", 3)
    monkeypatch.setattr(settings, "ACCOUNT_LOCKOUT_MINUTES", 15)

    for _ in range(3):
        await _try_login(client, "admin@qb.com", "wrong-password")

    res = await client.get(
        "/api/v1/audit-logs",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200, res.text
    logs = res.json()["data"]
    assert any(
        log["action"] == "user_locked" and log["entity_type"] == "user" for log in logs
    ), "lockout event must be recorded in audit log"


async def test_successful_login_resets_failed_attempts(client, monkeypatch):
    monkeypatch.setattr(settings, "MAX_FAILED_LOGIN_ATTEMPTS", 5)
    monkeypatch.setattr(settings, "ACCOUNT_LOCKOUT_MINUTES", 15)

    await _try_login(client, "admin@qb.com", "wrong-1")
    await _try_login(client, "admin@qb.com", "wrong-2")

    res = await _try_login(client, "admin@qb.com", "admin123")
    assert res.status_code == 200, res.text

    for _ in range(4):
        res = await _try_login(client, "admin@qb.com", "wrong-again")
        assert res.status_code == 401, res.text

    res = await _try_login(client, "admin@qb.com", "admin123")
    assert res.status_code == 200, "counter must have been reset by the successful login"


async def test_rate_limit_blocks_excessive_logins(client, monkeypatch):
    """In production, >N login requests per window from one IP → 429."""
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "LOGIN_RATE_LIMIT_ATTEMPTS", 3)
    monkeypatch.setattr(settings, "LOGIN_RATE_LIMIT_WINDOW_SECONDS", 60)

    for _ in range(3):
        res = await _try_login(client, "admin@qb.com", "wrong-password")
        assert res.status_code == 401, res.text

    res = await _try_login(client, "admin@qb.com", "admin123")
    assert res.status_code == 429, res.text


async def test_production_startup_refuses_default_admin(monkeypatch):
    """In production, init_db_seed must fail if the default admin still uses the default password."""
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    with pytest.raises(RuntimeError):
        await init_db_seed()