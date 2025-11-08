import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserPermissions } from '@/types/userTypes';
import { toast } from 'sonner';

interface CustomPermissionsData {
  id: string;
  user_id: string;
  custom_permissions: Partial<UserPermissions>;
  notes?: string;
  updated_at: string;
  updated_by?: string;
}

export const useCustomPermissions = (userId?: string) => {
  const [customPermissions, setCustomPermissions] = useState<Partial<UserPermissions> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar permissões customizadas do usuário
  const loadCustomPermissions = async (targetUserId: string) => {
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

      const perms = data?.custom_permissions as Partial<UserPermissions> || null;
      setCustomPermissions(perms);
      return perms;
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
    permissions: Partial<UserPermissions>,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Verificar se já existe um registro
      const { data: existing } = await supabase
        .from('user_custom_permissions')
        .select('id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (existing) {
        // Atualizar existente
        const { error: updateError } = await supabase
          .from('user_custom_permissions')
          .update({
            custom_permissions: permissions,
            notes,
          })
          .eq('user_id', targetUserId);

        if (updateError) {
          console.error('Erro ao atualizar permissões:', updateError);
          return { success: false, error: updateError.message };
        }
      } else {
        // Criar novo
        const { error: insertError } = await supabase
          .from('user_custom_permissions')
          .insert({
            user_id: targetUserId,
            custom_permissions: permissions,
            notes,
          });

        if (insertError) {
          console.error('Erro ao inserir permissões:', insertError);
          return { success: false, error: insertError.message };
        }
      }

      // Log da mudança
      await supabase
        .from('permission_change_logs')
        .insert({
          user_id: targetUserId,
          changed_by: (await supabase.auth.getUser()).data.user?.id,
          old_permissions: customPermissions || {},
          new_permissions: permissions,
          change_reason: notes || 'Atualização de permissões customizadas',
        });

      setCustomPermissions(permissions);
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
      await supabase
        .from('permission_change_logs')
        .insert({
          user_id: targetUserId,
          changed_by: (await supabase.auth.getUser()).data.user?.id,
          old_permissions: customPermissions || {},
          new_permissions: {},
          change_reason: 'Reset para permissões padrão do role',
        });

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
