import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fetchVideosToDelete, deleteVideosFromExternalAPI } from './videoExternalDeletionService';

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
  const getTimestamp = () => new Date().toISOString();
  const logSeparator = '═'.repeat(80);
  
  try {
    // Obter informações do navegador para auditoria
    const userAgent = navigator.userAgent;
    const ipAddress = 'client-side';

    console.log(`\n${logSeparator}`);
    console.log(`🚀 [${getTimestamp()}] INICIANDO SUPER ADMIN DELETE COM AWS CLEANUP`);
    console.log(logSeparator);
    console.log(`📊 Total de pedidos: ${pedidoIds.length}`);
    console.log(`📋 Justificativa: "${justificativa}"`);
    console.log(`🎯 IDs dos pedidos:`, pedidoIds);
    console.log(`🌐 User Agent: ${userAgent.substring(0, 50)}...`);
    console.log(`📍 IP Address: ${ipAddress}`);
    console.log(logSeparator);

    // ✅ FASE 1: Buscar todos os vídeos
    console.log(`\n📹 [${getTimestamp()}] FASE 1: Buscando vídeos para deletar da AWS`);
    const videosToDelete = await fetchVideosToDelete(pedidoIds);
    console.log(`   Encontrados ${videosToDelete.length} vídeo(s) para deletar`);

    if (videosToDelete.length > 0) {
      // ✅ FASE 2: Deletar da AWS ANTES do banco
      console.log(`\n🗑️ [${getTimestamp()}] FASE 2: Deletando vídeos da AWS...`);
      const awsResult = await deleteVideosFromExternalAPI(videosToDelete);
      
      console.log(`   AWS Resultado:`);
      console.log(`   ✅ Deletados: ${awsResult.deleted_count}`);
      console.log(`   ❌ Falhas: ${awsResult.failed_count}`);
      
      if (awsResult.failed_count > 0) {
        console.warn(`   ⚠️ Erros na AWS:`, awsResult.errors);
        toast.warning(
          `⚠️ ${awsResult.failed_count} vídeo(s) falharam na AWS. Verifique os logs.`
        );
      }

      if (awsResult.deleted_count > 0) {
        toast.success(
          `✅ ${awsResult.deleted_count} vídeo(s) deletado(s) da AWS`
        );
      }
    } else {
      console.log(`   ℹ️ Nenhum vídeo para deletar da AWS`);
    }

    // FASE 2.5: Cancelamento de boletos (migrado para ASAAS)
    // FASE 2.5: Cancelamento de boletos (migrado para ASAAS) — não bloqueia a deleção

    // ✅ FASE 3: Deletar do banco
    console.log(`\n🗑️ [${getTimestamp()}] FASE 3: Deletando do banco Supabase...`);

    console.log(`\n📞 [${getTimestamp()}] CHAMANDO RPC: super_admin_bulk_delete_pedidos`);
    console.log(`   Parameters:`, {
      p_pedido_ids: pedidoIds,
      p_justification: justificativa,
      p_ip_address: ipAddress,
      p_user_agent: userAgent
    });
    
    const rpcStartTime = Date.now();
    const { data, error } = await supabase.rpc('super_admin_bulk_delete_pedidos', {
      p_pedido_ids: pedidoIds,
      p_justification: justificativa,
      p_ip_address: ipAddress,
      p_user_agent: userAgent
    });
    const rpcDuration = Date.now() - rpcStartTime;

    console.log(`\n⏱️  [${getTimestamp()}] RPC COMPLETADA em ${rpcDuration}ms`);
    console.log(`📦 Resposta completa:`, JSON.stringify({ data, error }, null, 2));

    if (error) {
      console.log(`\n${logSeparator}`);
      console.error(`❌ [${getTimestamp()}] ERRO NA RPC`);
      console.log(logSeparator);
      console.error(`   Mensagem: ${error.message}`);
      console.error(`   Detalhes: ${error.details}`);
      console.error(`   Hint: ${error.hint}`);
      console.error(`   Código: ${error.code}`);
      console.error(`   Stack:`, error);
      console.log(logSeparator);
      
      toast.error('Erro ao excluir pedidos: ' + error.message);
      return {
        success: false,
        deleted_count: 0,
        total_requested: pedidoIds.length,
        error: error.message
      };
    }

    const result = data as any;
    
    console.log(`\n${logSeparator}`);
    console.log(`🔍 [${getTimestamp()}] ANALISANDO RESULTADO DA RPC`);
    console.log(logSeparator);
    console.log(`   Sucesso: ${result?.success}`);
    console.log(`   Deletados: ${result?.deleted_count}`);
    console.log(`   Total requisitado: ${result?.total_requested}`);
    console.log(`   Erros:`, result?.errors);
    console.log(logSeparator);

    if (!result || !result.success) {
      const errorMsg = result?.error || 'Erro desconhecido';
      console.log(`\n${logSeparator}`);
      console.error(`❌ [${getTimestamp()}] FALHA LÓGICA NO PROCESSO`);
      console.log(logSeparator);
      console.error(`   Success flag: ${result?.success}`);
      console.error(`   Error message: ${errorMsg}`);
      console.error(`   Deleted count: ${result?.deleted_count}`);
      console.error(`   Errors array:`, result?.errors);
      console.log(logSeparator);
      
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
    console.log(`\n${logSeparator}`);
    console.log(`✅ [${getTimestamp()}] DELEÇÃO CONCLUÍDA COM SUCESSO`);
    console.log(logSeparator);
    console.log(`   📊 Pedidos deletados: ${deletedCount}`);
    console.log(`   📋 Total requisitado: ${result.total_requested}`);
    console.log(`   ⚠️  Erros encontrados: ${result.errors?.length || 0}`);
    if (result.errors && result.errors.length > 0) {
      console.log(`   ❌ Lista de erros:`, result.errors);
    }
    console.log(logSeparator);
    
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
    const timestamp = getTimestamp();
    const logSeparator = '═'.repeat(80);
    
    console.log(`\n${logSeparator}`);
    console.error(`💥 [${timestamp}] ERRO FATAL NO CLIENTE`);
    console.log(logSeparator);
    console.error(`   Tipo: ${error instanceof Error ? error.constructor.name : typeof error}`);
    console.error(`   Mensagem: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`   Stack trace:`);
    console.error((error as Error).stack);
    console.log(logSeparator);
    
    toast.error('Erro inesperado ao excluir pedidos: ' + (error as Error).message);
    return {
      success: false,
      deleted_count: 0,
      total_requested: pedidoIds.length,
      error: 'Erro inesperado: ' + (error as Error).message
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
