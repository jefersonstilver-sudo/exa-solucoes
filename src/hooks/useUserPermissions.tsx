
import { useMemo, useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getUserPermissions, hasPermission, UserPermissions } from '@/types/userTypes';
import type { UserRole } from '@/types/userTypes';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gerenciar permissões granulares do usuário
 * Agora suporta permissões customizadas que sobrescrevem as padrões do role
 */
export const useUserPermissions = () => {
  const { userProfile } = useAuth();
  const [customPermissions, setCustomPermissions] = useState<Partial<UserPermissions> | null>(null);
  const [isLoadingCustom, setIsLoadingCustom] = useState(true);

  // Carregar permissões customizadas do banco
  useEffect(() => {
    const loadCustomPermissions = async () => {
      if (!userProfile?.id) {
        setIsLoadingCustom(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_custom_permissions')
          .select('custom_permissions')
          .eq('user_id', userProfile.id)
          .maybeSingle();

        if (error) {
          console.error('Erro ao carregar permissões customizadas:', error);
        }

        setCustomPermissions(data?.custom_permissions as Partial<UserPermissions> || null);
      } catch (err) {
        console.error('Erro ao carregar permissões customizadas:', err);
      } finally {
        setIsLoadingCustom(false);
      }
    };

    loadCustomPermissions();
  }, [userProfile?.id]);

  // Memoizar permissões combinadas (padrão do role + customizadas)
  const permissions = useMemo(() => {
    const rolePermissions = getUserPermissions(userProfile?.role);
    
    // Se não houver permissões customizadas, retornar apenas as do role
    if (!customPermissions) {
      return rolePermissions;
    }

    // Combinar permissões: customizadas sobrescrevem as do role
    return {
      ...rolePermissions,
      ...customPermissions,
    } as UserPermissions;
  }, [userProfile?.role, customPermissions]);

  // Helper function para verificar permissão específica
  const checkPermission = useMemo(() => {
    return (permission: keyof UserPermissions): boolean => {
      return permissions[permission];
    };
  }, [permissions]);

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
      isFinancialAdmin: userProfile?.role === 'admin_financeiro',
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
    isLoadingCustom,
    hasCustomPermissions: customPermissions !== null,
    // Shortcuts para permissões mais comuns
    canManageUsers: checkPermission('canManageUsers'),
    canManageBuildings: checkPermission('canManageBuildings'),
    canManagePanels: checkPermission('canManagePanels'),
    canViewLeads: checkPermission('canViewLeads'),
    canManageHomepageConfig: checkPermission('canManageHomepageConfig'),
    canViewOrders: checkPermission('canViewOrders'),
    canViewCRM: checkPermission('canViewCRM'),
    canManageProviderBenefits: checkPermission('canManageProviderBenefits'),
    canViewFinancialReports: checkPermission('canViewFinancialReports')
  };
};
