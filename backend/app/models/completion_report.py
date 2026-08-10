from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, DateTime, Integer, ForeignKey, Text, Date, Boolean
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class CompletionReport(Base):
    __tablename__ = "completion_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    report_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    report_period: Mapped[str] = mapped_column(String(100), nullable=True)
    period_type: Mapped[str] = mapped_column(String(20), default="monthly", nullable=False)
    period_start: Mapped[datetime] = mapped_column(Date, nullable=True)
    period_end: Mapped[datetime] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    parent_report_id: Mapped[int] = mapped_column(Integer, ForeignKey("completion_reports.id", ondelete="SET NULL"), nullable=True)
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project: Mapped["Project"] = relationship("Project")
    creator: Mapped["User"] = relationship("User")
    parent: Mapped[Optional["CompletionReport"]] = relationship("CompletionReport", remote_side="CompletionReport.id", foreign_keys=[parent_report_id])


from app.models.project import Project
from app.models.user import User