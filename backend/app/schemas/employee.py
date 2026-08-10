from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class EmployeeBase(BaseModel):
    full_name: str = Field(..., max_length=255)
    national_id: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=150)
    salary_type: str = "fixed_monthly"
    monthly_salary: float = Field(default=0.0, ge=0)
    hire_date: Optional[date] = None
    is_active: bool = True


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=255)
    national_id: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=150)
    monthly_salary: Optional[float] = Field(None, ge=0)
    hire_date: Optional[date] = None
    is_active: Optional[bool] = None


class EmployeeOut(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AttendanceBase(BaseModel):
    employee_id: int
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: str = "present"
    notes: Optional[str] = Field(None, max_length=500)


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=500)


class AttendanceOut(AttendanceBase):
    id: int
    created_at: datetime
    employee_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)