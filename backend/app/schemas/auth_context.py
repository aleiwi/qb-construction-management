from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ContractorContext(BaseModel):
    company_name: str
    contract_title: str
    contract_value: float
    contract_status: str

    model_config = ConfigDict(from_attributes=True)


class UserContext(BaseModel):
    role: str
    full_name: str
    email: str

    # Role-specific context
    linked_project: Optional[str] = None
    linked_building: Optional[str] = None
    linked_contractor: Optional[ContractorContext] = None
    total_projects: int = 0
    total_contracts: int = 0
