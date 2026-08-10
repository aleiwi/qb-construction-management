from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.contractor import Contractor
from app.models.contract import Contract
from app.schemas.contractor import ContractorCreate, ContractorUpdate


class ContractorNotFoundException(Exception):
    pass


class ContractorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, contractor_id: int) -> Optional[Contractor]:
        result = await self.db.execute(select(Contractor).filter(Contractor.id == contractor_id))
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[Contractor]:
        result = await self.db.execute(select(Contractor).filter(Contractor.email == email))
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 20) -> List[Contractor]:
        result = await self.db.execute(
            select(Contractor)
            .offset(skip)
            .limit(limit)
            .order_by(Contractor.created_at.desc())
        )
        return result.scalars().all()

    async def get_all_with_counts(self, skip: int = 0, limit: int = 20):
        subquery = (
            select(
                Contract.contractor_id,
                func.count(Contract.id).label("contracts_count"),
                func.coalesce(func.sum(Contract.total_value), 0).label("total_value"),
            )
            .group_by(Contract.contractor_id)
            .subquery()
        )
        query = (
            select(
                Contractor,
                func.coalesce(subquery.c.contracts_count, 0).label("contracts_count"),
                func.coalesce(subquery.c.total_value, 0).label("total_contract_value"),
            )
            .outerjoin(subquery, Contractor.id == subquery.c.contractor_id)
            .offset(skip)
            .limit(limit)
            .order_by(Contractor.created_at.desc())
        )
        result = await self.db.execute(query)
        return result.all()

    async def create(self, contractor_in: ContractorCreate) -> Contractor:
        contractor = Contractor(
            company_name=contractor_in.company_name,
            contact_person=contractor_in.contact_person,
            email=contractor_in.email,
            phone=contractor_in.phone,
            specialization=contractor_in.specialization,
            notes=contractor_in.notes,
        )
        self.db.add(contractor)
        await self.db.commit()
        await self.db.refresh(contractor)
        return contractor

    async def update(self, contractor: Contractor, contractor_in: ContractorUpdate) -> Contractor:
        update_data = contractor_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contractor, field, value)
        self.db.add(contractor)
        await self.db.commit()
        await self.db.refresh(contractor)
        return contractor

    async def delete(self, contractor_id: int) -> bool:
        contractor = await self.get_by_id(contractor_id)
        if not contractor:
            raise ContractorNotFoundException(f"المقاول رقم {contractor_id} غير موجود")
        await self.db.delete(contractor)
        await self.db.commit()
        return True