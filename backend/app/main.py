from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError, HTTPException
from contextlib import asynccontextmanager
import logging
import uuid

from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.routers import auth, users, projects, buildings, stages, contractors, contracts, drawings, boq_elements, price_library, boq_items, payments, retentions, quality_checks, employees, reports, completion_reports, audit_logs, boq_summary
from app.schemas.response import APIResponse
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus
from app.models.building import Building
from app.models.stage import Stage
from app.models.contractor import Contractor
from app.models.contract import Contract, ContractStatus
from app.models.drawing import Drawing, DrawingStatus
from app.models.batch_job import BatchJob, BatchJobStatus
from app.models.boq_element import BOQElement, ClassificationStatus, ElementType
from app.models.price_library import PriceLibrary
from app.models.boq_item import BOQItem
from app.models.payment import Payment, PaymentStatus
from app.models.retention_release import RetentionRelease, ReleaseStatus
from app.models.quality_check import QualityCheck, QCStatus
from app.models.employee import Employee, Attendance
from app.models.completion_report import CompletionReport
from app.models.audit_log import AuditLog
from app.models.boq_project import BOQProject, BOQProjectStatus
from app.models.classification_training import ClassificationTraining
from app.core.security import get_password_hash
from sqlalchemy.future import select

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("qb")

SEED_USERS = [
    ("admin@qb.com",       "admin123",      "مدير النظام الرئيسي",        UserRole.ADMIN),
    ("pm@qb.com",          "pm123",         "مدير المشاريع",             UserRole.PROJECT_MANAGER),
    ("eng.ahmed@qb.com",   "engineer123",   "أحمد المهندس",              UserRole.ENGINEER),
    ("accountant@qb.com",  "accountant123", "خالد المحاسب",              UserRole.ACCOUNTANT),
    ("contractor@qb.com",  "contractor123", "مؤسسة المقاول الذهبية",     UserRole.CONTRACTOR),
]

async def init_db_seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        for email, password, full_name, role in SEED_USERS:
            result = await session.execute(select(User).filter(User.email == email))
            existing = result.scalars().first()
            if not existing:
                user = User(
                    email=email,
                    full_name=full_name,
                    hashed_password=get_password_hash(password),
                    role=role,
                    is_active=True,
                )
                session.add(user)
        await session.commit()

        # Seed demo data if no projects exist
        result = await session.execute(select(Project).limit(1))
        if result.scalars().first() is None:
            project = Project(name="مشروع الأمواج السكني", description="مشروع سكني متكامل بمساحة 5000م²", location="الرياض - حي النرجس", status=ProjectStatus.IN_PROGRESS)
            session.add(project)
            await session.flush()

            building = Building(name="عمارة أ", project_id=project.id, floors_count=5)
            session.add(building)
            await session.flush()

            for sname, weight in [("الأساسات", 15), ("الهيكل الخرساني", 35), ("البناء واللياسة", 20), ("التشطيبات", 20), ("التسليم النهائي", 10)]:
                stage = Stage(name=sname, building_id=building.id, weight_percent=weight, progress_percent=0.0)
                session.add(stage)

            contractor = Contractor(company_name="مؤسسة المقاول الذهبية", contact_person="أحمد العلي", email="info@golden-contractor.com", phone="0555000111", specialization="structural")
            session.add(contractor)
            await session.flush()

            contract = Contract(title="عقد تنفيذ مشروع الأمواج السكني", contractor_id=contractor.id, building_id=building.id, total_value=5000000.0, retention_percent=10.0, status="active")
            session.add(contract)

            employee = Employee(full_name="سعيد الحربي", national_id="1012345678", phone="0555000222", job_title="مهندس موقع", monthly_salary=12000.0, is_active=True)
            session.add(employee)

            await session.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_seed()
    # Load classification training data into memory
    from app.services.auto_learner import load_training_data
    async with AsyncSessionLocal() as session:
        await load_training_data(session)
    # Seed price library with Saudi market rates
    from app.services.pricing_engine import SEED_PRICES
    from app.services.price_library_service import PriceLibraryService
    async with AsyncSessionLocal() as session:
        svc = PriceLibraryService(session)
        for et, desc, unit, price in SEED_PRICES:
            existing = await svc.get_by_element_type(et)
            if not existing:
                await svc.create(element_type=et, unit=unit, unit_price=price, description=desc)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware Setup
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers for Unified API Error Shape (api-structure.md)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        422: "VALIDATION_ERROR",
        500: "INTERNAL_SERVER_ERROR"
    }
    code = code_map.get(exc.status_code, "ERROR")
    return JSONResponse(
        status_code=exc.status_code,
        content=APIResponse.fail(code=code, message=str(exc.detail)).model_dump()
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    first_err = exc.errors()[0] if exc.errors() else {}
    msg = f"خطأ في التحقق من البيانات: {first_err.get('msg', 'مدخل غير صالح')}"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=APIResponse.fail(code="VALIDATION_ERROR", message=msg).model_dump()
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    trace_id = uuid.uuid4().hex[:12]
    logger.exception(
        "Unhandled exception trace_id=%s method=%s path=%s",
        trace_id, request.method, request.url.path,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        headers={"X-Trace-Id": trace_id},
        content=APIResponse.fail(
            code="INTERNAL_SERVER_ERROR",
            message="حدث خطأ غير متوقع، الرجاء المحاولة لاحقًا"
        ).model_dump()
    )

@app.get("/api/v1/health")
async def health_check():
    db_status = "ok"
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Health check failed: database unreachable")
        db_status = "error"
    return APIResponse.ok(
        data={"status": db_status, "environment": settings.ENVIRONMENT, "version": "1.0.0"},
        message="Health check",
    )

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(buildings.router, prefix=settings.API_V1_STR)
app.include_router(stages.router, prefix=settings.API_V1_STR)
app.include_router(contractors.router, prefix=settings.API_V1_STR)
app.include_router(contracts.router, prefix=settings.API_V1_STR)
app.include_router(drawings.router, prefix=settings.API_V1_STR)
app.include_router(boq_elements.router, prefix=settings.API_V1_STR)
app.include_router(price_library.router, prefix=settings.API_V1_STR)
app.include_router(boq_items.router, prefix=settings.API_V1_STR)
app.include_router(boq_summary.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)
app.include_router(retentions.router, prefix=settings.API_V1_STR)
app.include_router(quality_checks.router, prefix=settings.API_V1_STR)
app.include_router(employees.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(completion_reports.router, prefix=settings.API_V1_STR)
app.include_router(audit_logs.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return APIResponse.ok(data={"version": "1.0.0"}, message="نظام إدارة المقاولات المتكامل - Backend API يعمل بنجاح")
