
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

/**
 * Deleção completa de pedidos (super admin apenas)
 * Remove pedidos completamente, incluindo todos os vídeos
 * Salva histórico completo antes de deletar
 */
export const superAdminBulkDeletePedidos = async (
  pedidoIds: string[],
  justificativa: string
): Promise<BulkDeleteResult> => {
  try {
    // Obter informações do navegador para auditoria
    const userAgent = navigator.userAgent;
    const ipAddress = 'client-side';

    console.log('🗑️ [SUPER_ADMIN_DELETE] Iniciando deleção completa de', pedidoIds.length, 'pedidos');

    const { data, error } = await supabase.rpc('super_admin_bulk_delete_pedidos', {
      p_pedido_ids: pedidoIds,
      p_justification: justificativa,
      p_ip_address: ipAddress,
      p_user_agent: userAgent
    });

    if (error) {
      console.error('❌ [SUPER_ADMIN_DELETE] Erro na exclusão:', error);
      toast.error('Erro ao excluir pedidos: ' + error.message);
      return {
        success: false,
        deleted_count: 0,
        total_requested: pedidoIds.length,
        error: error.message
      };
    }

    const result = data as any;

    if (!result.success) {
      const errorMsg = result.error || 'Erro desconhecido';
      toast.error('Erro: ' + errorMsg);
      return {
        success: false,
        deleted_count: result.deleted_count || 0,
        total_requested: result.total_requested || pedidoIds.length,
        error: errorMsg
      };
    }

    // Sucesso
    const deletedCount = result.deleted_count || 0;
    console.log('✅ [SUPER_ADMIN_DELETE] Sucesso:', deletedCount, 'pedidos deletados');
    
    toast.success(
      `${deletedCount} pedido${deletedCount !== 1 ? 's' : ''} deletado${deletedCount !== 1 ? 's' : ''} completamente com sucesso`,
      {
        description: 'Histórico salvo para auditoria'
      }
    );

    return {
      success: true,
      deleted_count: deletedCount,
      total_requested: result.total_requested || pedidoIds.length
    };

  } catch (error) {
    console.error('💥 [SUPER_ADMIN_DELETE] Erro inesperado:', error);
    toast.error('Erro inesperado ao excluir pedidos');
    return {
      success: false,
      deleted_count: 0,
      total_requested: pedidoIds.length,
      error: 'Erro inesperado'
    };
  }
};

// Função para exclusão em massa de tentativas
export const bulkDeleteTentativas = async (
  tentativaIds: string[],
  justificativa: string
): Promise<BulkDeleteResult> => {
  try {
    let deleted_count = 0;
    const errors: string[] = [];

    // Deletar tentativas uma por uma
    for (const id of tentativaIds) {
      const { error } = await supabase
        .from('tentativas_compra')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Erro ao deletar tentativa ${id}:`, error);
        errors.push(`Tentativa ${id.substring(0, 8)}: ${error.message}`);
      } else {
        deleted_count++;
      }
    }

    // Log da ação para auditoria
    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'BULK_DELETE_TENTATIVAS',
        descricao: `Admin deletou ${deleted_count}/${tentativaIds.length} tentativas. Justificativa: ${justificativa}`
      });

    if (errors.length > 0) {
      toast.error(`${deleted_count} tentativas excluídas. ${errors.length} erros encontrados.`);
      return {
        success: deleted_count > 0,
        deleted_count,
        total_requested: tentativaIds.length,
        error: errors.join('; ')
      };
    }

    toast.success(
      `${deleted_count} tentativa${deleted_count !== 1 ? 's' : ''} excluída${deleted_count !== 1 ? 's' : ''} com sucesso`
    );

    return {
      success: true,
      deleted_count,
      total_requested: tentativaIds.length
    };

  } catch (error) {
    console.error('Erro inesperado na exclusão de tentativas:', error);
    toast.error('Erro inesperado ao excluir tentativas');
    return {
      success: false,
      deleted_count: 0,
      total_requested: tentativaIds.length,
      error: 'Erro inesperado'
    };
  }
};
