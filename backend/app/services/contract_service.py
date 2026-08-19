from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.contract import Contract, ContractStatus
from app.models.contractor import Contractor
from app.models.building import Building
from app.schemas.contract import ContractCreate, ContractUpdate


class ContractNotFoundException(Exception):
    pass


class ContractBuildingNotFoundException(Exception):
    pass


class ContractService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_contractor_by_user(self, user_id: int):
        from app.models.contractor import Contractor
        result = await self.db.execute(select(Contractor).filter(Contractor.user_id == user_id))
        return result.scalars().first()

    async def get_by_id(self, contract_id: int) -> Optional[Contract]:
        result = await self.db.execute(select(Contract).filter(Contract.id == contract_id))
        return result.scalars().first()

    async def get_by_contractor(self, contractor_id: int) -> List[Contract]:
        result = await self.db.execute(
            select(Contract)
            .filter(Contract.contractor_id == contractor_id)
            .order_by(Contract.created_at.desc())
        )
        return result.scalars().all()

    async def get_by_building(self, building_id: int) -> List[Contract]:
        result = await self.db.execute(
            select(Contract)
            .filter(Contract.building_id == building_id)
            .order_by(Contract.created_at.desc())
        )
        return result.scalars().all()

    async def get_all(self, skip: int = 0, limit: int = 20) -> List[Contract]:
        result = await self.db.execute(
            select(Contract)
            .offset(skip)
            .limit(limit)
            .order_by(Contract.created_at.desc())
        )
        return result.scalars().all()

    async def get_all_with_names(self, skip: int = 0, limit: int = 20, contractor_id: Optional[int] = None, project_ids: Optional[List[int]] = None):
        query = (
            select(
                Contract,
                Contractor.company_name.label("contractor_name"),
                Building.name.label("building_name"),
            )
            .join(Contractor, Contract.contractor_id == Contractor.id)
            .join(Building, Contract.building_id == Building.id)
        )
        if contractor_id:
            query = query.filter(Contract.contractor_id == contractor_id)
        if project_ids:
            query = query.filter(Building.project_id.in_(project_ids))
        query = query.offset(skip).limit(limit).order_by(Contract.created_at.desc())
        result = await self.db.execute(query)
        return result.all()

    async def create(self, contract_in: ContractCreate) -> Contract:
        building = await self.db.get(Building, contract_in.building_id)
        if not building:
            raise ContractBuildingNotFoundException(f"المبنى {contract_in.building_id} غير موجود")
        contractor = await self.db.get(Contractor, contract_in.contractor_id)
        if not contractor:
            raise ContractBuildingNotFoundException(f"المقاول {contract_in.contractor_id} غير موجود")
        contract = Contract(
            contractor_id=contract_in.contractor_id,
            building_id=contract_in.building_id,
            title=contract_in.title,
            description=contract_in.description,
            total_value=contract_in.total_value,
            retention_percent=contract_in.retention_percent,
            status=contract_in.status,
            start_date=contract_in.start_date,
            end_date=contract_in.end_date,
        )
        self.db.add(contract)
        await self.db.commit()
        await self.db.refresh(contract)
        return contract

    async def update(self, contract: Contract, contract_in: ContractUpdate) -> Contract:
        update_data = contract_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contract, field, value)
        self.db.add(contract)
        await self.db.commit()
        await self.db.refresh(contract)
        return contract

    async def delete(self, contract_id: int) -> bool:
        contract = await self.get_by_id(contract_id)
        if not contract:
            raise ContractNotFoundException(f"العقد رقم {contract_id} غير موجود")
        await self.db.delete(contract)
        await self.db.commit()
        return True