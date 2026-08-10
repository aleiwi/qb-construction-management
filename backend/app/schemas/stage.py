from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class StageBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    weight_percent: float = Field(default=0.0, ge=0, le=100)
    progress_percent: float = Field(default=0.0, ge=0, le=100)


class StageCreate(StageBase):
    building_id: int


class StageUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    weight_percent: Optional[float] = Field(None, ge=0, le=100)
    progress_percent: Optional[float] = Field(None, ge=0, le=100)


class StageOut(StageBase):
    id: int
    building_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StageProgressUpdate(BaseModel):
    progress_percent: float = Field(..., ge=0, le=100)