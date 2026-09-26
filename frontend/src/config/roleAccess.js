export const ROLE_LANDING = {
  admin: '/dashboard',
  project_manager: '/dashboard',
  engineer: '/dashboard',
  accountant: '/payments',
  contractor: '/contracts',
};

export const PAGE_ROLES = {
  'cost-calculator': ['engineer', 'accountant', 'admin'],
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
  '/quick-estimator': ['admin', 'project_manager', 'engineer', 'accountant'],
  '/boq-analytics': ['admin', 'project_manager', 'engineer'],
  '/drawings/batch': ['admin', 'project_manager', 'engineer'],
  '/drawings/:drawingId': ['admin', 'project_manager', 'engineer'],
  '/users': ['admin'],
  '/profile': ['admin', 'project_manager', 'engineer', 'accountant', 'contractor'],
  '/ai-center': ['admin', 'project_manager', 'engineer'],
  '/cost-monitor': ['admin', 'project_manager', 'engineer', 'accountant'],
  '/materials': ['admin', 'project_manager', 'engineer', 'accountant'],
  '/assistant': ['admin', 'project_manager', 'engineer', 'accountant'],
  '/progress': ['admin', 'project_manager', 'engineer', 'accountant'],
};

export function canAccessPage(role, path) {
  if (!role) return false;
  const allowed = PAGE_ROLES[path];
  if (!allowed) return true;
  return allowed.includes(role);
}
