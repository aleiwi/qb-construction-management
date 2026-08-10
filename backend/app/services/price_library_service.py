from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.price_library import PriceLibrary
from app.services.audit_log_service import AuditLogService


class PriceLibraryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, price_id: int) -> Optional[PriceLibrary]:
        result = await self.db.execute(select(PriceLibrary).filter(PriceLibrary.id == price_id))
        return result.scalars().first()

    async def get_by_element_type(self, element_type: str) -> Optional[PriceLibrary]:
        result = await self.db.execute(
            select(PriceLibrary).filter(PriceLibrary.element_type == element_type)
        )
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[PriceLibrary]:
        result = await self.db.execute(
            select(PriceLibrary)
            .offset(skip)
            .limit(limit)
            .order_by(PriceLibrary.element_type.asc())
        )
        return result.scalars().all()

    async def create(self, element_type: str, unit: str, unit_price: float, description: str = None) -> PriceLibrary:
        price = PriceLibrary(
            element_type=element_type,
            unit=unit,
            unit_price=unit_price,
            description=description,
        )
        self.db.add(price)
        await self.db.commit()
        await self.db.refresh(price)
        return price

    async def upsert(self, element_type: str, unit: str, unit_price: float, description: str = None) -> PriceLibrary:
        existing = await self.get_by_element_type(element_type)
        if existing:
            existing.unit = unit
            existing.unit_price = unit_price
            if description is not None:
                existing.description = description
            self.db.add(existing)
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        return await self.create(element_type, unit, unit_price, description)

    async def delete(self, price_id: int) -> bool:
        price = await self.get_by_id(price_id)
        if not price:
            return False
        await self.db.delete(price)
        await self.db.commit()
        return True