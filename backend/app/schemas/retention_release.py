from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.retention_release import ReleaseStatus


class RetentionReleaseBase(BaseModel):
    contract_id: int
    retained_amount: float = Field(default=0.0, ge=0)
    maintenance_period_end_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)


class RetentionReleaseCreate(RetentionReleaseBase):
    pass


class RetentionReleaseUpdate(BaseModel):
    retained_amount: Optional[float] = Field(None, ge=0)
    maintenance_period_end_date: Optional[datetime] = None
    release_status: Optional[ReleaseStatus] = None
    notes: Optional[str] = Field(None, max_length=500)


class RetentionReleaseOut(RetentionReleaseBase):
    id: int
    release_status: ReleaseStatus
    released_at: Optional[datetime]
    released_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)