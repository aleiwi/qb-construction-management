from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.schemas.response import APIResponse
from app.services.user_service import UserService
from app.services.auth_service import AuthService, InvalidCredentialsException
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User, UserRole
from app.services.audit_log_service import AuditLogService
from app.services.contractor_service import ContractorService

router = APIRouter(prefix="/users", tags=["Users Management"])


def _to_out(user: User, user_service: UserService) -> UserOut:
    out = UserOut.model_validate(user)
    return out


@router.post("", response_model=APIResponse[UserOut])
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    """
    إنشاء مستخدم جديد مع دعوة تفعيل بالبريد (مسموح للمدير Admin فقط)
    """
    user_service = UserService(db)
    existing_user = await user_service.get_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="البريد الإلكتروني مسجل بالفعل"
        )
    new_user = await user_service.create(user_in)
    await AuthService(db).send_activation_email(new_user.id)
    if new_user.role == UserRole.CONTRACTOR:
        contractor_service = ContractorService(db)
        contractor = await contractor_service.get_by_email(new_user.email)
        if contractor is not None:
            await contractor_service.link_user(contractor.id, new_user.id)
    out = _to_out(new_user, user_service)
    out.project_ids = await user_service.get_project_ids(new_user.id)
    return APIResponse.ok(data=out, message="تم إنشاء المستخدم وإرسال دعوة التفعيل بالبريد")


@router.get("", response_model=APIResponse[List[UserOut]])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    """
    عرض قائمة المستخدمين (مسموح للمدير ومدير المشروع)
    """
    user_service = UserService(db)
    users = await user_service.get_all(skip=skip, limit=limit)
    users_out = []
    for u in users:
        out = _to_out(u, user_service)
        out.project_ids = await user_service.get_project_ids(u.id)
        users_out.append(out)
    return APIResponse.ok(data=users_out, message="تم جلب المستخدمين بنجاح")


@router.patch("/{user_id}", response_model=APIResponse[UserOut])
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    """
    تحديث بيانات المستخدم / تعطيله / تغيير دوره / تعديل مشاريعه (Admin فقط)
    """
    user_service = UserService(db)
    user = await user_service.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المستخدم غير موجود")
    if user.id == admin_user.id and user_in.is_active is False:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="لا يمكنك تعطيل حسابك بنفسك")

    old = {"role": user.role.value, "is_active": user.is_active}
    updated = await user_service.update(user, user_in)
    contractor_service = ContractorService(db)
    if updated.role == UserRole.CONTRACTOR:
        contractor = await contractor_service.get_by_email(updated.email)
        if contractor is not None:
            await contractor_service.link_user(contractor.id, updated.id)
    elif user.role == UserRole.CONTRACTOR:
        old_contractor = await contractor_service.get_by_user_id(updated.id)
        if old_contractor is not None:
            await contractor_service.link_user(old_contractor.id, None)
    await AuditLogService(db).log(
        user_id=admin_user.id,
        action="user_updated",
        entity_type="user",
        entity_id=user.id,
        old_value=old,
        new_value={"role": updated.role.value, "is_active": updated.is_active},
    )
    out = _to_out(updated, user_service)
    out.project_ids = await user_service.get_project_ids(updated.id)
    return APIResponse.ok(data=out, message="تم تحديث المستخدم بنجاح")


@router.post("/{user_id}/resend-invite", response_model=APIResponse)
async def resend_invite(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    """
    إعادة إرسال رابط تفعيل الحساب إلى البريد
    """
    user_service = UserService(db)
    user = await user_service.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المستخدم غير موجود")
    await AuthService(db).send_activation_email(user.id)
    return APIResponse.ok(message="تم إعادة إرسال رابط التفعيل")


@router.get("/me/projects", response_model=APIResponse)
async def my_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    المشاريع المسموح للمستخدم الحالي بالوصول إليها
    """
    user_service = UserService(db)
    project_ids = await user_service.get_project_ids(current_user.id)
    return APIResponse.ok(data=project_ids, message="تم جلب المشاريع المسموحة")