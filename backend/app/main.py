from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
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
from app.models.user_project import UserProject
from app.models.boq_project import BOQProject, BOQProjectStatus
from app.models.classification_training import ClassificationTraining
from app.core.security import get_password_hash, verify_password
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

async def _ensure_user_security_columns() -> None:
    """SQLite-only lightweight migration: add lockout columns to existing dev DBs
    (create_all does not alter existing tables). Fresh Postgres DBs are fully
    created by create_all and need no migration."""
    if not str(settings.DATABASE_URL).startswith("sqlite"):
        return
    async with engine.begin() as conn:
        cols = (await conn.execute(text("PRAGMA table_info(users)"))).fetchall()
        existing = {c[1] for c in cols}
        if "failed_login_attempts" not in existing:
            await conn.execute(text("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0"))
            logger.info("migration: added users.failed_login_attempts column")
        if "locked_until" not in existing:
            await conn.execute(text("ALTER TABLE users ADD COLUMN locked_until DATETIME"))
            logger.info("migration: added users.locked_until column")
        if "is_email_verified" not in existing:
            await conn.execute(text("ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN NOT NULL DEFAULT 0"))
            logger.info("migration: added users.is_email_verified column")
    async with engine.begin() as conn:
        cols = (await conn.execute(text("PRAGMA table_info(contractors)"))).fetchall()
        existing = {c[1] for c in cols}
        if "user_id" not in existing:
            await conn.execute(text("ALTER TABLE contractors ADD COLUMN user_id INTEGER"))
            logger.info("migration: added contractors.user_id column")


async def init_db_seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await _ensure_user_security_columns()

    # Production: never seed demo users/entities; fail fast if the default
    # admin still exists with its default password.
    if settings.ENVIRONMENT == "production":
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).filter(User.email == "admin@qb.com"))
            default_admin = result.scalars().first()
            if default_admin and verify_password("admin123", default_admin.hashed_password):
                raise RuntimeError(
                    "رفض بدء التشغيل: مستخدم admin@qb.com موجود بكلمة المرور الافتراضية. "
                    "غيّر كلمة المرور أو احذف المستخدم قبل تشغيل بيئة الإنتاج."
                )

            # First-admin bootstrap: production seeds no demo users, so when the
            # users table is empty we create the initial admin from env vars.
            # Idempotent — only runs while there is no user at all.
            if (settings.FIRST_ADMIN_EMAIL and settings.FIRST_ADMIN_FULL_NAME
                    and settings.FIRST_ADMIN_PASSWORD):
                any_user = (await session.execute(select(User).limit(1))).scalars().first()
                if not any_user:
                    session.add(User(
                        email=settings.FIRST_ADMIN_EMAIL,
                        full_name=settings.FIRST_ADMIN_FULL_NAME,
                        hashed_password=get_password_hash(settings.FIRST_ADMIN_PASSWORD),
                        role=UserRole.ADMIN,
                        is_active=True,
                        is_email_verified=True,
                    ))
                    await session.commit()
                    logger.info(
                        "تم إنشاء أول مدير من متغيرات البيئة: %s",
                        settings.FIRST_ADMIN_EMAIL,
                    )
        return

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

        # Link CONTRACTOR-role users to their Contractor records. Fresh seeds and
        # existing dev DBs may have Contractor.user_id unset; the auth context and
        # RLS filtering rely on this link, so heal it here (company_name fallback).
        result = await session.execute(select(Contractor).where(Contractor.user_id.is_(None)))
        for contractor in result.scalars().all():
            user_result = await session.execute(
                select(User).where(
                    User.role == UserRole.CONTRACTOR,
                    User.full_name.ilike(f"%{contractor.company_name}%"),
                )
            )
            linked_user = user_result.scalars().first()
            if linked_user:
                contractor.user_id = linked_user.id
        await session.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_seed()
    # ج9: أي مخطط عالق بحالة processing من تشغيل سابق (ضاعت مهمة الخلفية عند
    # إعادة تشغيل الخادم) يُعلَّم كفاشل برسالة واضحة بدل أن ينتظر المستخدم للأبد.
    from sqlalchemy import update
    async with AsyncSessionLocal() as session:
        stuck = await session.execute(
            update(Drawing)
            .where(Drawing.status == DrawingStatus.PROCESSING)
            .values(
                status=DrawingStatus.FAILED,
                error_message="انقطعت المعالجة بسبب إعادة تشغيل الخادم. أعد رفع المخطط للمحاولة مجددًا.",
            )
        )
        if stuck.rowcount:
            await session.commit()
            logger.info("تم إعادة تعيين %s مخططًا عالقًا بحالة processing", stuck.rowcount)
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

# Trusted hosts: reject requests with forged/unknown Host headers in production
trusted_hosts = [h.strip() for h in settings.TRUSTED_HOSTS.split(",") if h.strip()]
if trusted_hosts and trusted_hosts != ["*"]:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=trusted_hosts)

# HTTPS enforcement in production (terminated by nginx/caddy: X-Forwarded-Proto).
# FORCE_HTTPS=false disables the redirect for intentional plain-HTTP deployments
# (e.g. IP-only setups without a domain) — otherwise every API call would 307
# into an unreachable https:// URL.
if settings.ENVIRONMENT == "production" and settings.FORCE_HTTPS:
    @app.middleware("http")
    async def enforce_https(request: Request, call_next):
        proto = request.headers.get("x-forwarded-proto", "")
        if request.url.scheme == "http" and proto.lower() != "https":
            url = request.url.replace(scheme="https")
            return RedirectResponse(url=str(url), status_code=status.HTTP_307_TEMPORARY_REDIRECT)
        return await call_next(request)

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
