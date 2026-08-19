"""M4 tests: user management (invites, projects link, disable, change password)."""
import pytest


async def _admin_login(client) -> str:
    res = await client.post("/api/v1/auth/login", json={"email": "admin@qb.com", "password": "admin123"})
    assert res.status_code == 200, res.text
    return res.json()["data"]["access_token"]


async def _create_user(client, admin_token, email: str, project_ids=None, role="engineer"):
    res = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "email": email,
            "full_name": "مستخدم اختبار",
            "password": "pass1234",
            "role": role,
            "project_ids": project_ids,
        },
    )
    assert res.status_code == 200, res.text
    return res.json()["data"]


async def test_create_user_with_projects(client, seeded):
    token = await _admin_login(client)
    user = await _create_user(client, token, "eng-with-projects@qb.com", project_ids=[seeded["project_id"]])
    assert user["project_ids"] == [seeded["project_id"]]


async def test_get_users_includes_project_ids(client, seeded):
    token = await _admin_login(client)
    await _create_user(client, token, "eng-list@qb.com", project_ids=[seeded["project_id"]])
    res = await client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, res.text
    target = next(u for u in res.json()["data"] if u["email"] == "eng-list@qb.com")
    assert target["project_ids"] == [seeded["project_id"]]


async def test_update_user_role_and_projects(client, seeded):
    token = await _admin_login(client)
    user = await _create_user(client, token, "eng-update@qb.com", project_ids=[])

    res = await client.patch(
        f"/api/v1/users/{user['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={"role": "accountant", "project_ids": [seeded["project_id"]]},
    )
    assert res.status_code == 200, res.text
    assert res.json()["data"]["role"] == "accountant"
    assert res.json()["data"]["project_ids"] == [seeded["project_id"]]

    # audit log records the change
    logs = await client.get("/api/v1/audit-logs", headers={"Authorization": f"Bearer {token}"})
    assert any(l["action"] == "user_updated" for l in logs.json()["data"])


async def test_disable_user_blocks_login(client):
    token = await _admin_login(client)
    user = await _create_user(client, token, "disable-me@qb.com")

    res = await client.patch(
        f"/api/v1/users/{user['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={"is_active": False},
    )
    assert res.status_code == 200, res.text

    res = await client.post("/api/v1/auth/login", json={"email": "disable-me@qb.com", "password": "pass1234"})
    assert res.status_code == 403, res.text


async def test_admin_cannot_disable_self(client):
    token = await _admin_login(client)
    me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    res = await client.patch(
        f"/api/v1/users/{me.json()['data']['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={"is_active": False},
    )
    assert res.status_code == 400, res.text


async def test_resend_invite(client):
    token = await _admin_login(client)
    user = await _create_user(client, token, "resend-invite@qb.com")
    res = await client.post(
        f"/api/v1/users/{user['id']}/resend-invite",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200, res.text


async def test_non_admin_cannot_manage_users(client, engineer_client):
    res = await engineer_client.get("/api/v1/users")
    assert res.status_code == 403, res.text
    res = await engineer_client.post("/api/v1/users", json={"email": "x@qb.com", "full_name": "x", "password": "pass1234"})
    assert res.status_code == 403, res.text


async def test_my_projects_endpoint(client, seeded):
    token = await _admin_login(client)
    await _create_user(client, token, "context-user@qb.com", project_ids=[seeded["project_id"]])
    login = await client.post("/api/v1/auth/login", json={"email": "context-user@qb.com", "password": "pass1234"})
    my_token = login.json()["data"]["access_token"]

    res = await client.get("/api/v1/users/me/projects", headers={"Authorization": f"Bearer {my_token}"})
    assert res.status_code == 200, res.text
    assert res.json()["data"] == [seeded["project_id"]]

    ctx = await client.get("/api/v1/auth/me/context", headers={"Authorization": f"Bearer {my_token}"})
    assert ctx.json()["data"]["allowed_project_ids"] == [seeded["project_id"]]


async def test_change_password_flow(client):
    res = await client.post("/api/v1/auth/login", json={"email": "pm@qb.com", "password": "pm123"})
    token = res.json()["data"]["access_token"]

    res = await client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "wrong", "new_password": "newpass12345"},
    )
    assert res.status_code == 400, res.text

    res = await client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "pm123", "new_password": "newpass12345"},
    )
    assert res.status_code == 200, res.text

    res = await client.post("/api/v1/auth/login", json={"email": "pm@qb.com", "password": "newpass12345"})
    assert res.status_code == 200, res.text