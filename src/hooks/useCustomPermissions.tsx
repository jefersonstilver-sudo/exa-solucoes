import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserCustomPermissions } from '@/types/userTypes';
import { UserPermissions } from '@/types/userTypes';
import { toast } from 'sonner';

// Helper para converter snake_case do banco para camelCase do TypeScript
const convertToTypeScript = (dbData: UserCustomPermissions | null): Partial<UserPermissions> | null => {
  if (!dbData) return null;
  
  return {
    canViewDashboard: dbData.can_view_dashboard,
    canViewOrders: dbData.can_view_orders,
    canViewCRM: dbData.can_view_crm,
    canViewApprovals: dbData.can_view_approvals,
    canViewLeads: dbData.can_view_leads,
    canManageUsers: dbData.can_manage_users,
    canManageCoupons: dbData.can_manage_coupons,
    canViewAudit: dbData.can_view_audit,
    canManageVideos: dbData.can_manage_videos,
    canManagePortfolio: dbData.can_manage_portfolio,
    canManageProviderBenefits: dbData.can_manage_provider_benefits,
    canViewFinancialReports: dbData.can_view_financial_reports,
  };
};

// Helper para converter camelCase do TypeScript para snake_case do banco
const convertToDatabase = (tsData: Partial<UserPermissions>): Partial<UserCustomPermissions> => {
  return {
    can_view_dashboard: tsData.canViewDashboard,
    can_view_orders: tsData.canViewOrders,
    can_view_crm: tsData.canViewCRM,
    can_view_approvals: tsData.canViewApprovals,
    can_view_leads: tsData.canViewLeads,
    can_manage_users: tsData.canManageUsers,
    can_manage_coupons: tsData.canManageCoupons,
    can_view_audit: tsData.canViewAudit,
    can_manage_videos: tsData.canManageVideos,
    can_manage_portfolio: tsData.canManagePortfolio,
    can_manage_provider_benefits: tsData.canManageProviderBenefits,
    can_view_financial_reports: tsData.canViewFinancialReports,
  };
};

export const useCustomPermissions = (userId?: string) => {
  const [customPermissions, setCustomPermissions] = useState<Partial<UserPermissions> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar permissões customizadas do usuário
  const loadCustomPermissions = async (targetUserId: string): Promise<Partial<UserPermissions> | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_custom_permissions')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (fetchError) {
        console.error('Erro ao carregar permissões customizadas:', fetchError);
        setError(fetchError.message);
        return null;
      }

      const converted = convertToTypeScript(data);
      setCustomPermissions(converted);
      return converted;
    } catch (err: any) {
      console.error('Erro ao carregar permissões:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar permissões customizadas
  const saveCustomPermissions = async (
    targetUserId: string,
    permissions: Partial<UserPermissions>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const dbPermissions = convertToDatabase(permissions);
      
      // Upsert no banco
      const { error: upsertError } = await supabase
        .from('user_custom_permissions')
        .upsert({
          user_id: targetUserId,
          ...dbPermissions,
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        console.error('Erro ao salvar permissões:', upsertError);
        return { success: false, error: upsertError.message };
      }

      // Log da mudança
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        await supabase
          .from('permission_change_logs')
          .insert({
            user_id: targetUserId,
            changed_by: currentUser.id,
            old_permissions: customPermissions ? JSON.parse(JSON.stringify(customPermissions)) : {},
            new_permissions: JSON.parse(JSON.stringify(permissions)),
            change_reason: 'Atualização de permissões customizadas',
          });
      }

      await loadCustomPermissions(targetUserId);
      toast.success('Permissões atualizadas com sucesso');
      return { success: true };
    } catch (err: any) {
      console.error('Erro ao salvar permissões:', err);
      toast.error('Erro ao salvar permissões');
      return { success: false, error: err.message };
    }
  };

  // Remover permissões customizadas (voltar ao padrão do role)
  const resetPermissions = async (targetUserId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: deleteError } = await supabase
        .from('user_custom_permissions')
        .delete()
        .eq('user_id', targetUserId);

      if (deleteError) {
        console.error('Erro ao resetar permissões:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // Log da mudança
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        await supabase
          .from('permission_change_logs')
          .insert({
            user_id: targetUserId,
            changed_by: currentUser.id,
            old_permissions: customPermissions ? JSON.parse(JSON.stringify(customPermissions)) : {},
            new_permissions: {},
            change_reason: 'Reset para permissões padrão do role',
          });
      }

      setCustomPermissions(null);
      toast.success('Permissões resetadas para o padrão do role');
      return { success: true };
    } catch (err: any) {
      console.error('Erro ao resetar permissões:', err);
      toast.error('Erro ao resetar permissões');
      return { success: false, error: err.message };
    }
  };

  // Carregar ao montar se userId foi fornecido
  useEffect(() => {
    if (userId) {
      loadCustomPermissions(userId);
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    customPermissions,
    isLoading,
    error,
    loadCustomPermissions,
    saveCustomPermissions,
    resetPermissions,
  };
};
