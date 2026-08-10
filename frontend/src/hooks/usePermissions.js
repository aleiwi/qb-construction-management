import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { user } = useAuth();
  const role = user?.role || null;

  const isAdmin = role === 'admin';
  const isProjectManager = role === 'project_manager';
  const isEngineer = role === 'engineer';
  const isAccountant = role === 'accountant';
  const isContractor = role === 'contractor';

  const hasRole = (allowedRoles) => {
    if (!role) return false;
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(role);
    }
    return allowedRoles === role;
  };

  const canManageUsers = isAdmin;
  const canManageProjects = isAdmin || isProjectManager;
  const canApproveQualityChecks = isAdmin || isEngineer;
  const canProcessPayments = isAdmin || isAccountant;
  const canViewOwnContractOnly = isContractor;

  return {
    role,
    isAdmin,
    isProjectManager,
    isEngineer,
    isAccountant,
    isContractor,
    hasRole,
    canManageUsers,
    canManageProjects,
    canApproveQualityChecks,
    canProcessPayments,
    canViewOwnContractOnly,
  };
};
