# Regression tests for P0 fixes (docs/MASTER_ROADMAP.md Phase 0)
import math
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.core.config import settings
from app.main import app
from app.models.boq_element import BOQElement, ClassificationStatus, ElementType


# ---------- R-08: quantity_engine operator-precedence bug ----------

def test_wall_length_uses_bbox_when_no_explicit_length():
    from app.services.quantity_engine import compute_quantity
    # جدار مرسوم كمستطيل 12م × 0.2م: الطول من bbox = 12، السماكة = 0.2
    qty, unit, params = compute_quantity(ElementType.WALL, geometry_area=2.4, dimensions={"bbox_width": 12.0, "bbox_height": 0.2})
    assert unit == "م3"
    assert qty == pytest.approx(12.0 * 3.0 * 0.2, abs=1e-3)  # 7.2 — وليس sqrt(2.4)
    assert params["length"] == pytest.approx(12.0, abs=0.01)
    assert params["thickness"] == pytest.approx(0.2, abs=0.01)


def test_wall_length_falls_back_to_5m_when_no_geometry():
    from app.services.quantity_engine import compute_quantity
    qty, _, params = compute_quantity(ElementType.WALL, geometry_area=0)
    assert params["length"] == 5.0
    assert qty == pytest.approx(5.0 * 3.0 * 0.2)


def test_wall_length_prefers_explicit_length():
    from app.services.quantity_engine import compute_quantity
    _, _, params = compute_quantity(ElementType.WALL, geometry_area=100.0, geometry_length=7.5)
    assert params["length"] == 7.5


# ---------- R-08b: circular column must use πr² (not (2r)²) ----------

def test_circular_column_uses_pi_r_squared():
    from app.services.quantity_engine import compute_quantity
    import math
    r = 0.3
    qty, unit, params = compute_quantity(ElementType.COLUMN, geometry_area=math.pi * r * r, dimensions={"radius": r})
    assert unit == "م3"
    # الحجم = πr² × الارتفاع (3.0) — وليس (2r)² × 3 = 1.08
    assert qty == pytest.approx(math.pi * r * r * 3.0, abs=1e-3)


def test_square_column_uses_bbox():
    from app.services.quantity_engine import compute_quantity
    qty, _, params = compute_quantity(ElementType.COLUMN, geometry_area=0.09, dimensions={"bbox_width": 0.3, "bbox_height": 0.3})
    assert qty == pytest.approx(0.3 * 0.3 * 3.0, abs=1e-3)
    assert params["width"] == pytest.approx(0.3, abs=0.01)


# ---------- ج5: قراءة الأبعاد الحقيقية (نصوص + DIMENSION) ----------

def test_wall_uses_height_thickness_from_text():
    from app.services.quantity_engine import compute_quantity
    dims = {"bbox_width": 12.0, "bbox_height": 0.2, "_text_labels": ["H=3.5 T=0.25"]}
    qty, _, params = compute_quantity(ElementType.WALL, geometry_area=2.4, dimensions=dims)
    # 12 × 3.5 × 0.25 بدل الافتراضية 3.0/0.2
    assert qty == pytest.approx(12.0 * 3.5 * 0.25, abs=1e-3)
    assert params["height"] == pytest.approx(3.5, abs=0.01)
    assert params["thickness"] == pytest.approx(0.25, abs=0.01)


def test_wall_prefers_dim_length_from_dimension():
    from app.services.quantity_engine import compute_quantity
    dims = {"bbox_width": 12.0, "bbox_height": 0.2, "dim_length": 11.6, "dim_source": "DIMENSION"}
    qty, _, params = compute_quantity(ElementType.WALL, geometry_area=2.4, dimensions=dims)
    assert params["length"] == pytest.approx(11.6, abs=0.01)


def test_thickness_cm_unit_conversion():
    from app.services.quantity_engine import compute_quantity
    dims = {"bbox_width": 12.0, "bbox_height": 0.2, "_text_labels": ["T=25cm"]}
    qty, _, params = compute_quantity(ElementType.WALL, geometry_area=2.4, dimensions=dims)
    assert params["thickness"] == pytest.approx(0.25, abs=0.01)


def test_dimension_entity_linking_in_dxf():
    import os
    import tempfile
    import ezdxf
    from app.services.boq_extraction_service import extract_elements_from_dxf

    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (12, 0), (12, 0.2), (0, 0.2)], close=True, dxfattribs={"layer": "WALL"})
    msp.add_linear_dim(base=(0, -1), p1=(0, 0), p2=(12, 0), dxfattribs={"layer": "DIMS"}).render()

    tmp = os.path.join(tempfile.gettempdir(), "qb_dim_link_test.dxf")
    doc.saveas(tmp)
    try:
        extracted = extract_elements_from_dxf(tmp)
        walls = [e for e in extracted if e["element_type"] == ElementType.WALL]
        assert walls, "no wall extracted"
        dims = walls[0]["dimensions_json"]
        assert dims.get("dim_length") == pytest.approx(12.0, abs=0.01)
        assert dims.get("dim_source") == "DIMENSION"
    finally:
        os.unlink(tmp)


def test_text_labels_scoped_to_own_layer():
    import os
    import tempfile
    import ezdxf
    from app.services.boq_extraction_service import extract_elements_from_dxf
    from app.models.boq_element import ElementType

    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (12, 0), (12, 0.2), (0, 0.2)], close=True, dxfattribs={"layer": "WALL"})
    msp.add_circle((20, 15), 0.3, dxfattribs={"layer": "COLUMN"})
    msp.add_text("W=0.33 D=0.71", dxfattribs={"layer": "BEAM", "height": 0.3}).set_placement((10, 30))

    tmp = os.path.join(tempfile.gettempdir(), "qb_layer_text_test.dxf")
    doc.saveas(tmp)
    try:
        extracted = extract_elements_from_dxf(tmp)
        columns = [e for e in extracted if e["element_type"] == ElementType.COLUMN]
        assert columns
        labels = columns[0]["dimensions_json"].get("_text_labels", [])
        assert labels == [], f"column inherited beam text: {labels}"
    finally:
        os.unlink(tmp)


def test_mm_units_converted_to_meters():
    import os
    import tempfile
    import ezdxf
    from app.services.boq_extraction_service import extract_elements_from_dxf
    from app.models.boq_element import ElementType

    doc = ezdxf.new("R2010")
    doc.units = 4  # millimeters
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (12000, 0), (12000, 200), (0, 200)], close=True, dxfattribs={"layer": "WALL"})

    tmp = os.path.join(tempfile.gettempdir(), "qb_mm_units_test.dxf")
    doc.saveas(tmp)
    try:
        extracted = extract_elements_from_dxf(tmp)
        walls = [e for e in extracted if e["element_type"] == ElementType.WALL]
        assert walls
        d = walls[0]["dimensions_json"]
        # 12000mm → 12m، 200mm → 0.2m
        assert d["bbox_width"] == pytest.approx(12.0, abs=1e-3)
        assert d["bbox_height"] == pytest.approx(0.2, abs=1e-3)
        assert d["unit_scale"] == pytest.approx(0.001)
        # المساحة mm² → م²
        assert walls[0]["quantity"] == pytest.approx(12.0 * 0.2, abs=1e-3)
    finally:
        os.unlink(tmp)


# ---------- ج6: خصم فتحات الأبواب/النوافذ من الجدران ----------

def test_opening_deduction_in_dxf():
    import os
    import tempfile
    import ezdxf
    from app.services.boq_extraction_service import extract_elements_from_dxf

    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    # جدار 12م × 0.2م
    msp.add_lwpolyline([(0, 0), (12, 0), (12, 0.2), (0, 0.2)], close=True, dxfattribs={"layer": "WALL"})
    # باب 0.9م على الجدار (يغطي السماكة)
    msp.add_lwpolyline([(3, 0), (3.9, 0), (3.9, 0.2), (3, 0.2)], close=True, dxfattribs={"layer": "DOORS"})
    # نافذة 1.2م على الجدار
    msp.add_lwpolyline([(6, 0), (7.2, 0), (7.2, 0.2), (6, 0.2)], close=True, dxfattribs={"layer": "WINDOWS"})
    # نصوص ارتفاعات الفتحات
    msp.add_text("H=2.1", dxfattribs={"layer": "DOORS", "height": 0.3}).set_placement((1, 1))
    msp.add_text("H=1.2", dxfattribs={"layer": "WINDOWS", "height": 0.3}).set_placement((1, 1.5))

    tmp = os.path.join(tempfile.gettempdir(), "qb_opening_deduct_test.dxf")
    doc.saveas(tmp)
    try:
        extracted = extract_elements_from_dxf(tmp)
        walls = [e for e in extracted if e["element_type"] == ElementType.WALL]
        assert walls, "no wall extracted"
        dims = walls[0]["dimensions_json"]
        # خصم: 0.9×2.1 + 1.2×1.2 = 1.89 + 1.44 = 3.33 م2
        assert dims.get("opening_deduction_m2") == pytest.approx(3.33, abs=0.01)
        # الحجم = (12×3×0.2) − 3.33×0.2 = 7.2 − 0.666 = 6.534
        from app.services.quantity_engine import compute_quantity
        qty, unit, params = compute_quantity(ElementType.WALL, geometry_area=2.4, dimensions=dims)
        assert unit == "م3"
        assert qty == pytest.approx(6.534, abs=1e-3)
    finally:
        os.unlink(tmp)


def test_opening_deduction_no_openings_unchanged():
    import os
    import tempfile
    import ezdxf
    from app.services.boq_extraction_service import extract_elements_from_dxf

    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (12, 0), (12, 0.2), (0, 0.2)], close=True, dxfattribs={"layer": "WALL"})

    tmp = os.path.join(tempfile.gettempdir(), "qb_no_opening_test.dxf")
    doc.saveas(tmp)
    try:
        extracted = extract_elements_from_dxf(tmp)
        walls = [e for e in extracted if e["element_type"] == ElementType.WALL]
        dims = walls[0]["dimensions_json"]
        assert "opening_deduction_m2" not in dims
        from app.services.quantity_engine import compute_quantity
        qty, _, _ = compute_quantity(ElementType.WALL, geometry_area=2.4, dimensions=dims)
        assert qty == pytest.approx(12.0 * 3.0 * 0.2, abs=1e-3)  # 7.2 — بلا خصم
    finally:
        os.unlink(tmp)


def test_opening_far_from_wall_not_deducted():
    import os
    import tempfile
    import ezdxf
    from app.services.boq_extraction_service import extract_elements_from_dxf

    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (12, 0), (12, 0.2), (0, 0.2)], close=True, dxfattribs={"layer": "WALL"})
    # باب بعيد عن الجدار (مركزه خارج bbox + تسامح 0.5م)
    msp.add_lwpolyline([(40, 40), (40.9, 40), (40.9, 40.2), (40, 40.2)], close=True, dxfattribs={"layer": "DOORS"})

    tmp = os.path.join(tempfile.gettempdir(), "qb_far_opening_test.dxf")
    doc.saveas(tmp)
    try:
        extracted = extract_elements_from_dxf(tmp)
        walls = [e for e in extracted if e["element_type"] == ElementType.WALL]
        dims = walls[0]["dimensions_json"]
        assert "opening_deduction_m2" not in dims, "door far away must not be deducted"
    finally:
        os.unlink(tmp)


def test_opening_deduction_mm_units_scaled():
    import os
    import tempfile
    import ezdxf
    from app.services.boq_extraction_service import extract_elements_from_dxf

    doc = ezdxf.new("R2010")
    doc.units = 4  # mm
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (12000, 0), (12000, 200), (0, 200)], close=True, dxfattribs={"layer": "WALL"})
    # باب 900مم على جدار 200مم
    msp.add_lwpolyline([(3000, 0), (3900, 0), (3900, 200), (3000, 200)], close=True, dxfattribs={"layer": "DOORS"})
    msp.add_text("H=2100mm", dxfattribs={"layer": "DOORS", "height": 300}).set_placement((1000, 1000))

    tmp = os.path.join(tempfile.gettempdir(), "qb_opening_mm_test.dxf")
    doc.saveas(tmp)
    try:
        extracted = extract_elements_from_dxf(tmp)
        walls = [e for e in extracted if e["element_type"] == ElementType.WALL]
        dims = walls[0]["dimensions_json"]
        # 0.9م × 2.1م = 1.89 م2 (بعد التحويل من مم)
        assert dims.get("opening_deduction_m2") == pytest.approx(1.89, abs=0.01)
        from app.services.quantity_engine import compute_quantity
        qty, _, _ = compute_quantity(ElementType.WALL, geometry_area=12 * 0.2, dimensions=dims)
        # (12×3×0.2) − 1.89×0.2 = 6.822
        assert qty == pytest.approx(6.822, abs=1e-3)
    finally:
        os.unlink(tmp)


# ---------- ج7: فك كتل INSERT (أبواب/نوافذ ككتل + تحويل المواقع) ----------

def test_door_as_insert_block_is_one_unit():
    import os
    import tempfile
    import ezdxf
    from app.services.boq_extraction_service import extract_elements_from_dxf

    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    # كتلة باب: مستطيل 1×1 يُدرج بمقياس 0.9×2.1
    blk = doc.blocks.new("QB_DOOR")
    blk.add_lwpolyline([(0, 0), (1, 0), (1, 1), (0, 1)], close=True, dxfattribs={"layer": "0"})
    for i in range(3):
        msp.add_blockref("QB_DOOR", (5.0 + i * 1.5, 35.0),
                         dxfattribs={"layer": "DOORS", "xscale": 0.9, "yscale": 2.1})

    tmp = os.path.join(tempfile.gettempdir(), "qb_insert_door_test.dxf")
    doc.saveas(tmp)
    try:
        extracted = extract_elements_from_dxf(tmp)
        doors = [e for e in extracted if e["element_type"] == ElementType.DOOR]
        assert len(doors) == 3, f"expected 3 doors (one per block), got {len(doors)}"
        d = doors[0]["dimensions_json"]
        # bbox من الكتلة المحوّلة: 0.9 × 2.1
        assert d["bbox_width"] == pytest.approx(0.9, abs=0.01)
        assert d["bbox_height"] == pytest.approx(2.1, abs=0.01)
    finally:
        os.unlink(tmp)


def test_insert_block_with_transformation_position():
    import os
    import tempfile
    import ezdxf
    from app.services.boq_extraction_service import extract_elements_from_dxf

    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    # كتلة جدار تُدرج في موقع (10, 20) بمقياس 2×1
    blk = doc.blocks.new("QB_WALL")
    blk.add_lwpolyline([(0, 0), (6, 0), (6, 0.2), (0, 0.2)], close=True, dxfattribs={"layer": "0"})
    msp.add_blockref("QB_WALL", (10, 20), dxfattribs={"layer": "WALLS", "xscale": 2, "yscale": 1})

    tmp = os.path.join(tempfile.gettempdir(), "qb_insert_wall_test.dxf")
    doc.saveas(tmp)
    try:
        extracted = extract_elements_from_dxf(tmp)
        walls = [e for e in extracted if e["element_type"] == ElementType.WALL]
        assert len(walls) == 1, f"expected 1 wall, got {len(walls)}"
        d = walls[0]["dimensions_json"]
        # الموقع مُحوّل: origin_min ≈ (10, 20) والأبعاد مضاعفة (12×0.2)
        assert d["bbox_width"] == pytest.approx(12.0, abs=0.01)
        assert d["bbox_height"] == pytest.approx(0.2, abs=0.01)
        assert d["origin_min"][0] == pytest.approx(10.0, abs=0.01)
        assert d["origin_min"][1] == pytest.approx(20.0, abs=0.01)
        from app.services.quantity_engine import compute_quantity
        qty, _, _ = compute_quantity(ElementType.WALL, geometry_area=12 * 0.2, dimensions=d)
        assert qty == pytest.approx(12.0 * 3.0 * 0.2, abs=1e-3)
    finally:
        os.unlink(tmp)


def test_door_block_on_wall_deducted():
    import os
    import tempfile
    import ezdxf
    from app.services.boq_extraction_service import extract_elements_from_dxf

    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (12, 0), (12, 0.2), (0, 0.2)], close=True, dxfattribs={"layer": "WALL"})
    # باب ككتلة (0.9×0.2) داخل الجدار
    blk = doc.blocks.new("QB_OPEN")
    blk.add_lwpolyline([(0, 0), (1, 0), (1, 1), (0, 1)], close=True, dxfattribs={"layer": "0"})
    msp.add_blockref("QB_OPEN", (3, 0), dxfattribs={"layer": "DOORS", "xscale": 0.9, "yscale": 0.2})
    msp.add_text("H=2.1", dxfattribs={"layer": "DOORS", "height": 0.3}).set_placement((1, 1))

    tmp = os.path.join(tempfile.gettempdir(), "qb_insert_deduct_test.dxf")
    doc.saveas(tmp)
    try:
        extracted = extract_elements_from_dxf(tmp)
        walls = [e for e in extracted if e["element_type"] == ElementType.WALL]
        dims = walls[0]["dimensions_json"]
        assert dims.get("opening_deduction_m2") == pytest.approx(0.9 * 2.1, abs=0.01)
        from app.services.quantity_engine import compute_quantity
        qty, _, _ = compute_quantity(ElementType.WALL, geometry_area=12 * 0.2, dimensions=dims)
        assert qty == pytest.approx(12 * 3 * 0.2 - 0.9 * 2.1 * 0.2, abs=1e-3)
    finally:
        os.unlink(tmp)


# ---------- R-10: classifier_rules multi-type string bug ----------def test_geometry_match_lwpolyline_large_area_is_slab():
    from app.services.classifier_rules import _geometry_match
    for geo in ("LWPOLYLINE", "POLYLINE", "SPLINE", "POLYGON"):
        match = _geometry_match(geo, {"area": 50.0})
        assert match is not None, f"no match for {geo}"
        assert match.element_type == ElementType.SLAB


def test_geometry_match_small_polygon_is_not_slab():
    from app.services.classifier_rules import _geometry_match
    assert _geometry_match("LWPOLYLINE", {"area": 5.0}) is None


# ---------- R-09: comparison report joins via building_id ----------

@pytest_asyncio.fixture
async def project_with_drawing():
    """Project + building + drawing + element inserted directly via DB."""
    from sqlalchemy.future import select
    from app.core.database import AsyncSessionLocal
    from app.models.project import Project
    from app.models.building import Building
    from app.models.drawing import Drawing

    async with AsyncSessionLocal() as db:
        project = Project(name="مشروع مقارنة", status="in_progress")
        db.add(project)
        await db.flush()
        building = Building(name="مبنى 1", project_id=project.id, floors_count=3)
        db.add(building)
        await db.flush()
        drawing = Drawing(
            building_id=building.id,
            file_name="plan.dxf",
            file_path="/tmp/plan.dxf",
            status="completed",
        )
        db.add(drawing)
        await db.flush()
        element = BOQElement(
            drawing_id=drawing.id,
            element_type=ElementType.WALL,
            classification_status=ClassificationStatus.AUTO_CLASSIFIED,
            source_layer_name="a-wall",
            quantity=12.5,
            unit="م3",
        )
        db.add(element)
        await db.commit()
        ids = (project.id, building.id, drawing.id, element.id)

    yield ids


async def test_comparison_report_project_with_drawing(project_with_drawing):
    from app.core.database import AsyncSessionLocal
    from app.services.comparison_report import generate_comparison_report
    project_id, _, _, element_id = project_with_drawing

    async with AsyncSessionLocal() as db:
        report = await generate_comparison_report(db, project_id)

    assert report["total_elements"] == 1
    assert report["auto_elements"] == 1
    assert report["comparisons"][0]["element_id"] == element_id
    assert report["comparisons"][0]["auto_type"] == "wall"


async def test_comparison_report_project_without_buildings():
    from app.core.database import AsyncSessionLocal
    from app.services.comparison_report import generate_comparison_report

    async with AsyncSessionLocal() as db:
        report = await generate_comparison_report(db, 999999)

    assert report["total_elements"] == 0
    assert report["comparisons"] == []


# ---------- R-07: BOQ link endpoint (unit_price, no squaring) ----------

async def test_boq_link_without_unit_price_uses_price_library(admin_client, project_with_drawing):
    from app.core.database import AsyncSessionLocal
    from sqlalchemy.future import select
    from app.models.drawing import Drawing

    async with AsyncSessionLocal() as db:
        drawing = (await db.execute(select(Drawing).filter(Drawing.file_name == "plan.dxf"))).scalars().first()
        element = (await db.execute(select(BOQElement).filter(BOQElement.drawing_id == drawing.id))).scalars().first()
        element_id = element.id
        qty = float(element.quantity)

    res = await admin_client.post("/api/v1/price-library", json={
        "element_type": "wall", "unit": "م3", "unit_price": 500.0,
    })
    assert res.status_code == 200, res.text
    price_ref_id = res.json()["data"]["id"]

    res = await admin_client.post("/api/v1/boq-items", json={
        "boq_element_id": element_id, "price_ref_id": price_ref_id,
    })
    assert res.status_code == 200, res.text
    item = res.json()["data"]
    assert item["quantity"] == qty
    assert item["unit_price"] == 500.0
    assert item["total_price"] == pytest.approx(round(qty * 500.0, 2))
    assert item["total_price"] == pytest.approx(6250.0)  # 12.5 * 500 — no squaring


async def test_boq_link_with_explicit_unit_price(admin_client, project_with_drawing):
    from app.core.database import AsyncSessionLocal
    from sqlalchemy.future import select
    from app.models.drawing import Drawing

    async with AsyncSessionLocal() as db:
        drawing = (await db.execute(select(Drawing).filter(Drawing.file_name == "plan.dxf"))).scalars().first()
        element = (await db.execute(select(BOQElement).filter(BOQElement.drawing_id == drawing.id))).scalars().first()
        element_id = element.id

    res = await admin_client.post("/api/v1/price-library", json={
        "element_type": "wall", "unit": "م3", "unit_price": 500.0,
    })
    price_ref_id = res.json()["data"]["id"]

    res = await admin_client.post("/api/v1/boq-items", json={
        "boq_element_id": element_id, "price_ref_id": price_ref_id, "unit_price": 600.0,
    })
    assert res.status_code == 200, res.text
    item = res.json()["data"]
    assert item["unit_price"] == 600.0
    assert item["total_price"] == pytest.approx(12.5 * 600.0)


# ---------- R-04/R-06: error handler + health endpoint ----------

async def test_health_endpoint(client):
    res = await client.get("/api/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert body["data"]["status"] == "ok"
    assert body["data"]["environment"] == settings.ENVIRONMENT


async def test_unauthenticated_uploads_mount_removed(client):
    # The former open static mount must no longer exist.
    res = await client.get("/uploads/")
    assert res.status_code == 404


async def test_unhandled_exception_is_sanitized(client):
    # Unknown route → 404 handled by FastAPI (no leak).
    res = await client.get("/api/v1/definitely-not-a-route")
    assert res.status_code == 404

    # Starlette sends the 500 response then re-raises so servers/tests can log it.
    safe_transport = ASGITransport(app=app, raise_app_exceptions=False)

    @app.get("/api/v1/_test_crash")
    async def _test_crash():
        raise ValueError("TOP_SECRET_INTERNAL_VALUE")

    try:
        async with AsyncClient(transport=safe_transport, base_url="http://test") as safe_client:
            res = await safe_client.get("/api/v1/_test_crash")
    finally:
        app.router.routes[:] = [r for r in app.router.routes if getattr(r, "path", None) != "/api/v1/_test_crash"]

    assert res.status_code == 500
    assert "TOP_SECRET_INTERNAL_VALUE" not in res.text
    assert res.headers.get("X-Trace-Id")
