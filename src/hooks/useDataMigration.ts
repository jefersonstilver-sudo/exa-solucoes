
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDataMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);

  const migrateMissingOrders = async () => {
    try {
      setIsMigrating(true);
      console.log('🔄 Iniciando migração de pedidos perdidos...');

      // Usar função existente auto_cleanup_paid_attempts
      const { data, error } = await supabase.rpc('auto_cleanup_paid_attempts');

      if (error) {
        console.error('❌ Erro na migração:', error);
        throw error;
      }

      console.log('✅ Migração concluída:', data);
      
      // Tratar o retorno como objeto JSON
      const result = data as any;
      const migratedCount = result?.cleaned_count || 0;
      
      toast.success(`Migração concluída! ${migratedCount} registros processados.`);
      
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

      // Usar função existente auto_cleanup_paid_attempts
      const { data, error } = await supabase.rpc('auto_cleanup_paid_attempts');

      if (error) {
        console.error('❌ Erro na limpeza:', error);
        throw error;
      }

      console.log('✅ Limpeza concluída:', data);
      
      // Tratar o retorno como objeto JSON
      const result = data as any;
      const cleanedCount = result?.cleaned_count || 0;
      
      toast.success(`Limpeza concluída! ${cleanedCount} registros removidos.`);
      
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
      if (pendingVideos && pendingVideos.length > 0) {
        for (const video of pendingVideos) {
          await supabase
            .from('pedidos')
            .update({ status: 'video_enviado' })
            .eq('id', video.pedido_id)
            .eq('status', 'pago_pendente_video');
        }
      }

      // Buscar vídeos aprovados e atualizar status dos pedidos
      const { data: approvedVideos, error: approvedError } = await supabase
        .from('pedido_videos')
        .select('pedido_id, approval_status')
        .eq('approval_status', 'approved');

      if (approvedError) throw approvedError;

      // Atualizar pedidos para status 'video_aprovado'
      if (approvedVideos && approvedVideos.length > 0) {
        for (const video of approvedVideos) {
          await supabase
            .from('pedidos')
            .update({ status: 'video_aprovado' })
            .eq('id', video.pedido_id)
            .in('status', ['video_enviado', 'pago_pendente_video']);
        }
      }

      const totalSynced = (pendingVideos?.length || 0) + (approvedVideos?.length || 0);
      console.log('✅ Sincronização de status concluída');
      toast.success(`Status sincronizados! ${totalSynced} registros atualizados.`);
      
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
