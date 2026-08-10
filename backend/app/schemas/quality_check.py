from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class QualityCheckBase(BaseModel):
    notes: Optional[str] = Field(None, max_length=1000)


class QualityCheckCreate(QualityCheckBase):
    stage_id: int


class QualityCheckUpdate(BaseModel):
    status: str
    notes: Optional[str] = Field(None, max_length=1000)


class StageRef(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class QualityCheckOut(QualityCheckBase):
    id: int
    stage_id: int
    inspected_by: Optional[int]
    status: str
    checked_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    stage: Optional[StageRef] = None

    model_config = ConfigDict(from_attributes=True)


class QualityCheckListOut(BaseModel):
    id: int
    stage_id: int
    inspected_by: Optional[int]
    status: str
    notes: Optional[str]
    checked_at: Optional[datetime]
    created_at: datetime
    stage_name: Optional[str] = None
    building_name: Optional[str] = None
    project_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)