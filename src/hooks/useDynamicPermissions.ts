import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMemo } from 'react';
import { USER_PERMISSIONS, UserPermissions, UserRole } from '@/types/userTypes';

interface RolePermission {
  id: string;
  role_key: string;
  permission_key: string;
  permission_label: string;
  permission_group: string;
  is_enabled: boolean;
}

interface RoleType {
  id: string;
  key: string;
  display_name: string;
  is_system: boolean;
  is_active: boolean;
}

/**
 * Hook para permissões dinâmicas baseadas no banco de dados
 * Consulta role_types e role_permissions para obter permissões em tempo real
 */
export const useDynamicPermissions = () => {
  const { userProfile, isLoading: authLoading } = useAuth();
  const userRole = userProfile?.role as string;

  // Buscar tipo de role do banco
  const { data: roleType, isLoading: loadingRoleType } = useQuery({
    queryKey: ['role-type', userRole],
    queryFn: async () => {
      if (!userRole) return null;
      
      const { data, error } = await supabase
        .from('role_types')
        .select('*')
        .eq('key', userRole)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        console.error('[useDynamicPermissions] Erro ao buscar role type:', error);
        return null;
      }
      
      return data as RoleType | null;
    },
    enabled: !!userRole,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });

  // Buscar permissões do banco para o role
  const { data: dbPermissions = [], isLoading: loadingPermissions } = useQuery({
    queryKey: ['role-permissions', userRole],
    queryFn: async () => {
      if (!userRole) return [];
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_key', userRole);
      
      if (error) {
        console.error('[useDynamicPermissions] Erro ao buscar permissões:', error);
        return [];
      }
      
      return data as RolePermission[];
    },
    enabled: !!userRole,
    staleTime: 5 * 60 * 1000,
  });

  // Verificar se é conta administrativa (não pode fazer pedidos)
  const isAdminAccount = useMemo(() => {
    const adminRoles = ['super_admin', 'admin', 'admin_marketing', 'admin_financeiro', 'painel', 'comercial'];
    return adminRoles.includes(userRole || '');
  }, [userRole]);

  // Verificar permissão can_make_orders do banco
  const canMakeOrders = useMemo(() => {
    // Cliente sempre pode
    if (userRole === 'client') return true;
    
    // Verificar no banco
    const orderPermission = dbPermissions.find(p => p.permission_key === 'can_make_orders');
    if (orderPermission) {
      return orderPermission.is_enabled;
    }
    
    // Fallback: admins não podem
    return !isAdminAccount;
  }, [userRole, dbPermissions, isAdminAccount]);

  // Mesclar permissões do banco com fallback hardcoded
  const permissions: UserPermissions & { canMakeOrders: boolean } = useMemo(() => {
    // Começar com permissões hardcoded como fallback
    const hardcodedPerms = USER_PERMISSIONS[userRole as UserRole] || USER_PERMISSIONS.client;
    
    // Se não tem permissões do banco, usar hardcoded
    if (dbPermissions.length === 0) {
      return {
        ...hardcodedPerms,
        canMakeOrders: !isAdminAccount
      };
    }
    
    // Criar objeto de permissões do banco
    const dbPermsMap: Record<string, boolean> = {};
    dbPermissions.forEach(p => {
      dbPermsMap[p.permission_key] = p.is_enabled;
    });
    
    // Mesclar: banco sobrescreve hardcoded quando existe
    return {
      canViewDashboard: dbPermsMap['can_view_dashboard'] ?? hardcodedPerms.canViewDashboard,
      canViewOrders: dbPermsMap['can_view_orders'] ?? hardcodedPerms.canViewOrders,
      canViewCRM: dbPermsMap['can_view_crm'] ?? hardcodedPerms.canViewCRM,
      canViewApprovals: dbPermsMap['can_view_approvals'] ?? hardcodedPerms.canViewApprovals,
      canManageBuildings: dbPermsMap['can_manage_buildings'] ?? hardcodedPerms.canManageBuildings,
      canDeleteBuildings: dbPermsMap['can_delete_buildings'] ?? hardcodedPerms.canDeleteBuildings,
      canManagePanels: dbPermsMap['can_manage_panels'] ?? hardcodedPerms.canManagePanels,
      canViewLeads: dbPermsMap['can_view_leads'] ?? hardcodedPerms.canViewLeads,
      canViewSindicosInteressados: dbPermsMap['can_view_sindicos_interessados'] ?? hardcodedPerms.canViewSindicosInteressados,
      canViewLeadsProdutora: dbPermsMap['can_view_leads_produtora'] ?? hardcodedPerms.canViewLeadsProdutora,
      canViewLeadsCampanhas: dbPermsMap['can_view_leads_campanhas'] ?? hardcodedPerms.canViewLeadsCampanhas,
      canViewLeadsLinkae: dbPermsMap['can_view_leads_linkae'] ?? hardcodedPerms.canViewLeadsLinkae,
      canViewLeadsExa: dbPermsMap['can_view_leads_exa'] ?? hardcodedPerms.canViewLeadsExa,
      canManageUsers: dbPermsMap['can_manage_users'] ?? hardcodedPerms.canManageUsers,
      canManageCoupons: dbPermsMap['can_manage_coupons'] ?? hardcodedPerms.canManageCoupons,
      canManageHomepageConfig: dbPermsMap['can_manage_homepage_config'] ?? hardcodedPerms.canManageHomepageConfig,
      canManageSystemSettings: dbPermsMap['can_manage_system_settings'] ?? hardcodedPerms.canManageSystemSettings,
      canViewAudit: dbPermsMap['can_view_audit'] ?? hardcodedPerms.canViewAudit,
      canViewSecurity: dbPermsMap['can_view_security'] ?? hardcodedPerms.canViewSecurity,
      canManageVideos: dbPermsMap['can_manage_videos'] ?? hardcodedPerms.canManageVideos,
      canManagePortfolio: dbPermsMap['can_manage_portfolio'] ?? hardcodedPerms.canManagePortfolio,
      canManageNotifications: dbPermsMap['can_manage_notifications'] ?? hardcodedPerms.canManageNotifications,
      canManageEmails: dbPermsMap['can_manage_emails'] ?? hardcodedPerms.canManageEmails,
      canManageProviderBenefits: dbPermsMap['can_manage_provider_benefits'] ?? hardcodedPerms.canManageProviderBenefits,
      canViewFinancialReports: dbPermsMap['can_view_financial_reports'] ?? hardcodedPerms.canViewFinancialReports,
      canMakeOrders: !isAdminAccount, // Sempre false para admins
    };
  }, [userRole, dbPermissions, isAdminAccount]);

  // Helper para verificar permissão
  const checkPermission = (permissionKey: string): boolean => {
    const permsRecord = permissions as unknown as Record<string, boolean>;
    return permsRecord[permissionKey] ?? false;
  };

  return {
    permissions,
    checkPermission,
    isAdminAccount,
    canMakeOrders,
    roleType,
    isLoading: authLoading || loadingRoleType || loadingPermissions,
    userRole,
    userInfo: {
      role: userRole,
      email: userProfile?.email || '',
      isSuperAdmin: userRole === 'super_admin',
      isAdmin: userRole === 'admin',
      isAdminMarketing: userRole === 'admin_marketing',
      isAdminFinanceiro: userRole === 'admin_financeiro',
      isClient: userRole === 'client',
    }
  };
};
