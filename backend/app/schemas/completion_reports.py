from datetime import datetime, date
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


class CompletionReportBase(BaseModel):
    report_data: Dict[str, Any] = Field(default_factory=dict)
    report_period: Optional[str] = Field(None, max_length=100)
    period_type: str = "monthly"
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    status: str = "draft"


class CompletionReportCreate(CompletionReportBase):
    project_id: int
    parent_report_id: Optional[int] = None


class CompletionReportUpdate(BaseModel):
    report_data: Optional[Dict[str, Any]] = None
    report_period: Optional[str] = Field(None, max_length=100)
    period_type: Optional[str] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    status: Optional[str] = None
    is_archived: Optional[bool] = None


class CloneRequest(BaseModel):
    report_period: str = Field(..., max_length=100)
    period_type: str = "monthly"
    period_start: Optional[date] = None
    period_end: Optional[date] = None


class CompletionReportOut(CompletionReportBase):
    id: int
    project_id: int
    parent_report_id: Optional[int]
    is_archived: bool
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompletionReportListItem(BaseModel):
    """Slim version for the period navigation bar."""
    id: int
    project_id: int
    report_period: Optional[str]
    period_type: str
    period_start: Optional[date]
    period_end: Optional[date]
    status: str
    is_archived: bool
    parent_report_id: Optional[int]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)