import pytest
from pathlib import Path


@pytest.mark.asyncio
async def test_boq_e2e_upload_and_summary(admin_client, seeded):
    """E2E: upload DXF via batch endpoint -> BOQ summary shows elements."""
    # Locate the fixture DXF regardless of CWD.
    here = Path(__file__).resolve().parent
    for candidate in (
        here / "test_boq2.dxf",
        here.parent / "test_boq2.dxf",
        here.parent.parent / "test_boq2.dxf",
        Path.cwd() / "test_boq2.dxf",
    ):
        if candidate.exists():
            dxf_path = candidate
            break
    else:
        pytest.skip("test_boq2.dxf fixture not found")

    building_id = seeded["building_id"]

    # 1. Upload the DXF to the batch endpoint (multipart field is `files`).
    with open(dxf_path, "rb") as fh:
        files = {"files": ("test_boq2.dxf", fh, "application/dxf")}
        upload_res = await admin_client.post(
            f"/api/v1/drawings/batch?building_id={building_id}", files=files
        )
    assert upload_res.status_code == 200, upload_res.text
    batch = upload_res.json()["data"]
    assert batch["status"] == "completed"
    assert batch["completed_files"] >= 1

    # 2. BOQ summary for the seeded project must include the parsed elements.
    project_id = seeded["project_id"]
    summary_res = await admin_client.get(f"/api/v1/boq-summary/project/{project_id}")
    assert summary_res.status_code == 200, summary_res.text
    data = summary_res.json()["data"]
    assert data["elements_count"] > 0


@pytest.mark.asyncio
async def test_boq_summary_accountant_can_view(accountant_client, seeded):
    """Regression (P0 fix): frontend PAGE_ROLES + export endpoints already allow
    the accountant role, so the GET summary endpoint must too (was 403)."""
    project_id = seeded["project_id"]
    res = await accountant_client.get(f"/api/v1/boq-summary/project/{project_id}")
    assert res.status_code == 200, res.text
    data = res.json()["data"]
    assert "elements_count" in data
    assert "is_partial" in data
    assert "estimated_count" in data
    assert "total_rebar_kg" in data["summary"]


def _fixture_dxf():
    here = Path(__file__).resolve().parent
    for candidate in (
        here / "test_boq2.dxf",
        here.parent / "test_boq2.dxf",
        here.parent.parent / "test_boq2.dxf",
        Path.cwd() / "test_boq2.dxf",
    ):
        if candidate.exists():
            return candidate
    return None


@pytest.mark.asyncio
async def test_unclassified_count_endpoint(admin_client, seeded):
    """The review page needs the queue total, not just the 200-item window."""
    res = await admin_client.get("/api/v1/boq-elements/unclassified/count")
    assert res.status_code == 200, res.text
    assert "total" in res.json()["data"]


@pytest.mark.asyncio
async def test_manual_classify_syncs_drawing_counters(admin_client, seeded):
    """Classifying an element must move the parent drawing's stored counters
    (they were extraction-time only and drifted from live aggregation)."""
    from app.core.database import AsyncSessionLocal
    from app.models.boq_element import BOQElement
    from app.models.drawing import Drawing

    dxf_path = _fixture_dxf()
    if dxf_path is None:
        pytest.skip("test_boq2.dxf fixture not found")
    building_id = seeded["building_id"]
    with open(dxf_path, "rb") as fh:
        files = {"files": ("test_boq2.dxf", fh, "application/dxf")}
        upload_res = await admin_client.post(
            f"/api/v1/drawings/batch?building_id={building_id}", files=files
        )
    assert upload_res.status_code == 200, upload_res.text

    drawings = (
        await admin_client.get(f"/api/v1/drawings?building_id={building_id}")
    ).json()["data"]
    assert drawings
    drawing_id = drawings[-1]["id"]

    # Simulate extraction state with one extra unclassified element.
    async with AsyncSessionLocal() as db:
        el = BOQElement(
            drawing_id=drawing_id,
            element_type="other",
            classification_status="unclassified",
            source_layer_name="TEST_SYNC",
            quantity=1.0,
            unit="م2",
            dimensions_json={},
        )
        db.add(el)
        d = await db.get(Drawing, drawing_id)
        d.elements_count += 1
        d.unclassified_count += 1
        await db.commit()
        el_id = el.id
        before_un = d.unclassified_count
        before_cl = d.classified_count

    cls = await admin_client.patch(
        f"/api/v1/boq-elements/{el_id}/classify",
        json={"element_type": "wall", "classification_status": "manually_classified"},
    )
    assert cls.status_code == 200, cls.text

    after = (
        await admin_client.get(f"/api/v1/drawings/{drawing_id}")
    ).json()["data"]
    assert after["unclassified_count"] == before_un - 1
    assert after["classified_count"] == before_cl + 1
