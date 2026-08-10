from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class ContractorBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    specialization: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None


class ContractorCreate(ContractorBase):
    pass


class ContractorUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    specialization: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class ContractOut(BaseModel):
    id: int
    contractor_id: int
    building_id: int
    title: str
    description: Optional[str]
    total_value: float
    retention_percent: float
    status: str
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContractorOut(ContractorBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    contracts: Optional[List[ContractOut]] = []

    model_config = ConfigDict(from_attributes=True)


class ContractorListOut(ContractorBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    contracts_count: Optional[int] = 0
    total_contract_value: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)