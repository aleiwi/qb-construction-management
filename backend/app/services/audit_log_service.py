import json
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.audit_log import AuditLog


class AuditLogService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        user_id: int,
        action: str,
        entity_type: str,
        entity_id: int,
        old_value: Optional[Any] = None,
        new_value: Optional[Any] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        old_str = json.dumps(old_value, default=str) if old_value is not None else None
        new_str = json.dumps(new_value, default=str) if new_value is not None else None
        entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old_str,
            new_value=new_str,
            ip_address=ip_address,
        )
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)
        return entry

    async def get_by_entity(self, entity_type: str, entity_id: int) -> list[AuditLog]:
        result = await self.db.execute(
            select(AuditLog)
            .filter(AuditLog.entity_type == entity_type, AuditLog.entity_id == entity_id)
            .order_by(AuditLog.created_at.desc())
        )
        return result.scalars().all()

    async def get_all(self, skip: int = 0, limit: int = 50) -> list[AuditLog]:
        result = await self.db.execute(
            select(AuditLog).offset(skip).limit(limit).order_by(AuditLog.created_at.desc())
        )
        return result.scalars().all()