from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.boq_item import BOQItem
from app.models.boq_element import BOQElement, ClassificationStatus


class BOQItemService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, item_id: int) -> Optional[BOQItem]:
        result = await self.db.execute(select(BOQItem).filter(BOQItem.id == item_id))
        return result.scalars().first()

    async def get_by_element(self, boq_element_id: int) -> List[BOQItem]:
        result = await self.db.execute(
            select(BOQItem).filter(BOQItem.boq_element_id == boq_element_id)
        )
        return result.scalars().all()

    async def link_element_to_price(
        self, boq_element_id: int, price_ref_id: int, unit_price: float, quantity: float
    ) -> BOQItem:
        existing = await self.db.execute(
            select(BOQItem).filter(
                BOQItem.boq_element_id == boq_element_id,
                BOQItem.price_ref_id == price_ref_id
            )
        )
        existing_item = existing.scalars().first()
        if existing_item:
            existing_item.quantity = quantity
            existing_item.unit_price = unit_price
            existing_item.total_price = round(quantity * unit_price, 2)
            self.db.add(existing_item)
            await self.db.commit()
            await self.db.refresh(existing_item)
            return existing_item

        item = BOQItem(
            boq_element_id=boq_element_id,
            price_ref_id=price_ref_id,
            quantity=quantity,
            unit_price=unit_price,
            total_price=round(quantity * unit_price, 2),
        )
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def create_or_update(self, boq_element_id: int, price_ref_id: int, unit_price: float, quantity: float) -> BOQItem:
        return await self.link_element_to_price(boq_element_id, price_ref_id, unit_price, quantity)

    async def delete(self, item_id: int) -> bool:
        item = await self.get_by_id(item_id)
        if not item:
            return False
        await self.db.delete(item)
        await self.db.commit()
        return True

    async def get_drawing_boq_summary(self, drawing_id: int) -> dict:
        result = await self.db.execute(
            select(BOQItem)
            .join(BOQElement, BOQItem.boq_element_id == BOQElement.id)
            .filter(
                BOQElement.drawing_id == drawing_id,
                BOQElement.classification_status != ClassificationStatus.UNCLASSIFIED,
            )
        )
        items = result.scalars().all()
        total = sum(float(item.total_price) for item in items)
        return {
            "items_count": len(items),
            "total_price": round(total, 2),
        }