import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BulkDeleteResult {
  success: boolean;
  deleted_count: number;
  total_requested: number;
  error?: string;
}

interface BulkDeleteResponse {
  success: boolean;
  deleted_count: number;
  total_requested: number;
  error?: string;
}

export const bulkDeletePedidos = async (
  pedidoIds: string[],
  justificativa: string
): Promise<BulkDeleteResult> => {
  try {
    // Obter informações do navegador para auditoria
    const userAgent = navigator.userAgent;
    const ipAddress = 'client-side'; // IP será obtido no backend se necessário

    const { data, error } = await supabase.rpc('bulk_delete_pedidos_secure', {
      p_pedido_ids: pedidoIds,
      p_justificativa: justificativa,
      p_ip_address: ipAddress,
      p_user_agent: userAgent
    });

    if (error) {
      console.error('Erro na exclusão em massa:', error);
      toast.error('Erro ao excluir pedidos: ' + error.message);
      return {
        success: false,
        deleted_count: 0,
        total_requested: pedidoIds.length,
        error: error.message
      };
    }

    const result = data as unknown as BulkDeleteResponse;

    if (!result.success) {
      toast.error('Erro: ' + result.error);
      return {
        success: false,
        deleted_count: 0,
        total_requested: pedidoIds.length,
        error: result.error
      };
    }

    // Sucesso
    toast.success(
      `${result.deleted_count} pedido${result.deleted_count !== 1 ? 's' : ''} excluído${result.deleted_count !== 1 ? 's' : ''} com sucesso`
    );

    return {
      success: true,
      deleted_count: result.deleted_count,
      total_requested: result.total_requested
    };

  } catch (error) {
    console.error('Erro inesperado na exclusão em massa:', error);
    toast.error('Erro inesperado ao excluir pedidos');
    return {
      success: false,
      deleted_count: 0,
      total_requested: pedidoIds.length,
      error: 'Erro inesperado'
    };
  }
};