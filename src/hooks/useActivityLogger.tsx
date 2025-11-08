import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook para registrar atividades dos usuários no sistema de auditoria
 */
export const useActivityLogger = () => {
  const { userProfile } = useAuth();

  const logActivity = useCallback(async (
    action: string,
    entity_type: string,
    entity_id?: string,
    details?: Record<string, any>,
    metadata?: Record<string, any>
  ) => {
    if (!userProfile?.id) return;

    try {
      const { error } = await supabase
        .from('user_activity_logs')
        .insert({
          user_id: userProfile.id,
          action_type: action,
          entity_type,
          entity_id,
          action_description: details ? JSON.stringify(details) : null,
          metadata: {
            ...metadata,
            user_role: userProfile.role,
            user_email: userProfile.email,
            timestamp: new Date().toISOString()
          }
        });

      if (error) {
        console.error('❌ Erro ao registrar atividade:', error);
      } else {
        console.log('✅ Atividade registrada:', { action, entity_type, entity_id });
      }
    } catch (error) {
      console.error('❌ Erro ao registrar atividade:', error);
    }
  }, [userProfile]);

  // Helpers específicos para ações comuns
  const logView = useCallback((entity_type: string, entity_id?: string, details?: any) => {
    return logActivity('view', entity_type, entity_id, details);
  }, [logActivity]);

  const logCreate = useCallback((entity_type: string, entity_id?: string, details?: any) => {
    return logActivity('create', entity_type, entity_id, details);
  }, [logActivity]);

  const logUpdate = useCallback((entity_type: string, entity_id: string, details?: any) => {
    return logActivity('update', entity_type, entity_id, details);
  }, [logActivity]);

  const logDelete = useCallback((entity_type: string, entity_id: string, details?: any) => {
    return logActivity('delete', entity_type, entity_id, details);
  }, [logActivity]);

  const logExport = useCallback((entity_type: string, details?: any) => {
    return logActivity('export', entity_type, undefined, details);
  }, [logActivity]);

  return {
    logActivity,
    logView,
    logCreate,
    logUpdate,
    logDelete,
    logExport
  };
};
