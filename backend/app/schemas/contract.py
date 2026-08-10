from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.contract import ContractStatus


class ContractBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    total_value: float = Field(default=0.0, ge=0)
    retention_percent: float = Field(default=10.0, ge=0, le=100)
    status: ContractStatus = ContractStatus.DRAFT
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ContractCreate(ContractBase):
    contractor_id: int
    building_id: int


class ContractUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    total_value: Optional[float] = Field(None, ge=0)
    retention_percent: Optional[float] = Field(None, ge=0, le=100)
    status: Optional[ContractStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class BuildingRef(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class ContractorRef(BaseModel):
    id: int
    company_name: str

    model_config = ConfigDict(from_attributes=True)


class ContractOut(ContractBase):
    id: int
    contractor_id: int
    building_id: int
    created_at: datetime
    updated_at: datetime
    contractor: Optional[ContractorRef] = None
    building: Optional[BuildingRef] = None

    model_config = ConfigDict(from_attributes=True)


class ContractListOut(ContractBase):
    id: int
    contractor_id: int
    building_id: int
    created_at: datetime
    updated_at: datetime
    contractor_name: Optional[str] = None
    building_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)