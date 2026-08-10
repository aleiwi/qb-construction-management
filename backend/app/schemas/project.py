from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.project import ProjectStatus


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    location: Optional[str] = Field(None, max_length=500)
    status: ProjectStatus = ProjectStatus.PLANNING


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    location: Optional[str] = Field(None, max_length=500)
    status: Optional[ProjectStatus] = None


class BuildingOut(BaseModel):
    id: int
    project_id: int
    name: str
    floors_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectOut(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    buildings: Optional[List[BuildingOut]] = []

    model_config = ConfigDict(from_attributes=True)


class ProjectListOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    location: Optional[str]
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime
    buildings_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class ProjectDetailOut(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    buildings: List[BuildingOut] = []

    model_config = ConfigDict(from_attributes=True)