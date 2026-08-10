from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.retention_release import RetentionRelease, ReleaseStatus
from app.schemas.retention_release import RetentionReleaseCreate, RetentionReleaseUpdate


class RetentionReleaseService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, release_id: int) -> Optional[RetentionRelease]:
        result = await self.db.execute(select(RetentionRelease).filter(RetentionRelease.id == release_id))
        return result.scalars().first()

    async def get_by_contract(self, contract_id: int) -> List[RetentionRelease]:
        result = await self.db.execute(
            select(RetentionRelease)
            .filter(RetentionRelease.contract_id == contract_id)
            .order_by(RetentionRelease.created_at.desc())
        )
        return result.scalars().all()

    async def get_all(self, skip: int = 0, limit: int = 50) -> List[RetentionRelease]:
        result = await self.db.execute(
            select(RetentionRelease)
            .offset(skip)
            .limit(limit)
            .order_by(RetentionRelease.created_at.desc())
        )
        return result.scalars().all()

    async def create(self, release_in: RetentionReleaseCreate) -> RetentionRelease:
        release = RetentionRelease(
            contract_id=release_in.contract_id,
            retained_amount=release_in.retained_amount,
            maintenance_period_end_date=release_in.maintenance_period_end_date,
            notes=release_in.notes,
        )
        self.db.add(release)
        await self.db.commit()
        await self.db.refresh(release)
        return release

    async def release_retention(self, release: RetentionRelease, user_id: int) -> RetentionRelease:
        from datetime import datetime
        release.release_status = ReleaseStatus.RELEASED
        release.released_at = datetime.utcnow()
        release.released_by = user_id
        self.db.add(release)
        await self.db.commit()
        await self.db.refresh(release)
        return release

    async def delete(self, release_id: int) -> bool:
        release = await self.get_by_id(release_id)
        if not release:
            return False
        await self.db.delete(release)
        await self.db.commit()
        return True

    async def get_held_total(self) -> float:
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.coalesce(func.sum(RetentionRelease.retained_amount), 0))
            .filter(RetentionRelease.release_status == ReleaseStatus.HELD)
        )
        return float(result.scalar() or 0)