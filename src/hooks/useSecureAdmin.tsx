import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateAndSanitizeText, validateEmail } from '@/utils/inputValidation';

interface SecureAdminResult {
  success: boolean;
  error?: string;
  data?: any;
}

export const useSecureAdmin = () => {
  const [loading, setLoading] = useState(false);

  const updateUserRole = async (userId: string, newRole: string): Promise<SecureAdminResult> => {
    setLoading(true);
    try {
      // Input validation
      if (!userId || !newRole) {
        throw new Error('Parâmetros obrigatórios não fornecidos');
      }

      // Sanitize inputs
      const userIdResult = validateAndSanitizeText(userId, 50);
      const roleResult = validateAndSanitizeText(newRole, 20);
      
      if (!userIdResult.isValid || !roleResult.isValid) {
        throw new Error('Dados de entrada inválidos');
      }
      
      const sanitizedUserId = userIdResult.sanitized;
      const sanitizedRole = roleResult.sanitized;

      // Validate role
      const validRoles = ['client', 'admin', 'admin_marketing', 'super_admin', 'painel'];
      if (!validRoles.includes(sanitizedRole)) {
        throw new Error('Role inválido fornecido');
      }

      const { data, error } = await supabase
        .rpc('admin_update_user_role_secure', {
          p_user_id: sanitizedUserId,
          p_new_role: sanitizedRole
        });

      if (error) throw error;

      const result = data as { success: boolean; error?: string } | null;
      if (!result?.success) {
        throw new Error(result?.error || 'Falha na atualização do role');
      }

      return { success: true, data: result };
    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido';
      toast.error(`Erro: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const generateSecurePassword = async (): Promise<SecureAdminResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('generate_secure_temp_password');

      if (error) throw error;

      if (!data) {
        throw new Error('Falha ao gerar senha segura');
      }

      return { success: true, data };
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao gerar senha';
      toast.error(`Erro: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const validateSecureInput = (input: string, type: 'email' | 'text' | 'role', maxLength: number = 255): boolean => {
    if (!input || input.trim().length === 0) {
      return false;
    }

    const result = validateAndSanitizeText(input, maxLength);
    if (!result.isValid) {
      toast.error(`Input inválido: ${result.error}`);
      return false;
    }

    if (type === 'email' && !validateEmail(input)) {
      toast.error('Email inválido');
      return false;
    }

    if (type === 'role') {
      const validRoles = ['client', 'admin', 'admin_marketing', 'super_admin', 'painel'];
      if (!validRoles.includes(input)) {
        toast.error('Role inválido');
        return false;
      }
    }

    return true;
  };

  return {
    loading,
    updateUserRole,
    generateSecurePassword,
    validateSecureInput
  };
};