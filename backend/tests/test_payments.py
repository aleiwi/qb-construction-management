import pytest
from uuid import uuid4
from app.services.payment_service import PaymentCalculationService


@pytest.mark.asyncio
async def test_payment_calc_partial_stage_weight_10_percent():
    """Weight=10% of contract value 100,000 → gross=10,000, retention@10%=1,000, net=9,000."""
    from app.core.database import AsyncSessionLocal
    from app.models.project import Project, ProjectStatus
    from app.models.building import Building
    from app.models.stage import Stage
    from app.models.contractor import Contractor
    from app.models.contract import Contract
    from sqlalchemy.future import select
    from datetime import date

    async with AsyncSessionLocal() as db:
        proj = Project(name="P1", status=ProjectStatus.IN_PROGRESS)
        db.add(proj); await db.flush()
        b = Building(name="B1", project_id=proj.id, floors_count=1)
        db.add(b); await db.flush()
        st = Stage(name="Excavation", building_id=b.id, weight_percent=10.0, progress_percent=40.0)
        db.add(st); await db.flush()
        ct = Contractor(company_name="C1", contact_person="X", email=f"p1c1-{uuid4().hex[:8]}@test.com")
        db.add(ct); await db.flush()
        contract = Contract(contractor_id=ct.id, building_id=b.id, title="T1",
                       total_value=100000.0, retention_percent=10.0, status="active")
        db.add(contract); await db.commit(); await db.refresh(contract); await db.refresh(st)

        gross, net, retention = await PaymentCalculationService.calculate_stage_payment(
            db, contract.id, st.id
        )
        assert gross == 10000.0
        assert retention == 1000.0
        assert net == 9000.0


@pytest.mark.asyncio
async def test_payment_calc_full_stage_weight_100_percent():
    """Weight=100% → gross = full contract value, nets out retention."""
    from app.core.database import AsyncSessionLocal
    from app.models.project import Project, ProjectStatus
    from app.models.building import Building
    from app.models.stage import Stage
    from app.models.contractor import Contractor
    from app.models.contract import Contract

    async with AsyncSessionLocal() as db:
        proj = Project(name="P2", status=ProjectStatus.IN_PROGRESS)
        db.add(proj); await db.flush()
        b = Building(name="B2", project_id=proj.id, floors_count=1)
        db.add(b); await db.flush()
        st = Stage(name="All", building_id=b.id, weight_percent=100.0, progress_percent=100.0)
        db.add(st); await db.flush()
        ct = Contractor(company_name="C2", contact_person="Y", email=f"p2c2-{uuid4().hex[:8]}@test.com")
        db.add(ct); await db.flush()
        contract = Contract(contractor_id=ct.id, building_id=b.id, title="T2",
                       total_value=500000.0, retention_percent=5.0, status="active")
        db.add(contract); await db.commit(); await db.refresh(contract); await db.refresh(st)

        gross, net, retention = await PaymentCalculationService.calculate_stage_payment(
            db, contract.id, st.id
        )
        assert gross == 500000.0
        assert retention == 25000.0
        assert net == 475000.0


@pytest.mark.asyncio
async def test_payment_calc_zero_weight_zero_value():
    """Edge case: zero weight and zero contract value → all zeros (no overdraw)."""
    from app.core.database import AsyncSessionLocal
    from app.models.project import Project, ProjectStatus
    from app.models.building import Building
    from app.models.stage import Stage
    from app.models.contractor import Contractor
    from app.models.contract import Contract

    async with AsyncSessionLocal() as db:
        proj = Project(name="P3", status=ProjectStatus.PLANNING)
        db.add(proj); await db.flush()
        b = Building(name="B3", project_id=proj.id, floors_count=1)
        db.add(b); await db.flush()
        st = Stage(name="Zero", building_id=b.id, weight_percent=0.0, progress_percent=0.0)
        db.add(st); await db.flush()
        ct = Contractor(company_name="C3", contact_person="Z", email=f"p3c3-{uuid4().hex[:8]}@test.com")
        db.add(ct); await db.flush()
        contract = Contract(contractor_id=ct.id, building_id=b.id, title="T3",
                       total_value=0.0, retention_percent=10.0, status="draft")
        db.add(contract); await db.commit(); await db.refresh(contract); await db.refresh(st)

        gross, net, retention = await PaymentCalculationService.calculate_stage_payment(
            db, contract.id, st.id
        )
        assert gross == 0.0
        assert net == 0.0
        assert retention == 0.0


@pytest.mark.asyncio
async def test_payment_calc_missing_contract_raises():
    """Calculating payment for non-existent contract should raise ValueError."""
    from app.core.database import AsyncSessionLocal
    from app.models.project import Project, ProjectStatus
    from app.models.building import Building
    from app.models.stage import Stage

    async with AsyncSessionLocal() as db:
        proj = Project(name="P4", status=ProjectStatus.PLANNING)
        db.add(proj); await db.flush()
        b = Building(name="B4", project_id=proj.id, floors_count=1)
        db.add(b); await db.flush()
        st = Stage(name="Orphan", building_id=b.id, weight_percent=10.0, progress_percent=0.0)
        db.add(st); await db.commit(); await db.refresh(st)

        with pytest.raises(ValueError):
            await PaymentCalculationService.calculate_stage_payment(db, 999999, st.id)


@pytest.mark.asyncio
async def test_payment_calc_missing_stage_raises():
    from app.core.database import AsyncSessionLocal
    from app.models.project import Project, ProjectStatus
    from app.models.building import Building
    from app.models.contractor import Contractor
    from app.models.contract import Contract

    async with AsyncSessionLocal() as db:
        proj = Project(name="P5", status=ProjectStatus.PLANNING)
        db.add(proj); await db.flush()
        b = Building(name="B5", project_id=proj.id, floors_count=1)
        db.add(b); await db.flush()
        ct = Contractor(company_name="C5", contact_person="A", email=f"p5c5-{uuid4().hex[:8]}@test.com")
        db.add(ct); await db.flush()
        contract = Contract(contractor_id=ct.id, building_id=b.id, title="T5",
                       total_value=1000.0, retention_percent=10.0, status="active")
        db.add(contract); await db.commit(); await db.refresh(contract)

        with pytest.raises(ValueError):
            await PaymentCalculationService.calculate_stage_payment(db, contract.id, 999999)