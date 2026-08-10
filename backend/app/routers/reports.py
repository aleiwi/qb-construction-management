from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.response import APIResponse
from app.services.reports_service import ReportsService
from app.dependencies.auth import require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/reports", tags=["Reports & KPIs"])


@router.get("/kpis", response_model=APIResponse[Dict[str, Any]])
async def get_kpis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT])),
):
    service = ReportsService(db)
    kpis = await service.get_kpis()
    return APIResponse.ok(data=kpis, message="تم تجميع مؤشرات الأداء KPI بنجاح")