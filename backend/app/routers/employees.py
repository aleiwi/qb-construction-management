from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate, EmployeeOut,
    AttendanceCreate, AttendanceUpdate, AttendanceOut,
)
from app.schemas.response import APIResponse
from app.services.employee_service import EmployeeService, AttendanceService
from app.dependencies.auth import require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/hr", tags=["Human Resources"])


# ==================== Employees ====================

@router.get("/employees", response_model=APIResponse[List[EmployeeOut]])
async def list_employees(
    active_only: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT])),
):
    service = EmployeeService(db)
    employees = await service.get_all(skip=(page - 1) * page_size, limit=page_size, active_only=active_only)
    return APIResponse.ok(data=[EmployeeOut.model_validate(e) for e in employees], message="تم جلب الموظفين بنجاح")


@router.get("/employees/stats", response_model=APIResponse[dict])
async def employee_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT])),
):
    service = EmployeeService(db)
    stats = await service.get_stats()
    return APIResponse.ok(data=stats, message="تم جلب إحصائيات الموظفين بنجاح")


@router.post("/employees", response_model=APIResponse[EmployeeOut])
async def create_employee(
    data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    service = EmployeeService(db)
    employee = await service.create(data)
    return APIResponse.ok(data=EmployeeOut.model_validate(employee), message="تم إضافة الموظف بنجاح")


@router.get("/employees/{employee_id}", response_model=APIResponse[EmployeeOut])
async def get_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT])),
):
    service = EmployeeService(db)
    employee = await service.get_by_id(employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    return APIResponse.ok(data=EmployeeOut.model_validate(employee), message="تم جلب بيانات الموظف بنجاح")


@router.put("/employees/{employee_id}", response_model=APIResponse[EmployeeOut])
async def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    service = EmployeeService(db)
    employee = await service.get_by_id(employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    employee = await service.update(employee, data)
    return APIResponse.ok(data=EmployeeOut.model_validate(employee), message="تم تحديث بيانات الموظف بنجاح")


@router.delete("/employees/{employee_id}", response_model=APIResponse)
async def delete_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    service = EmployeeService(db)
    deleted = await service.delete(employee_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    return APIResponse.ok(message="تم حذف الموظف بنجاح")


# ==================== Attendance ====================

@router.get("/attendance", response_model=APIResponse[List[AttendanceOut]])
async def list_attendance(
    employee_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT])),
):
    service = AttendanceService(db)
    if employee_id:
        records = await service.get_by_employee(employee_id)
        items = [AttendanceOut(
            id=r.id, employee_id=r.employee_id, date=r.date,
            check_in=r.check_in, check_out=r.check_out,
            status=r.status.value if r.status else None,
            notes=r.notes, created_at=r.created_at,
            employee_name=None,
        ) for r in records]
    else:
        results = await service.get_all_with_names(skip=(page - 1) * page_size, limit=page_size)
        items = [AttendanceOut(
            id=r[0].id, employee_id=r[0].employee_id, date=r[0].date,
            check_in=r[0].check_in, check_out=r[0].check_out,
            status=r[0].status.value if r[0].status else None,
            notes=r[0].notes, created_at=r[0].created_at,
            employee_name=r[1],
        ) for r in results]
    return APIResponse.ok(data=items, message="تم جلب سجلات الحضور بنجاح")


@router.get("/attendance/stats", response_model=APIResponse[dict])
async def attendance_stats(
    target_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT])),
):
    service = AttendanceService(db)
    if not target_date:
        target_date = date.today()
    stats = await service.get_stats_for_date(target_date)
    return APIResponse.ok(data=stats, message="تم جلب إحصائيات الحضور بنجاح")


@router.post("/attendance", response_model=APIResponse[AttendanceOut])
async def create_attendance(
    data: AttendanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    service = AttendanceService(db)
    ok, msg, record = await service.create(data)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return APIResponse.ok(data=AttendanceOut.model_validate(record), message=msg)


@router.patch("/attendance/{attendance_id}", response_model=APIResponse[AttendanceOut])
async def update_attendance(
    attendance_id: int,
    data: AttendanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    service = AttendanceService(db)
    record = await service.get_by_id(attendance_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="سجل الحضور غير موجود")
    record = await service.update(record, data)
    return APIResponse.ok(data=AttendanceOut.model_validate(record), message="تم تحديث سجل الحضور بنجاح")


@router.delete("/attendance/{attendance_id}", response_model=APIResponse)
async def delete_attendance(
    attendance_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    service = AttendanceService(db)
    deleted = await service.delete(attendance_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="سجل الحضور غير موجود")
    return APIResponse.ok(message="تم حذف سجل الحضور بنجاح")