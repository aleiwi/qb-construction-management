"""M3 tests: password reset + email verification flows."""
import pytest

from app.core.config import settings
from app.main import init_db_seed


async def _token_from_log(caplog, needle: str) -> str:
    """The dev email transport logs the link; extract the JWT from it."""
    import re
    for record in caplog.records:
        if needle in record.message:
            match = re.search(r"token=([A-Za-z0-9_\-\.]+)", record.message)
            if match:
                return match.group(1)
    raise AssertionError(f"no {needle} token found in logs")


async def test_forgot_password_sends_reset_email(client, caplog):
    caplog.set_level("INFO")
    res = await client.post("/api/v1/auth/forgot-password", json={"email": "admin@qb.com"})
    assert res.status_code == 200, res.text
    assert "EMAIL-DEV" in caplog.text
    token = await _token_from_log(caplog, "إعادة تعيين كلمة المرور")
    assert token


async def test_forgot_password_does_not_enumerate_emails(client):
    res = await client.post("/api/v1/auth/forgot-password", json={"email": "nonexistent@nowhere.com"})
    assert res.status_code == 200, res.text


async def test_reset_password_full_flow(client, caplog):
    caplog.set_level("INFO")
    await client.post("/api/v1/auth/forgot-password", json={"email": "admin@qb.com"})
    token = await _token_from_log(caplog, "إعادة تعيين كلمة المرور")

    res = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "new-secure-pass-2026"},
    )
    assert res.status_code == 200, res.text

    res = await client.post("/api/v1/auth/login", json={"email": "admin@qb.com", "password": "new-secure-pass-2026"})
    assert res.status_code == 200, "login with new password must work"

    res = await client.post("/api/v1/auth/login", json={"email": "admin@qb.com", "password": "admin123"})
    assert res.status_code == 401, "old password must no longer work"


async def test_reset_password_rejects_short_password(client, caplog):
    caplog.set_level("INFO")
    await client.post("/api/v1/auth/forgot-password", json={"email": "admin@qb.com"})
    token = await _token_from_log(caplog, "إعادة تعيين كلمة المرور")
    res = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "short"},
    )
    assert res.status_code == 422, res.text


async def test_reset_password_rejects_invalid_token(client):
    res = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": "not-a-valid-token", "new_password": "some-secure-pass-123"},
    )
    assert res.status_code == 401, res.text


async def test_verify_email_flow(client, caplog):
    caplog.set_level("INFO")
    admin_login = await client.post("/api/v1/auth/login", json={"email": "admin@qb.com", "password": "admin123"})
    token = admin_login.json()["data"]["access_token"]

    res = await client.post(
        "/api/v1/users",
        json={"email": "verify-me@qb.com", "full_name": "مستخدم تفعيل", "password": "temp123", "role": "engineer"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200, res.text
    assert res.json()["data"]["is_email_verified"] is False

    verify_token = await _token_from_log(caplog, "تفعيل حسابك")
    res = await client.post("/api/v1/auth/verify-email", json={"token": verify_token})
    assert res.status_code == 200, res.text

    res = await client.post("/api/v1/auth/login", json={"email": "verify-me@qb.com", "password": "temp123"})
    assert res.status_code == 200, res.text