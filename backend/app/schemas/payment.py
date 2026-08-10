from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.payment import PaymentStatus


class PaymentBase(BaseModel):
    amount: float = Field(default=0.0, ge=0)
    due_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)


class PaymentCreate(PaymentBase):
    contract_id: int
    stage_id: int


class PaymentUpdate(BaseModel):
    amount: Optional[float] = Field(None, ge=0)
    status: Optional[PaymentStatus] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)


class PaymentApprove(BaseModel):
    status: PaymentStatus


class ContractRef(BaseModel):
    id: int
    title: str

    model_config = ConfigDict(from_attributes=True)


class StageRef(BaseModel):
    id: int
    name: str
    progress_percent: float

    model_config = ConfigDict(from_attributes=True)


class PaymentOut(PaymentBase):
    id: int
    contract_id: int
    stage_id: int
    amount: float
    retention_amount: float
    net_amount: float
    status: PaymentStatus
    approved_by: Optional[int]
    paid_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    contract: Optional[ContractRef] = None
    stage: Optional[StageRef] = None

    model_config = ConfigDict(from_attributes=True)


class PaymentListOut(BaseModel):
    id: int
    contract_id: int
    stage_id: int
    amount: float
    retention_amount: float
    net_amount: float
    status: PaymentStatus
    paid_at: Optional[datetime]
    contract_title: Optional[str] = None
    stage_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)