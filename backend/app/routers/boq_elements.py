from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.boq_element import (
    BOQElementClassify, BOQElementReviewOut, BOQElementOut
)
from app.schemas.response import APIResponse
from app.services.boq_element_service import BOQElementService
from app.services.boq_extraction_service import ElementType
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.boq_element import ClassificationStatus

router = APIRouter(prefix="/boq-elements", tags=["BOQ Elements"])


@router.get("", response_model=APIResponse)
async def list_boq_elements(
    drawing_id: int = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=2000),
    search: Optional[str] = Query(None),
    element_type: Optional[str] = Query(None),
    classification_status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    service = BOQElementService(db)
    elements = await service.get_by_drawing(
        drawing_id,
        skip=skip,
        limit=limit,
        search=search,
        element_type=element_type,
        classification_status=classification_status,
    )
    total = await service.count_by_drawing(
        drawing_id,
        search=search,
        element_type=element_type,
        classification_status=classification_status,
    )
    return APIResponse.ok(
        data={
            "items": [BOQElementOut.model_validate(e) for e in elements],
            "total": total,
        },
        message="تم جلب العناصر بنجاح",
    )


@router.get("/summary", response_model=APIResponse)
async def get_drawing_elements_summary(
    drawing_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    service = BOQElementService(db)
    data = await service.get_drawing_summary(drawing_id)
    return APIResponse.ok(data=data, message="تم جلب ملخص العناصر بنجاح")


@router.get("/unclassified", response_model=APIResponse[List[BOQElementReviewOut]])
async def list_unclassified(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    service = BOQElementService(db)
    elements = await service.get_unclassified(skip=skip, limit=limit)
    return APIResponse.ok(data=[BOQElementReviewOut.model_validate(e) for e in elements], message="تم جلب العناصر غير المصنفة")


@router.patch("/{element_id}/classify", response_model=APIResponse[BOQElementOut])
async def classify_element(
    element_id: int,
    classify_data: BOQElementClassify,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    service = BOQElementService(db)
    element = await service.get_by_id(element_id)
    if not element:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="العنصر غير موجود")
    updated = await service.classify_element(element, classify_data, current_user.id)
    return APIResponse.ok(data=BOQElementOut.model_validate(updated), message="تم تصنيف العنصر بنجاح")


@router.post("/bulk-classify", response_model=APIResponse)
async def bulk_classify(
    element_ids: List[int],
    element_type: ElementType,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER])),
):
    service = BOQElementService(db)
    count = await service.bulk_classify(element_ids, element_type, current_user.id)
    return APIResponse.ok(data={"count": count}, message=f"تم تصنيف {count} عنصر بنجاح")


@router.post("/reclassify-ai", response_model=APIResponse)
async def reclassify_with_ai(
    drawing_id: Optional[int] = None,
    use_llm: bool = False,
    limit: int = 200,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    from app.services.ai_classifier_service import reclassify_unclassified, reclassify_drawing

    if drawing_id:
        result = await reclassify_drawing(db, drawing_id, current_user.id, use_llm=use_llm)
    else:
        result = await reclassify_unclassified(db, current_user.id, use_llm=use_llm, limit=limit)

    return APIResponse.ok(data=result, message=f"تمت معالجة {result['processed']} عنصر، تم تصنيف {result['classified']}")


@router.get("/stats", response_model=APIResponse)
async def get_classification_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.ENGINEER])),
):
    from app.services.ai_classifier_service import get_classification_stats as stats
    data = await stats(db)
    return APIResponse.ok(data=data, message="تم جلب إحصائيات التصنيف")