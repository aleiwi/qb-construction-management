from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class BuildingBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    floors_count: int = Field(default=1, ge=1)


class BuildingCreate(BuildingBase):
    project_id: int


class BuildingUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    floors_count: Optional[int] = Field(None, ge=1)


class StageOut(BaseModel):
    id: int
    building_id: int
    name: str
    description: Optional[str]
    weight_percent: float
    progress_percent: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BuildingOut(BuildingBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime
    stages: Optional[List[StageOut]] = []

    model_config = ConfigDict(from_attributes=True)


class BuildingListOut(BuildingBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime
    stages_count: Optional[int] = 0
    total_weight: Optional[float] = 0.0
    overall_progress: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)