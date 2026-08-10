"""System-wide RBAC sweep: every read endpoint must enforce the router's role matrix.

For each endpoint: no token -> 401, an allowed role -> 200, a denied role -> 403.
The matrix mirrors the `require_roles([...])` lists in each router file.
"""
import pytest
import pytest_asyncio


@pytest_asyncio.fixture
async def role_clients(admin_client, project_manager_client, engineer_client, accountant_client, contractor_client):
    return {
        "admin": admin_client,
        "pm": project_manager_client,
        "engineer": engineer_client,
        "accountant": accountant_client,
        "contractor": contractor_client,
    }


MATRIX = [
    pytest.param("projects list", "/api/v1/projects", "admin", "accountant", id="projects-list"),
    pytest.param("project detail", "/api/v1/projects/{project_id}", "pm", "accountant", id="project-detail"),
    pytest.param("buildings list", "/api/v1/buildings", "engineer", "accountant", id="buildings-list"),
    pytest.param("building detail", "/api/v1/buildings/{building_id}", "admin", "accountant", id="building-detail"),
    pytest.param("stages list", "/api/v1/stages?building_id={building_id}", "admin", "accountant", id="stages-list"),
    pytest.param("stage detail", "/api/v1/stages/{stage_id}", "engineer", "accountant", id="stage-detail"),
    pytest.param("contractors list", "/api/v1/contractors", "admin", "engineer", id="contractors-list"),
    pytest.param("contractor detail", "/api/v1/contractors/{contractor_id}", "accountant", "engineer", id="contractor-detail"),
    pytest.param("contracts list", "/api/v1/contracts", "accountant", "engineer", id="contracts-list"),
    pytest.param("contract detail", "/api/v1/contracts/{contract_id}", "admin", "engineer", id="contract-detail"),
    pytest.param("drawings list", "/api/v1/drawings", "engineer", "accountant", id="drawings-list"),
    pytest.param("boq elements list", "/api/v1/boq-elements?drawing_id=999", "admin", "accountant", id="boq-elements-list"),
    pytest.param("boq unclassified", "/api/v1/boq-elements/unclassified", "admin", "accountant", id="boq-unclassified"),
    pytest.param("boq stats", "/api/v1/boq-elements/stats", "engineer", "accountant", id="boq-stats"),
    pytest.param("price library", "/api/v1/price-library", "accountant", "engineer", id="price-library"),
    pytest.param("payments list", "/api/v1/payments", "pm", "engineer", id="payments-list"),
    pytest.param("retentions list", "/api/v1/retention-releases", "accountant", "engineer", id="retentions-list"),
    pytest.param("quality checks list", "/api/v1/quality-checks", "engineer", "accountant", id="quality-checks-list"),
    pytest.param("hr employees", "/api/v1/hr/employees", "pm", "engineer", id="hr-employees"),
    pytest.param("hr employee stats", "/api/v1/hr/employees/stats", "accountant", "engineer", id="hr-employee-stats"),
    pytest.param("hr attendance", "/api/v1/hr/attendance", "admin", "engineer", id="hr-attendance"),
    pytest.param("reports kpis", "/api/v1/reports/kpis", "accountant", "engineer", id="reports-kpis"),
    pytest.param("completion reports list", "/api/v1/completion-reports?project_id={project_id}", "accountant", "contractor", id="completion-reports-list"),
    pytest.param("boq summary project", "/api/v1/boq-summary/project/{project_id}", "engineer", "contractor", id="boq-summary-project"),
    pytest.param("boq items list", "/api/v1/boq-items?boq_element_id=999", "accountant", "engineer", id="boq-items-list"),
    pytest.param("audit logs", "/api/v1/audit-logs", "admin", "pm", id="audit-logs"),
    pytest.param("users list", "/api/v1/users", "pm", "engineer", id="users-list"),
]


@pytest.mark.parametrize("label,path_tpl,allowed_role,denied_role", MATRIX)
@pytest.mark.asyncio
async def test_rbac_matrix(client, role_clients, seeded, label, path_tpl, allowed_role, denied_role):
    path = path_tpl.format(**seeded)

    r = await client.get(path)
    assert r.status_code == 401, f"{label}: expected 401 without token, got {r.status_code}"

    r = await role_clients[allowed_role].get(path)
    assert r.status_code == 200, f"{label}: expected 200 for '{allowed_role}', got {r.status_code}: {r.text[:300]}"

    r = await role_clients[denied_role].get(path)
    assert r.status_code == 403, f"{label}: expected 403 for '{denied_role}', got {r.status_code}: {r.text[:300]}"
