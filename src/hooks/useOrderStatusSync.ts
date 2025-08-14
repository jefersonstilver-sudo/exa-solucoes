import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useOrderStatusSync = (userId?: string) => {
  const [syncing, setSyncing] = useState(false);

  const syncOrderStatuses = async () => {
    if (!userId) return;
    
    try {
      setSyncing(true);
      console.log('🔄 Iniciando sincronização de status dos pedidos...');

      // Buscar pedidos "pago" que podem precisar de atualização
      const { data: orders, error: ordersError } = await supabase
        .from('pedidos')
        .select('id, status, client_id')
        .eq('client_id', userId)
        .eq('status', 'pago');

      if (ordersError) {
        console.error('Erro ao buscar pedidos para sincronização:', ordersError);
        return;
      }

      if (!orders || orders.length === 0) {
        console.log('✅ Nenhum pedido "pago" encontrado para sincronização');
        return;
      }

      console.log(`🔍 Verificando ${orders.length} pedidos com status "pago"`);

      let updatedCount = 0;

      // Verificar cada pedido se tem vídeos aprovados
      for (const order of orders) {
        const { data: approvedVideos, error: videosError } = await supabase
          .from('pedido_videos')
          .select('id, approval_status')
          .eq('pedido_id', order.id)
          .eq('approval_status', 'approved');

        if (videosError) {
          console.warn(`Erro ao verificar vídeos do pedido ${order.id}:`, videosError);
          continue;
        }

        // Se tem vídeos aprovados, atualizar status
        if (approvedVideos && approvedVideos.length > 0) {
          const { error: updateError } = await supabase
            .from('pedidos')
            .update({ status: 'video_aprovado' })
            .eq('id', order.id);

          if (updateError) {
            console.error(`Erro ao atualizar status do pedido ${order.id}:`, updateError);
          } else {
            console.log(`✅ Status do pedido ${order.id.substring(0, 8)} atualizado para "video_aprovado"`);
            updatedCount++;
          }
        }
      }

      if (updatedCount > 0) {
        console.log(`🎉 ${updatedCount} pedidos tiveram status sincronizado`);
        toast.success(`${updatedCount} pedidos sincronizados com sucesso`);
      } else {
        console.log('✅ Todos os status já estão corretos');
      }

    } catch (error: any) {
      console.error('💥 Erro durante sincronização de status:', error);
      toast.error('Erro ao sincronizar status dos pedidos');
    } finally {
      setSyncing(false);
    }
  };

  // Executar sincronização automaticamente quando o hook é usado
  useEffect(() => {
    if (userId) {
      // Pequeno delay para não interferir com carregamento inicial
      const timer = setTimeout(syncOrderStatuses, 2000);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  return {
    syncOrderStatuses,
    syncing
  };
};