export const ROLE_LANDING = {
  admin: '/dashboard',
  project_manager: '/dashboard',
  engineer: '/dashboard',
  accountant: '/payments',
  contractor: '/contracts',
};

export const PAGE_ROLES = {
  '/dashboard': ['admin', 'project_manager', 'engineer', 'accountant', 'contractor'],
  '/projects': ['admin', 'project_manager', 'engineer'],
  '/projects/:projectId': ['admin', 'project_manager', 'engineer'],
  '/contractors': ['admin', 'project_manager', 'engineer', 'accountant'],
  '/contracts': ['admin', 'project_manager', 'accountant', 'contractor'],
  '/drawings': ['admin', 'project_manager', 'engineer'],
  '/boq-review': ['admin', 'project_manager', 'engineer'],
  '/payments': ['admin', 'project_manager', 'accountant'],
  '/quality-checks': ['admin', 'project_manager', 'engineer'],
  '/employees': ['admin', 'project_manager'],
  '/reports': ['admin', 'project_manager', 'accountant'],
  '/completion-percentage': ['admin', 'project_manager', 'engineer', 'accountant'],
  '/audit-logs': ['admin'],
  '/boq-summary/:projectId': ['admin', 'project_manager', 'engineer', 'accountant'],
  '/price-library': ['admin', 'project_manager', 'accountant'],
  '/boq-analytics': ['admin', 'project_manager', 'engineer'],
  '/drawings/batch': ['admin', 'project_manager', 'engineer'],
  '/drawings/:drawingId': ['admin', 'project_manager', 'engineer'],
};

export function canAccessPage(role, path) {
  if (!role) return false;
  const allowed = PAGE_ROLES[path];
  if (!allowed) return true;
  return allowed.includes(role);
}
