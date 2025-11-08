import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { getUserPermissions, UserPermissions } from '@/types/userTypes';
import type { UserRole } from '@/types/userTypes';

/**
 * Hook simplificado para gerenciar permissões do usuário
 * Baseado apenas no role do usuário (sem custom permissions)
 */
export const useUserPermissions = () => {
  const { userProfile } = useAuth();

  // Obter permissões padrão baseadas no role
  const permissions: UserPermissions = useMemo(() => {
    const role = userProfile?.role as UserRole;
    return getUserPermissions(role);
  }, [userProfile?.role]);

  // Helper function para verificar permissão individual
  const checkPermission = (permission: keyof UserPermissions): boolean => {
    return permissions[permission] || false;
  };

  // Helper function para verificar se tem alguma das permissões
  const hasAnyPermission = (permissionList: (keyof UserPermissions)[]): boolean => {
    return permissionList.some(permission => checkPermission(permission));
  };

  // Helper function para verificar se tem todas as permissões
  const hasAllPermissions = (permissionList: (keyof UserPermissions)[]): boolean => {
    return permissionList.every(permission => checkPermission(permission));
  };

  // Informações do usuário
  const userInfo = useMemo(() => ({
    role: userProfile?.role as UserRole,
    email: userProfile?.email || '',
    isSuperAdmin: userProfile?.role === 'super_admin',
    isAdmin: userProfile?.role === 'admin',
    isAdminMarketing: userProfile?.role === 'admin_marketing',
    isAdminFinanceiro: userProfile?.role === 'admin_financeiro',
    isMarketingAdmin: userProfile?.role === 'admin_marketing', // Alias
    isFinancialAdmin: userProfile?.role === 'admin_financeiro', // Alias
  }), [userProfile]);

  return {
    permissions,
    checkPermission,
    hasAnyPermission,
    hasAllPermissions,
    userInfo,
    isLoadingCustom: false, // Não carrega mais custom permissions
    
    // Atalhos para permissões comuns
    canViewDashboard: permissions.canViewDashboard,
    canManageUsers: permissions.canManageUsers,
    canViewOrders: permissions.canViewOrders,
    canManageCoupons: permissions.canManageCoupons,
    canViewFinancialReports: permissions.canViewFinancialReports,
    canManageSystemSettings: permissions.canManageSystemSettings,
    canManageHomepageConfig: permissions.canManageHomepageConfig,
    canManageProviderBenefits: permissions.canManageProviderBenefits,
  };
};
