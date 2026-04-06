import { supabase } from '@/integrations/supabase/client';

interface SyncResult {
  totalOrders: number;
  synced: number;
  failed: number;
  details: Array<{
    pedidoId: string;
    status: 'success' | 'error';
    error?: string;
  }>;
}

/**
 * Sincroniza um prédio específico com a API externa (AWS)
 * Busca todos os pedidos ativos que incluem esse prédio e dispara sync para cada um
 */
export const syncBuildingWithExternalAPI = async (buildingId: string): Promise<SyncResult> => {
  console.log('🔄 [BUILDING-SYNC] Iniciando sync para prédio:', buildingId);

  // Buscar todos os pedidos ativos que incluem este prédio
  const { data: orders, error: fetchError } = await supabase
    .from('pedidos')
    .select('id, lista_predios, status')
    .in('status', ['ativo', 'video_aprovado'])
    .contains('lista_predios', [buildingId]);

  if (fetchError) {
    console.error('❌ [BUILDING-SYNC] Erro ao buscar pedidos:', fetchError);
    throw new Error(`Erro ao buscar pedidos: ${fetchError.message}`);
  }

  if (!orders || orders.length === 0) {
    console.log('⚠️ [BUILDING-SYNC] Nenhum pedido ativo encontrado para este prédio');
    return { totalOrders: 0, synced: 0, failed: 0, details: [] };
  }

  console.log(`📋 [BUILDING-SYNC] ${orders.length} pedido(s) encontrado(s)`);

  const result: SyncResult = {
    totalOrders: orders.length,
    synced: 0,
    failed: 0,
    details: []
  };

  for (const order of orders) {
    try {
      console.log(`🔄 [BUILDING-SYNC] Sincronizando pedido ${order.id}...`);

      const { data, error } = await supabase.functions.invoke('sync-buildings-external-api', {
        body: {
          pedido_id: order.id,
          action: 'add',
          building_ids: [buildingId]
        }
      });

      if (error) throw new Error(error.message);

      // Log na tabela api_sync_logs
      await supabase.from('api_sync_logs').insert({
        pedido_id: order.id,
        building_id: buildingId,
        action: 'add',
        status: 'success',
        source: 'manual',
        aws_response: data || null
      }).then(({ error: logError }) => {
        if (logError) console.warn('⚠️ [BUILDING-SYNC] Erro ao salvar log:', logError);
      });

      result.synced++;
      result.details.push({ pedidoId: order.id, status: 'success' });
    } catch (err: any) {
      console.error(`❌ [BUILDING-SYNC] Erro no pedido ${order.id}:`, err);

      await supabase.from('api_sync_logs').insert({
        pedido_id: order.id,
        building_id: buildingId,
        action: 'add',
        status: 'error',
        source: 'manual',
        error_message: err.message
      }).then(({ error: logError }) => {
        if (logError) console.warn('⚠️ [BUILDING-SYNC] Erro ao salvar log:', logError);
      });

      result.failed++;
      result.details.push({ pedidoId: order.id, status: 'error', error: err.message });
    }
  }

  console.log('✅ [BUILDING-SYNC] Resultado:', result);
  return result;
};
