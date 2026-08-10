import pytest
from conftest import make_project, make_building, make_stage, make_contractor, make_contract


@pytest.mark.asyncio
async def test_payment_approve_creates_audit_log(admin_client):
    """Approving a payment must create an audit log entry."""
    from conftest import make_payment
    from app.models.quality_check import QualityCheck, QCStatus
    from app.core.database import AsyncSessionLocal

    proj = await make_project(admin_client)
    b = await make_building(admin_client, proj["id"])
    s = await make_stage(admin_client, b["id"], weight_percent=50.0, progress_percent=100.0)
    ct = await make_contractor(admin_client)
    contract = await make_contract(admin_client, ct["id"], b["id"])

    async with AsyncSessionLocal() as db:
        qc = QualityCheck(stage_id=s["id"], inspected_by=1, status=QCStatus.PASSED)
        db.add(qc)
        await db.commit()

    pay = await make_payment(admin_client, contract["id"], s["id"])
    res = await admin_client.patch(f"/api/v1/payments/{pay['id']}/approve")
    assert res.status_code == 200, res.text

    logs = await admin_client.get("/api/v1/audit-logs?entity_type=payment&entity_id=" + str(pay["id"]))
    assert logs.status_code == 200, logs.text
    items = logs.json()["data"]
    assert len(items) >= 1
    entry = items[0]
    assert entry["action"] == "payment.approve"
    assert entry["entity_type"] == "payment"
    assert entry["entity_id"] == pay["id"]
    assert entry["new_value"] is not None
    assert "approved" in entry["new_value"].lower()


@pytest.mark.asyncio
async def test_payment_mark_paid_creates_audit_log(admin_client):
    from conftest import make_payment
    from app.models.quality_check import QualityCheck, QCStatus
    from app.core.database import AsyncSessionLocal

    proj = await make_project(admin_client)
    b = await make_building(admin_client, proj["id"])
    s = await make_stage(admin_client, b["id"], weight_percent=50.0, progress_percent=100.0)
    ct = await make_contractor(admin_client)
    contract = await make_contract(admin_client, ct["id"], b["id"])

    async with AsyncSessionLocal() as db:
        qc = QualityCheck(stage_id=s["id"], inspected_by=1, status=QCStatus.PASSED)
        db.add(qc)
        await db.commit()

    pay = await make_payment(admin_client, contract["id"], s["id"])
    await admin_client.patch(f"/api/v1/payments/{pay['id']}/approve")
    res = await admin_client.patch(f"/api/v1/payments/{pay['id']}/mark-paid")
    assert res.status_code == 200, res.text

    logs = await admin_client.get(f"/api/v1/audit-logs?entity_type=payment&entity_id={pay['id']}")
    items = logs.json()["data"]
    actions = [e["action"] for e in items]
    assert "payment.mark_paid" in actions


@pytest.mark.asyncio
async def test_audit_logs_admin_only(admin_client, engineer_client):
    """GET /audit-logs — admin gets 200, engineer gets 403."""
    res_admin = await admin_client.get("/api/v1/audit-logs")
    assert res_admin.status_code == 200, res_admin.text

    res_eng = await engineer_client.get("/api/v1/audit-logs")
    assert res_eng.status_code == 403, f"engineer expected 403, got {res_eng.status_code}"


@pytest.mark.asyncio
async def test_audit_log_stores_old_and_new_value(admin_client):
    from conftest import make_payment
    from app.models.quality_check import QualityCheck, QCStatus
    from app.core.database import AsyncSessionLocal

    proj = await make_project(admin_client)
    b = await make_building(admin_client, proj["id"])
    s = await make_stage(admin_client, b["id"], weight_percent=50.0, progress_percent=100.0)
    ct = await make_contractor(admin_client)
    contract = await make_contract(admin_client, ct["id"], b["id"])

    async with AsyncSessionLocal() as db:
        qc = QualityCheck(stage_id=s["id"], inspected_by=1, status=QCStatus.PASSED)
        db.add(qc)
        await db.commit()

    pay = await make_payment(admin_client, contract["id"], s["id"])
    await admin_client.patch(f"/api/v1/payments/{pay['id']}/approve")

    logs = await admin_client.get(f"/api/v1/audit-logs?entity_type=payment&entity_id={pay['id']}")
    entry = logs.json()["data"][0]
    assert entry["old_value"] is not None
    assert "pending" in entry["old_value"].lower()
    assert entry["new_value"] is not None
    assert "approved" in entry["new_value"].lower()