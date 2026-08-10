from datetime import date, datetime
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
from app.models.employee import Employee, Attendance, AttendanceStatus


class EmployeeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, skip: int = 0, limit: int = 100, active_only: bool = False) -> List[Employee]:
        query = select(Employee).offset(skip).limit(limit).order_by(Employee.created_at.desc())
        if active_only:
            query = query.filter(Employee.is_active == True)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_id(self, employee_id: int) -> Optional[Employee]:
        result = await self.db.execute(select(Employee).filter(Employee.id == employee_id))
        return result.scalars().first()

    async def create(self, data) -> Employee:
        employee = Employee(
            full_name=data.full_name,
            national_id=data.national_id,
            phone=data.phone,
            job_title=data.job_title,
            salary_type=data.salary_type,
            monthly_salary=data.monthly_salary,
            hire_date=data.hire_date,
            is_active=data.is_active,
        )
        self.db.add(employee)
        await self.db.commit()
        await self.db.refresh(employee)
        return employee

    async def update(self, employee: Employee, data) -> Employee:
        for field in ["full_name", "national_id", "phone", "job_title", "monthly_salary", "hire_date", "is_active"]:
            value = getattr(data, field, None)
            if value is not None:
                setattr(employee, field, value)
        self.db.add(employee)
        await self.db.commit()
        await self.db.refresh(employee)
        return employee

    async def delete(self, employee_id: int) -> bool:
        employee = await self.get_by_id(employee_id)
        if not employee:
            return False
        await self.db.delete(employee)
        await self.db.commit()
        return True

    async def get_stats(self) -> dict:
        total_result = await self.db.execute(select(func.count(Employee.id)))
        total = total_result.scalar() or 0
        active_result = await self.db.execute(select(func.count(Employee.id)).filter(Employee.is_active == True))
        active = active_result.scalar() or 0
        payroll_result = await self.db.execute(
            select(func.coalesce(func.sum(Employee.monthly_salary), 0)).filter(Employee.is_active == True)
        )
        payroll = float(payroll_result.scalar() or 0)
        return {"total_employees": total, "active_employees": active, "monthly_payroll": payroll}


class AttendanceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_employee(self, employee_id: int) -> List[Attendance]:
        result = await self.db.execute(
            select(Attendance).filter(Attendance.employee_id == employee_id).order_by(Attendance.date.desc())
        )
        return result.scalars().all()

    async def get_all_with_names(self, skip: int = 0, limit: int = 100) -> List:
        query = (
            select(Attendance, Employee.full_name.label("employee_name"))
            .join(Employee, Attendance.employee_id == Employee.id)
            .offset(skip)
            .limit(limit)
            .order_by(Attendance.date.desc())
        )
        result = await self.db.execute(query)
        return result.all()

    async def get_by_id(self, attendance_id: int) -> Optional[Attendance]:
        result = await self.db.execute(select(Attendance).filter(Attendance.id == attendance_id))
        return result.scalars().first()

    async def create(self, data) -> Tuple[bool, str, Optional[Attendance]]:
        existing = await self.db.execute(
            select(Attendance).filter(
                and_(Attendance.employee_id == data.employee_id, Attendance.date == data.date)
            )
        )
        if existing.scalars().first():
            return False, "يوجد سجل حضور لهذا الموظف في هذا التاريخ مسبقاً", None
        record = Attendance(
            employee_id=data.employee_id,
            date=data.date,
            check_in=data.check_in,
            check_out=data.check_out,
            status=AttendanceStatus(data.status),
            notes=data.notes,
        )
        self.db.add(record)
        await self.db.commit()
        await self.db.refresh(record)
        return True, "تم تسجيل الحضور بنجاح", record

    async def update(self, record: Attendance, data) -> Attendance:
        for field in ["check_in", "check_out", "status", "notes"]:
            value = getattr(data, field, None)
            if value is not None:
                setattr(record, field, value)
        self.db.add(record)
        await self.db.commit()
        await self.db.refresh(record)
        return record

    async def delete(self, attendance_id: int) -> bool:
        record = await self.get_by_id(attendance_id)
        if not record:
            return False
        await self.db.delete(record)
        await self.db.commit()
        return True

    async def get_stats_for_date(self, target_date: date) -> dict:
        present_result = await self.db.execute(
            select(func.count(Attendance.id)).filter(
                and_(Attendance.date == target_date, Attendance.status == AttendanceStatus.PRESENT)
            )
        )
        present = present_result.scalar() or 0
        absent_result = await self.db.execute(
            select(func.count(Attendance.id)).filter(
                and_(Attendance.date == target_date, Attendance.status == AttendanceStatus.ABSENT)
            )
        )
        absent = absent_result.scalar() or 0
        leave_result = await self.db.execute(
            select(func.count(Attendance.id)).filter(
                and_(Attendance.date == target_date, Attendance.status == AttendanceStatus.LEAVE)
            )
        )
        leave = leave_result.scalar() or 0
        return {"date": target_date.isoformat(), "present": present, "absent": absent, "leave": leave}