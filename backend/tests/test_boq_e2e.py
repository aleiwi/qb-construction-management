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
