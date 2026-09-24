"""Quick villa estimator (merged from legacy QuantumBuild calculator).

Stateless compute endpoints — no DB writes. Roles mirror boq-summary.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.response import APIResponse
from app.schemas.estimator import EstimatorRequest, EstimatorCatalogItem
from app.services import villa_estimator
from app.dependencies.auth import require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/estimate", tags=["Estimator"])

_ESTIMATE_ROLES = [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.ACCOUNTANT]


@router.get("/catalog", response_model=APIResponse)
async def estimate_catalog(
    current_user: User = Depends(require_roles(_ESTIMATE_ROLES)),
):
    return APIResponse.ok(data=villa_estimator.catalog(), message="تم جلب بنود الحاسبة بنجاح")


@router.post("/calculate", response_model=APIResponse)
async def estimate_calculate(
    payload: EstimatorRequest,
    current_user: User = Depends(require_roles(_ESTIMATE_ROLES)),
):
    unknown = [i.name for i in payload.items if i.name not in villa_estimator.ITEMS]
    if unknown:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"بنود غير معروفة: {', '.join(unknown)}",
        )
    p = payload.prices
    items = [
        villa_estimator.calculate_item(
            i.name, i.length, i.width, i.thickness,
            p.concrete_price, p.steel_price, p.block_price, i.pre_area,
            i.conversion_factor,
        )
        for i in payload.items
    ]
    totals = villa_estimator.calculate_totals(
        items, p.factory_rate, p.overhead, p.profit_rate,
        p.backfill_qty, p.backfill_price, p.insulation_qty, p.insulation_price,
    )
    return APIResponse.ok(
        data={"items": items, "totals": totals},
        message="تم حساب التقدير بنجاح",
    )
