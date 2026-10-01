from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.project import ProjectStatus
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut, ProjectListOut, ProjectDetailOut
from app.schemas.response import APIResponse
from app.services.project_service import ProjectService, ProjectNotFoundException
from app.dependencies.auth import get_current_user, require_roles, require_project_access, allowed_project_ids
from app.models.user import User, UserRole
from app.models.user_project import UserProject
from sqlalchemy.future import select

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=APIResponse[List[ProjectListOut]])
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    search: str = Query("", max_length=100),
    status: Optional[ProjectStatus] = Query(None),
    sort: Literal["newest", "oldest", "name"] = Query("newest"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    skip = (page - 1) * page_size
    project_service = ProjectService(db)
    ids = await allowed_project_ids(current_user, db)
    q = search.strip() or None
    results = await project_service.get_all_with_counts(
        skip=skip, limit=page_size, project_ids=ids or None, search=q, status=status, sort=sort,
    )
    total = await project_service.count_total(search=q, status=status, project_ids=ids or None)
    counts = await project_service.status_counts(project_ids=ids or None)

    items = []
    for project, b_count, s_count, progress in results:
        items.append(ProjectListOut(
            id=project.id,
            name=project.name,
            description=project.description,
            location=project.location,
            status=project.status,
            created_at=project.created_at,
            updated_at=project.updated_at,
            buildings_count=b_count,
            stages_count=s_count,
            progress_percent=progress,
        ))

    return APIResponse.ok(
        data=items,
        message="تم جلب قائمة المشاريع بنجاح",
        meta={"total": total, "page": page, "page_size": page_size, "status_counts": counts},
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
    _: None = Depends(require_project_access()),
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
    _: None = Depends(require_project_access()),
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

# ---- Task Endpoints ----

@router.get("/{project_id}/tasks", response_model=APIResponse[list[dict]])
async def get_project_tasks(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
    _: None = Depends(require_project_access()),
):
    from app.models.task_model import Task
    tasks = await db.execute(select(Task).where(Task.project_id == project_id))
    task_list = tasks.scalars().all()
    return APIResponse.ok(data=[task.to_dict() if hasattr(task, 'to_dict') else {"id": t.id, "task_text": t.task_text, "is_completed": t.is_completed, "created_at": str(t.created_at)} for t in task_list], message="تم جلب المهام بنجاح")


@router.post("/{project_id}/tasks", response_model=APIResponse)
async def add_project_task(
    project_id: int,
    task_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
    _: None = Depends(require_project_access()),
):
    from app.models.task_model import Task
    task = Task(project_id=project_id, task_text=task_data.get("task_text", ""), is_completed=False)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return APIResponse.ok(data={"id": task.id, "task_text": task.task_text, "is_completed": task.is_completed}, message="تم إضافة المهمة بنجاح")


@router.put("/{project_id}/tasks/{task_id}", response_model=APIResponse)
async def update_project_task(
    project_id: int,
    task_id: int,
    updates: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
    _: None = Depends(require_project_access()),
):
    from app.models.task_model import Task
    task = await db.get(Task, task_id)
    if not task or task.project_id != project_id:
        raise HTTPException(status_code=404, detail="المهمة غير موجودة")
    if "task_text" in updates:
        task.task_text = updates["task_text"]
    if "is_completed" in updates:
        task.is_completed = updates["is_completed"]
    await db.commit()
    return APIResponse.ok(data={"id": task.id, "task_text": task.task_text, "is_completed": task.is_completed}, message="تم تحديث المهمة")


@router.delete("/{project_id}/tasks/{task_id}", response_model=APIResponse)
async def delete_project_task(
    project_id: int,
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
    _: None = Depends(require_project_access()),
):
    from app.models.task_model import Task
    task = await db.get(Task, task_id)
    if not task or task.project_id != project_id:
        raise HTTPException(status_code=404, detail="المهمة غير موجودة")
    await db.delete(task)
    await db.commit()
    return APIResponse.ok(message="تم حذف المهمة")
