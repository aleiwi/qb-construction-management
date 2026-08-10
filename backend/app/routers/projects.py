from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut, ProjectListOut, ProjectDetailOut
from app.schemas.response import APIResponse
from app.services.project_service import ProjectService, ProjectNotFoundException
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=APIResponse[List[ProjectListOut]])
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    skip = (page - 1) * page_size
    project_service = ProjectService(db)
    results = await project_service.get_all_with_counts(skip=skip, limit=page_size)
    total = await project_service.count_total()

    items = []
    for row in results:
        project = row[0]
        count = row[1]
        items.append(ProjectListOut(
            id=project.id,
            name=project.name,
            description=project.description,
            location=project.location,
            status=project.status,
            created_at=project.created_at,
            updated_at=project.updated_at,
            buildings_count=count,
        ))

    return APIResponse.ok(
        data=items,
        message="تم جلب قائمة المشاريع بنجاح"
    )


@router.post("", response_model=APIResponse[ProjectOut])
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    project_service = ProjectService(db)
    project = await project_service.create(project_in)
    return APIResponse.ok(data=ProjectOut.model_validate(project), message="تم إنشاء المشروع بنجاح")


@router.get("/{project_id}", response_model=APIResponse[ProjectDetailOut])
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    project_service = ProjectService(db)
    project = await project_service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المشروع غير موجود")
    return APIResponse.ok(data=ProjectDetailOut.model_validate(project), message="تم جلب بيانات المشروع بنجاح")


@router.put("/{project_id}", response_model=APIResponse[ProjectOut])
async def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    project_service = ProjectService(db)
    project = await project_service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المشروع غير موجود")
    updated = await project_service.update(project, project_in)
    return APIResponse.ok(data=ProjectOut.model_validate(updated), message="تم تحديث المشروع بنجاح")


@router.delete("/{project_id}", response_model=APIResponse)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    project_service = ProjectService(db)
    try:
        await project_service.delete(project_id)
    except ProjectNotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المشروع غير موجود")
    return APIResponse.ok(message="تم حذف المشروع بنجاح")