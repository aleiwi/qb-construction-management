from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.price_library import PriceLibrary
from app.models.price_history import PriceHistory
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

    async def record_history(
        self, price: PriceLibrary, change: str, changed_by: Optional[int] = None
    ) -> PriceHistory:
        """Append an immutable history row (call AFTER the price change)."""
        entry = PriceHistory(
            price_id=price.id,
            element_type=price.element_type,
            unit=price.unit,
            unit_price=price.unit_price,
            change=change,
            changed_by=changed_by,
        )
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)
        return entry

    async def get_history(self, price_id: int, limit: int = 50) -> List[PriceHistory]:
        result = await self.db.execute(
            select(PriceHistory)
            .filter(PriceHistory.price_id == price_id)
            .order_by(PriceHistory.created_at.desc(), PriceHistory.id.desc())
            .limit(limit)
        )
        return result.scalars().all()