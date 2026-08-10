# tests/test_qc_gate.py — QC must pass before payment approval (conventions §4)
import pytest
from uuid import uuid4
from datetime import date

from app.core.database import AsyncSessionLocal
from app.models.project import Project, ProjectStatus
from app.models.building import Building
from app.models.stage import Stage
from app.models.contractor import Contractor
from app.models.contract import Contract
from app.models.payment import Payment, PaymentStatus
from app.models.quality_check import QualityCheck, QCStatus
from app.services.payment_service import PaymentService
from app.services.quality_check_service import QualityCheckService


@pytest.mark.asyncio
async def test_payment_approve_blocked_when_qc_not_passed():
    """Payment approval must be blocked if stage has no passed QC."""
    async with AsyncSessionLocal() as db:
        proj = Project(name=f"P-{uuid4().hex[:8]}", status=ProjectStatus.IN_PROGRESS)
        db.add(proj); await db.flush()
        b = Building(name=f"B-{uuid4().hex[:8]}", project_id=proj.id, floors_count=1)
        db.add(b); await db.flush()
        st = Stage(name=f"S-{uuid4().hex[:8]}", building_id=b.id, weight_percent=50.0, progress_percent=100.0)
        db.add(st); await db.flush()
        ct = Contractor(company_name=f"C-{uuid4().hex[:8]}", contact_person="X", email=f"ct-{uuid4().hex[:8]}@test.com")
        db.add(ct); await db.flush()
        contract = Contract(
            contractor_id=ct.id, building_id=b.id, title="Contract",
            total_value=100000.0, retention_percent=10.0, status="active"
        )
        db.add(contract); await db.flush()

        payment = Payment(contract_id=contract.id, stage_id=st.id, amount=50000.0, net_amount=45000.0, retention_amount=5000.0)
        db.add(payment); await db.flush()
        await db.commit(); await db.refresh(payment); await db.refresh(st)

        pay_svc = PaymentService(db)
        with pytest.raises(ValueError, match="فحص الجودة"):
            await pay_svc.approve(payment, user_id=1)


@pytest.mark.asyncio
async def test_payment_approve_blocked_when_qc_failed():
    """Payment approval must be blocked if stage QC is FAILED."""
    async with AsyncSessionLocal() as db:
        proj = Project(name=f"P-{uuid4().hex[:8]}", status=ProjectStatus.IN_PROGRESS)
        db.add(proj); await db.flush()
        b = Building(name=f"B-{uuid4().hex[:8]}", project_id=proj.id, floors_count=1)
        db.add(b); await db.flush()
        st = Stage(name=f"S-{uuid4().hex[:8]}", building_id=b.id, weight_percent=50.0, progress_percent=100.0)
        db.add(st); await db.flush()
        ct = Contractor(company_name=f"C-{uuid4().hex[:8]}", contact_person="X", email=f"ct-{uuid4().hex[:8]}@test.com")
        db.add(ct); await db.flush()
        contract = Contract(
            contractor_id=ct.id, building_id=b.id, title="Contract",
            total_value=100000.0, retention_percent=10.0, status="active"
        )
        db.add(contract); await db.flush()

        qc = QualityCheck(stage_id=st.id, inspected_by=1, status=QCStatus.FAILED)
        db.add(qc); await db.flush()

        payment = Payment(contract_id=contract.id, stage_id=st.id, amount=50000.0, net_amount=45000.0, retention_amount=5000.0)
        db.add(payment); await db.flush()
        await db.commit(); await db.refresh(payment); await db.refresh(st)

        pay_svc = PaymentService(db)
        with pytest.raises(ValueError, match="فحص الجودة"):
            await pay_svc.approve(payment, user_id=1)


@pytest.mark.asyncio
async def test_payment_approve_succeeds_when_qc_passed():
    """Payment approval succeeds when a PASSED QC exists for the stage."""
    async with AsyncSessionLocal() as db:
        proj = Project(name=f"P-{uuid4().hex[:8]}", status=ProjectStatus.IN_PROGRESS)
        db.add(proj); await db.flush()
        b = Building(name=f"B-{uuid4().hex[:8]}", project_id=proj.id, floors_count=1)
        db.add(b); await db.flush()
        st = Stage(name=f"S-{uuid4().hex[:8]}", building_id=b.id, weight_percent=50.0, progress_percent=100.0)
        db.add(st); await db.flush()
        ct = Contractor(company_name=f"C-{uuid4().hex[:8]}", contact_person="X", email=f"ct-{uuid4().hex[:8]}@test.com")
        db.add(ct); await db.flush()
        contract = Contract(
            contractor_id=ct.id, building_id=b.id, title="Contract",
            total_value=100000.0, retention_percent=10.0, status="active"
        )
        db.add(contract); await db.flush()

        qc = QualityCheck(stage_id=st.id, inspected_by=1, status=QCStatus.PASSED)
        db.add(qc); await db.flush()

        payment = Payment(contract_id=contract.id, stage_id=st.id, amount=50000.0, net_amount=45000.0, retention_amount=5000.0)
        db.add(payment); await db.flush()
        await db.commit(); await db.refresh(payment); await db.refresh(st)

        pay_svc = PaymentService(db)
        approved = await pay_svc.approve(payment, user_id=1)
        assert approved.status == PaymentStatus.APPROVED