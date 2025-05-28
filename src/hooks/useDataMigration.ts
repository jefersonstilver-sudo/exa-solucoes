
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDataMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);

  const migrateMissingOrders = async () => {
    try {
      setIsMigrating(true);
      console.log('🔄 Iniciando migração de pedidos perdidos...');

      // Executar função de migração no banco
      const { data, error } = await supabase.rpc('migrate_missing_orders');

      if (error) {
        console.error('❌ Erro na migração:', error);
        throw error;
      }

      console.log('✅ Migração concluída:', data);
      toast.success(`Migração concluída! ${data?.migrated_count || 0} pedidos migrados.`);
      
      return data;
    } catch (error: any) {
      console.error('💥 Erro crítico na migração:', error);
      toast.error('Erro ao migrar pedidos perdidos');
      throw error;
    } finally {
      setIsMigrating(false);
    }
  };

  const cleanupOrphanedData = async () => {
    try {
      setIsMigrating(true);
      console.log('🧹 Limpando dados órfãos...');

      // Limpar tentativas de compra que já foram migradas
      const { data, error } = await supabase.rpc('auto_cleanup_paid_attempts');

      if (error) {
        console.error('❌ Erro na limpeza:', error);
        throw error;
      }

      console.log('✅ Limpeza concluída:', data);
      toast.success(`Limpeza concluída! ${data?.cleaned_count || 0} registros removidos.`);
      
      return data;
    } catch (error: any) {
      console.error('💥 Erro na limpeza:', error);
      toast.error('Erro ao limpar dados órfãos');
      throw error;
    } finally {
      setIsMigrating(false);
    }
  };

  const syncVideoStatus = async () => {
    try {
      setIsMigrating(true);
      console.log('🔄 Sincronizando status de vídeos...');

      // Buscar vídeos pendentes e atualizar status dos pedidos
      const { data: pendingVideos, error: pendingError } = await supabase
        .from('pedido_videos')
        .select('pedido_id, approval_status')
        .eq('approval_status', 'pending');

      if (pendingError) throw pendingError;

      // Atualizar pedidos para status 'video_enviado' se têm vídeos pendentes
      for (const video of pendingVideos || []) {
        await supabase
          .from('pedidos')
          .update({ status: 'video_enviado' })
          .eq('id', video.pedido_id)
          .eq('status', 'pago_pendente_video');
      }

      // Buscar vídeos aprovados e atualizar status dos pedidos
      const { data: approvedVideos, error: approvedError } = await supabase
        .from('pedido_videos')
        .select('pedido_id, approval_status')
        .eq('approval_status', 'approved');

      if (approvedError) throw approvedError;

      // Atualizar pedidos para status 'video_aprovado'
      for (const video of approvedVideos || []) {
        await supabase
          .from('pedidos')
          .update({ status: 'video_aprovado' })
          .eq('id', video.pedido_id)
          .in('status', ['video_enviado', 'pago_pendente_video']);
      }

      console.log('✅ Sincronização de status concluída');
      toast.success('Status de vídeos sincronizados com sucesso!');
      
    } catch (error: any) {
      console.error('💥 Erro na sincronização:', error);
      toast.error('Erro ao sincronizar status de vídeos');
      throw error;
    } finally {
      setIsMigrating(false);
    }
  };

  return {
    isMigrating,
    migrateMissingOrders,
    cleanupOrphanedData,
    syncVideoStatus
  };
};
