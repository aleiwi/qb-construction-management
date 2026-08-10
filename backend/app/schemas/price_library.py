from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class PriceLibraryBase(BaseModel):
    element_type: str = Field(..., max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    unit: str = Field(default="م2", max_length=20)
    unit_price: float = Field(default=0.0, ge=0)


class PriceLibraryCreate(PriceLibraryBase):
    pass


class PriceLibraryUpdate(BaseModel):
    element_type: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    unit: Optional[str] = Field(None, max_length=20)
    unit_price: Optional[float] = Field(None, ge=0)


class PriceLibraryOut(PriceLibraryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)