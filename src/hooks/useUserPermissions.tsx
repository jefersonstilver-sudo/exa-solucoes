
import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { getUserPermissions, hasPermission, UserPermissions } from '@/types/userTypes';
import type { UserRole } from '@/types/userTypes';

/**
 * Hook para gerenciar permissões granulares do usuário
 */
export const useUserPermissions = () => {
  const { userProfile } = useAuth();

  // Memoizar permissões para evitar recálculo desnecessário
  const permissions = useMemo(() => {
    return getUserPermissions(userProfile?.role);
  }, [userProfile?.role]);

  // Helper function para verificar permissão específica
  const checkPermission = useMemo(() => {
    return (permission: keyof UserPermissions): boolean => {
      return hasPermission(userProfile?.role, permission);
    };
  }, [userProfile?.role]);

  // Helper para verificar múltiplas permissões
  const hasAnyPermission = useMemo(() => {
    return (permissionList: (keyof UserPermissions)[]): boolean => {
      return permissionList.some(permission => checkPermission(permission));
    };
  }, [checkPermission]);

  // Helper para verificar todas as permissões
  const hasAllPermissions = useMemo(() => {
    return (permissionList: (keyof UserPermissions)[]): boolean => {
      return permissionList.every(permission => checkPermission(permission));
    };
  }, [checkPermission]);

  // Informações do usuário
  const userInfo = useMemo(() => {
    return {
      role: userProfile?.role,
      email: userProfile?.email,
      isAdmin: userProfile?.role === 'admin',
      isMarketingAdmin: userProfile?.role === 'admin_marketing',
      isSuperAdmin: userProfile?.role === 'super_admin',
      isClient: userProfile?.role === 'client'
    };
  }, [userProfile]);

  return {
    permissions,
    checkPermission,
    hasAnyPermission,
    hasAllPermissions,
    userInfo,
    // Shortcuts para permissões mais comuns
    canManageUsers: checkPermission('canManageUsers'),
    canManageBuildings: checkPermission('canManageBuildings'),
    canManagePanels: checkPermission('canManagePanels'),
    canViewLeads: checkPermission('canViewLeads'),
    canManageHomepageConfig: checkPermission('canManageHomepageConfig'),
    canViewOrders: checkPermission('canViewOrders')
  };
};
