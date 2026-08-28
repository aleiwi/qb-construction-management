from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.audit_log import AuditLogOut
from app.schemas.response import APIResponse
from app.services.audit_log_service import AuditLogService
from app.dependencies.auth import require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=APIResponse[List[AuditLogOut]])
async def list_audit_logs(
    entity_type: str = Query(None),
    entity_id: int = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    service = AuditLogService(db)
    if entity_type and entity_id:
        items = await service.get_by_entity(entity_type, entity_id)
    else:
        items = await service.get_all(skip=(page - 1) * page_size, limit=page_size)
    return APIResponse.ok(data=[AuditLogOut.model_validate(a) for a in items], message="تم جلب سجلات التتبع")