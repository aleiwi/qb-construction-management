from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt, JWTError
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.user_project import UserProject
from app.services.user_service import UserService

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="تعذر التحقق من هوية المستخدم",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_type = payload.get("type")
        user_id = payload.get("sub")
        if token_type != "access" or user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user_service = UserService(db)
    user = await user_service.get_by_id(int(user_id))
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="الحساب غير نشط"
        )
    return user

def require_roles(allowed_roles: List[UserRole]):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ليس لديك الصلاحية الكافية للوصول لهذا المورد"
            )
        return current_user
    return role_checker


async def _linked_project_ids(current_user: User, db: AsyncSession) -> List[int]:
    result = await db.execute(
        select(UserProject.project_id).filter(UserProject.user_id == current_user.id)
    )
    return [row[0] for row in result.all()]


def require_project_access():
    """RLS (M5): the authenticated user must be linked to the project in
    `project_id` path param. Admins bypass (full access).
    Users with no project links yet are unrestricted (legacy/compat mode)."""
    async def checker(
        project_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> None:
        if current_user.role == UserRole.ADMIN:
            return
        linked = await _linked_project_ids(current_user, db)
        if not linked:
            return
        if project_id not in linked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ليس لديك صلاحية الوصول لهذا المشروع",
            )
    return checker


async def allowed_project_ids(current_user: User, db: AsyncSession) -> List[int]:
    """Project ids the user may access.
    Empty list = no project-level restriction (admin/contractor, or user with no links yet)."""
    if current_user.role in (UserRole.ADMIN, UserRole.CONTRACTOR):
        return []
    return await _linked_project_ids(current_user, db)


async def check_entity_access(
    db: AsyncSession,
    current_user: User,
    entity_type: str,
    entity_id: int,
) -> None:
    """RLS (M5): resolve any business entity to its project and verify access.
    Admins bypass (full access); contractors keep their own record-level RLS
    (contractor_access) unless linked via user_projects.
    Raises 403 (or 404 for missing entities)."""
    if current_user.role in (UserRole.ADMIN, UserRole.CONTRACTOR):
        return

    def _not_found() -> HTTPException:
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المورد غير موجود")

    if entity_type == "project":
        from app.models.project import Project
        row = (await db.execute(select(Project.id).where(Project.id == entity_id))).scalar_one_or_none()
        project_id = row
    elif entity_type == "building":
        from app.models.building import Building
        project_id = (await db.execute(
            select(Building.project_id).where(Building.id == entity_id)
        )).scalar_one_or_none()
    elif entity_type == "stage":
        from app.models.stage import Stage
        from app.models.building import Building
        building_id = (await db.execute(
            select(Stage.building_id).where(Stage.id == entity_id)
        )).scalar_one_or_none()
        if building_id is None:
            raise _not_found()
        project_id = (await db.execute(
            select(Building.project_id).where(Building.id == building_id)
        )).scalar_one_or_none()
    elif entity_type == "drawing":
        from app.models.drawing import Drawing
        from app.models.building import Building
        building_id = (await db.execute(
            select(Drawing.building_id).where(Drawing.id == entity_id)
        )).scalar_one_or_none()
        if building_id is None:
            raise _not_found()
        project_id = (await db.execute(
            select(Building.project_id).where(Building.id == building_id)
        )).scalar_one_or_none()
    elif entity_type == "contract":
        from app.models.contract import Contract
        from app.models.building import Building
        building_id = (await db.execute(
            select(Contract.building_id).where(Contract.id == entity_id)
        )).scalar_one_or_none()
        if building_id is None:
            raise _not_found()
        project_id = (await db.execute(
            select(Building.project_id).where(Building.id == building_id)
        )).scalar_one_or_none()
    elif entity_type == "payment":
        from app.models.payment import Payment
        from app.models.contract import Contract
        from app.models.building import Building
        contract_id = (await db.execute(
            select(Payment.contract_id).where(Payment.id == entity_id)
        )).scalar_one_or_none()
        if contract_id is None:
            raise _not_found()
        building_id = (await db.execute(
            select(Contract.building_id).where(Contract.id == contract_id)
        )).scalar_one_or_none()
        if building_id is None:
            raise _not_found()
        project_id = (await db.execute(
            select(Building.project_id).where(Building.id == building_id)
        )).scalar_one_or_none()
    elif entity_type == "quality_check":
        from app.models.quality_check import QualityCheck
        from app.models.stage import Stage
        from app.models.building import Building
        stage_id = (await db.execute(
            select(QualityCheck.stage_id).where(QualityCheck.id == entity_id)
        )).scalar_one_or_none()
        if stage_id is None:
            raise _not_found()
        building_id = (await db.execute(
            select(Stage.building_id).where(Stage.id == stage_id)
        )).scalar_one_or_none()
        if building_id is None:
            raise _not_found()
        project_id = (await db.execute(
            select(Building.project_id).where(Building.id == building_id)
        )).scalar_one_or_none()
    elif entity_type == "completion_report":
        from app.models.completion_report import CompletionReport
        project_id = (await db.execute(
            select(CompletionReport.project_id).where(CompletionReport.id == entity_id)
        )).scalar_one_or_none()
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="نوع كيان غير معروف")

    if project_id is None:
        raise _not_found()

    linked = await _linked_project_ids(current_user, db)
    if not linked:
        return
    if project_id not in linked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك صلاحية الوصول لهذا المورد",
        )
