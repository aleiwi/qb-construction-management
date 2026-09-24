from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class EstimatorItemIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    length: float = Field(default=0.0, ge=0.0, le=100000.0)
    width: float = Field(default=0.0, ge=0.0, le=100000.0)
    thickness: float = Field(default=0.0, ge=0.0, le=100.0)
    pre_area: float = Field(default=0.0, ge=0.0, le=1000000.0)


class EstimatorPricesIn(BaseModel):
    concrete_price: float = Field(default=0.0, ge=0.0, le=100000.0)
    steel_price: float = Field(default=0.0, ge=0.0, le=1000000.0)
    block_price: float = Field(default=0.0, ge=0.0, le=100000.0)
    factory_rate: float = Field(default=0.0, ge=0.0, le=100000.0)
    overhead: float = Field(default=0.0, ge=0.0, le=100000000.0)
    profit_rate: float = Field(default=0.0, ge=0.0, le=100.0)
    backfill_qty: float = Field(default=0.0, ge=0.0)
    backfill_price: float = Field(default=0.0, ge=0.0)
    insulation_qty: float = Field(default=0.0, ge=0.0)
    insulation_price: float = Field(default=0.0, ge=0.0)


class EstimatorRequest(BaseModel):
    items: List[EstimatorItemIn] = Field(default_factory=list, max_length=200)
    prices: EstimatorPricesIn = Field(default_factory=EstimatorPricesIn)


class EstimatorCatalogItem(BaseModel):
    name: str
    group: str
    group_label: str
    steel_ratio: float

    model_config = ConfigDict(from_attributes=True)
