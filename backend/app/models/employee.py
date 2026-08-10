from datetime import datetime
from enum import Enum
from sqlalchemy import String, DateTime, Integer, Numeric, Boolean, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class SalaryType(str, Enum):
    FIXED_MONTHLY = "fixed_monthly"


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    national_id: Mapped[str] = mapped_column(String(50), nullable=True, index=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    job_title: Mapped[str] = mapped_column(String(150), nullable=True)
    salary_type: Mapped[SalaryType] = mapped_column(String(30), default=SalaryType.FIXED_MONTHLY, nullable=False)
    monthly_salary: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    hire_date: Mapped[datetime] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    attendance_records: Mapped[list["Attendance"]] = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LEAVE = "leave"


class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    date: Mapped[datetime] = mapped_column(Date, nullable=False, index=True)
    check_in: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    check_out: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    status: Mapped[AttendanceStatus] = mapped_column(String(20), default=AttendanceStatus.PRESENT, nullable=False)
    notes: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="attendance_records")