import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../hooks/usePermissions';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../hooks/useAuth';

function mockUser(role) {
  useAuth.mockReturnValue({ user: role ? { role } : null });
}

describe('usePermissions', () => {
  it('returns no permissions when user is null', () => {
    mockUser(null);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.role).toBeNull();
    expect(result.current.canManageUsers).toBe(false);
    expect(result.current.canManageProjects).toBe(false);
    expect(result.current.canApproveQualityChecks).toBe(false);
    expect(result.current.canProcessPayments).toBe(false);
  });

  it('admin has all permissions', () => {
    mockUser('admin');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.canManageUsers).toBe(true);
    expect(result.current.canManageProjects).toBe(true);
    expect(result.current.canApproveQualityChecks).toBe(true);
    expect(result.current.canProcessPayments).toBe(true);
    expect(result.current.canViewOwnContractOnly).toBe(false);
  });

  it('project_manager can manage projects but not users', () => {
    mockUser('project_manager');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isProjectManager).toBe(true);
    expect(result.current.canManageUsers).toBe(false);
    expect(result.current.canManageProjects).toBe(true);
    expect(result.current.canViewOwnContractOnly).toBe(false);
  });

  it('engineer can approve QC but not process payments', () => {
    mockUser('engineer');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isEngineer).toBe(true);
    expect(result.current.canApproveQualityChecks).toBe(true);
    expect(result.current.canProcessPayments).toBe(false);
    expect(result.current.canManageUsers).toBe(false);
  });

  it('accountant can process payments but not manage users', () => {
    mockUser('accountant');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isAccountant).toBe(true);
    expect(result.current.canProcessPayments).toBe(true);
    expect(result.current.canManageUsers).toBe(false);
    expect(result.current.canManageProjects).toBe(false);
  });

  it('contractor has view-only permissions', () => {
    mockUser('contractor');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isContractor).toBe(true);
    expect(result.current.canViewOwnContractOnly).toBe(true);
    expect(result.current.canManageUsers).toBe(false);
    expect(result.current.canManageProjects).toBe(false);
    expect(result.current.canProcessPayments).toBe(false);
    expect(result.current.canApproveQualityChecks).toBe(false);
  });

  it('hasRole checks single role', () => {
    mockUser('admin');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasRole('admin')).toBe(true);
    expect(result.current.hasRole('engineer')).toBe(false);
  });

  it('hasRole checks array of roles', () => {
    mockUser('engineer');
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasRole(['admin', 'engineer'])).toBe(true);
    expect(result.current.hasRole(['admin', 'accountant'])).toBe(false);
  });

  it('hasRole returns false when user is null', () => {
    mockUser(null);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasRole('admin')).toBe(false);
  });
});
