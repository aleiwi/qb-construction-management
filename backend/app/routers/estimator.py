"""Quick villa estimator (merged from legacy QuantumBuild calculator).

Mostly stateless compute; only the market reference reads the price library.
"""
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.response import APIResponse
from app.schemas.estimator import EstimatorRequest, EstimatorCatalogItem
from app.services import villa_estimator
from app.services.price_library_service import PriceLibraryService
from app.dependencies.auth import require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/estimate", tags=["Estimator"])

_ESTIMATE_ROLES = [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.ACCOUNTANT]


@router.get("/catalog", response_model=APIResponse)
async def estimate_catalog(
    current_user: User = Depends(require_roles(_ESTIMATE_ROLES)),
):
    return APIResponse.ok(data=villa_estimator.catalog(), message="تم جلب بنود الحاسبة بنجاح")


async def _library_map(db: AsyncSession) -> dict:
    svc = PriceLibraryService(db)
    return {p.element_type: float(p.unit_price) for p in await svc.get_all(limit=200)}


def _compute(payload: EstimatorRequest) -> dict:
    unknown = [i.name for i in payload.items if i.name not in villa_estimator.ITEMS]
    if unknown:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"بنود غير معروفة: {', '.join(unknown)}",
        )
    # Legacy parity: material prices are mandatory and positive.
    for key, label in (("concrete_price", "سعر الخرسانة"), ("steel_price", "سعر الحديد"),
                       ("block_price", "سعر البلوك")):
        if getattr(payload.prices, key) <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{label} يجب أن يكون أكبر من صفر",
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
    return {"items": items, "totals": totals}


@router.post("/calculate", response_model=APIResponse)
async def estimate_calculate(
    payload: EstimatorRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(_ESTIMATE_ROLES)),
):
    data = _compute(payload)
    data["market"] = villa_estimator.market_comparison(
        payload.prices.concrete_price, payload.prices.steel_price,
        payload.prices.block_price, await _library_map(db),
    )
    return APIResponse.ok(data=data, message="تم حساب التقدير بنجاح")


@router.post("/export/excel")
async def estimate_export_excel(
    payload: EstimatorRequest,
    current_user: User = Depends(require_roles(_ESTIMATE_ROLES)),
):
    from app.services.estimate_export import export_estimate_excel
    data = _compute(payload)
    content = export_estimate_excel(data["items"], data["totals"])
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="estimate.xlsx"'},
    )


@router.post("/export/pdf")
async def estimate_export_pdf(
    payload: EstimatorRequest,
    current_user: User = Depends(require_roles(_ESTIMATE_ROLES)),
):
    from app.services.estimate_export import export_estimate_pdf
    data = _compute(payload)
    content = export_estimate_pdf(data["items"], data["totals"])
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="estimate.pdf"'},
    )
