"""Completion reports: lifecycle, snapshot clone-previous, RBAC, and mandatory edge cases
(0% / 100% progress, missing resources, wrong roles) per skills/testing-conventions.md.

The autouse setup_db fixture resets the test DB before every test, so each test is
fully isolated (no cleanup needed).
"""
import copy

import pytest


def report_payload(project_id, period, structure, finishing, status="draft", **extra):
    payload = {
        "project_id": project_id,
        "report_period": period,
        "period_type": "monthly",
        "status": status,
        "report_data": {
            "structureItems": [{"name": n, "progress": p} for n, p in structure],
            "finishingItems": [{"name": n, "progress": p} for n, p in finishing],
        },
    }
    payload.update(extra)
    return payload


async def create_report(admin_client, **kw):
    r = await admin_client.post("/api/v1/completion-reports", json=kw)
    assert r.status_code == 200, f"create failed: {r.text}"
    return r.json()["data"]


async def kpis_overall(admin_client):
    r = await admin_client.get("/api/v1/reports/kpis")
    assert r.status_code == 200
    return r.json()["data"]["completion"]


async def new_project(admin_client, name):
    r = await admin_client.post("/api/v1/projects", json={"name": name, "status": "in_progress"})
    assert r.status_code == 200, r.text
    return r.json()["data"]["id"]


# ---------- Lifecycle ----------

@pytest.mark.asyncio
async def test_create_draft_report(admin_client):
    pid = await new_project(admin_client, "مشروع إنشاء التقرير")
    d = await create_report(admin_client, **report_payload(pid, "سبتمبر 2026", [("القواعد", 40)], [("التشطيبات", 10)]))
    assert d["status"] == "draft"
    assert d["project_id"] == pid
    assert d["report_data"]["structureItems"][0]["progress"] == 40


@pytest.mark.asyncio
async def test_create_report_for_missing_project_404(admin_client):
    r = await admin_client.post(
        "/api/v1/completion-reports",
        json=report_payload(999999, "فترة اختبار", [("القواعد", 0)], []),
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_get_report_by_id(admin_client):
    pid = await new_project(admin_client, "مشروع جلب تقرير")
    d = await create_report(admin_client, **report_payload(pid, "سبتمبر 2026", [("القواعد", 50)], []))
    r = await admin_client.get(f"/api/v1/completion-reports/{d['id']}")
    assert r.status_code == 200
    assert r.json()["data"]["id"] == d["id"]


@pytest.mark.asyncio
async def test_get_missing_report_404(admin_client):
    r = await admin_client.get("/api/v1/completion-reports/999999")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_list_reports_for_project(admin_client):
    pid = await new_project(admin_client, "مشروع قائمة التقارير")
    for i, period in enumerate(["أغسطس 2026", "سبتمبر 2026"]):
        await create_report(admin_client, **report_payload(pid, period, [("القواعد", 10 * (i + 1))], []))
    r = await admin_client.get(f"/api/v1/completion-reports?project_id={pid}")
    assert r.status_code == 200
    periods = [x["report_period"] for x in r.json()["data"]]
    assert set(periods) == {"أغسطس 2026", "سبتمبر 2026"}


@pytest.mark.asyncio
async def test_update_report_status_and_data(admin_client):
    pid = await new_project(admin_client, "مشروع تحديث التقرير")
    d = await create_report(admin_client, **report_payload(pid, "سبتمبر 2026", [("القواعد", 40)], []))
    r = await admin_client.put(
        f"/api/v1/completion-reports/{d['id']}",
        json={"status": "approved", "report_data": {"structureItems": [{"name": "القواعد", "progress": 100}], "finishingItems": []}},
    )
    assert r.status_code == 200
    body = r.json()["data"]
    assert body["status"] == "approved"
    assert body["report_data"]["structureItems"][0]["progress"] == 100


@pytest.mark.asyncio
async def test_update_missing_report_404(admin_client):
    r = await admin_client.put("/api/v1/completion-reports/999999", json={"status": "approved"})
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_delete_report_then_gone(admin_client):
    pid = await new_project(admin_client, "مشروع حذف التقرير")
    d = await create_report(admin_client, **report_payload(pid, "سبتمبر 2026", [("القواعد", 10)], []))
    r = await admin_client.delete(f"/api/v1/completion-reports/{d['id']}")
    assert r.status_code == 200
    r = await admin_client.get(f"/api/v1/completion-reports/{d['id']}")
    assert r.status_code == 404


# ---------- Clone-previous (snapshot inheritance) ----------

@pytest.mark.asyncio
async def test_clone_previous_copies_data_and_sets_parent(admin_client):
    pid = await new_project(admin_client, "مشروع الاستنساخ")
    base = await create_report(
        admin_client,
        **report_payload(pid, "أغسطس 2026", [("القواعد", 40), ("العموديات", 80)], [("التشطيبات", 50)]),
    )
    r = await admin_client.post(
        f"/api/v1/completion-reports/projects/{pid}/clone-previous",
        json={"report_period": "سبتمبر 2026 (شهر 9)"},
    )
    assert r.status_code == 200
    cloned = r.json()["data"]
    assert cloned["parent_report_id"] == base["id"]
    assert cloned["status"] == "draft"
    assert cloned["report_data"] == base["report_data"]
    assert cloned["report_period"] == "سبتمبر 2026 (شهر 9)"


@pytest.mark.asyncio
async def test_clone_previous_no_previous_400(admin_client):
    pid = await new_project(admin_client, "مشروع بدون تقارير")
    r = await admin_client.post(
        f"/api/v1/completion-reports/projects/{pid}/clone-previous",
        json={"report_period": "سبتمبر 2026"},
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_clone_previous_missing_project_404(admin_client):
    r = await admin_client.post(
        "/api/v1/completion-reports/projects/999999/clone-previous",
        json={"report_period": "سبتمبر 2026"},
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_clone_update_does_not_affect_parent(admin_client):
    """Snapshot isolation: mutating the clone must never touch the archived parent."""
    pid = await new_project(admin_client, "مشروع عزل اللقطات")
    base = await create_report(
        admin_client,
        **report_payload(pid, "أغسطس 2026", [("القواعد", 40), ("العموديات", 80)], []),
    )
    cloned = (await admin_client.post(
        f"/api/v1/completion-reports/projects/{pid}/clone-previous",
        json={"report_period": "سبتمبر 2026"},
    )).json()["data"]

    new_data = copy.deepcopy(cloned["report_data"])
    new_data["structureItems"][0]["progress"] = 100
    r = await admin_client.put(
        f"/api/v1/completion-reports/{cloned['id']}",
        json={"report_data": new_data},
    )
    assert r.status_code == 200

    parent = (await admin_client.get(f"/api/v1/completion-reports/{base['id']}")).json()["data"]
    assert parent["report_data"]["structureItems"][0]["progress"] == 40


# ---------- Edge cases: 0% / 100% ----------

@pytest.mark.asyncio
async def test_report_zero_progress_kpis_overall_zero(admin_client):
    pid = await new_project(admin_client, "مشروع نسبة صفرية")
    await create_report(admin_client, **report_payload(pid, "سبتمبر 2026", [("القواعد", 0), ("العموديات", 0)], [("التشطيبات", 0)]))
    entry = next(x for x in (await kpis_overall(admin_client))["latest_by_project"] if x["project_id"] == pid)
    assert entry["overall"] == 0.0


@pytest.mark.asyncio
async def test_report_full_progress_kpis_overall_hundred(admin_client):
    pid = await new_project(admin_client, "مشروع نسبة كاملة")
    await create_report(admin_client, **report_payload(pid, "سبتمبر 2026", [("القواعد", 100)], [("التشطيبات", 100)]))
    entry = next(x for x in (await kpis_overall(admin_client))["latest_by_project"] if x["project_id"] == pid)
    assert entry["overall"] == 100.0


@pytest.mark.asyncio
async def test_report_overall_formula_mixed(admin_client):
    """overall = structure_avg × 0.5 + finishing_avg × 0.5 → (60 × 0.5) + (40 × 0.5) = 50.0"""
    pid = await new_project(admin_client, "مشروع المعادلة")
    await create_report(admin_client, **report_payload(pid, "سبتمبر 2026", [("القواعد", 40), ("العموديات", 80)], [("التشطيبات", 50), ("الواجهات", 30)]))
    entry = next(x for x in (await kpis_overall(admin_client))["latest_by_project"] if x["project_id"] == pid)
    assert entry["overall"] == 50.0


@pytest.mark.asyncio
async def test_report_single_side_formula_halves(admin_client):
    """Only structure side present (finishing empty) → overall = structure_avg × 0.5."""
    pid = await new_project(admin_client, "مشروع جهة واحدة")
    await create_report(admin_client, **report_payload(pid, "سبتمبر 2026", [("القواعد", 100)], []))
    entry = next(x for x in (await kpis_overall(admin_client))["latest_by_project"] if x["project_id"] == pid)
    assert entry["overall"] == 50.0


# ---------- RBAC ----------

@pytest.mark.asyncio
async def test_create_report_as_engineer_ok(admin_client, engineer_client):
    pid = await new_project(admin_client, "مشروع صلاحية المهندس")
    r = await engineer_client.post(
        "/api/v1/completion-reports",
        json=report_payload(pid, "سبتمبر 2026", [("القواعد", 10)], []),
    )
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_create_report_as_accountant_forbidden(accountant_client):
    r = await accountant_client.post(
        "/api/v1/completion-reports",
        json=report_payload(999999, "سبتمبر 2026", [("القواعد", 10)], []),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_create_report_as_contractor_forbidden(contractor_client):
    r = await contractor_client.post(
        "/api/v1/completion-reports",
        json=report_payload(999999, "سبتمبر 2026", [("القواعد", 10)], []),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_delete_report_as_pm_forbidden(admin_client, project_manager_client):
    pid = await new_project(admin_client, "مشروع حذف مقيد")
    d = await create_report(admin_client, **report_payload(pid, "سبتمبر 2026", [("القواعد", 10)], []))
    r = await project_manager_client.delete(f"/api/v1/completion-reports/{d['id']}")
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_list_reports_as_accountant_ok(admin_client, accountant_client):
    pid = await new_project(admin_client, "مشروع قراءة المحاسب")
    await create_report(admin_client, **report_payload(pid, "سبتمبر 2026", [("القواعد", 10)], []))
    r = await accountant_client.get(f"/api/v1/completion-reports?project_id={pid}")
    assert r.status_code == 200
