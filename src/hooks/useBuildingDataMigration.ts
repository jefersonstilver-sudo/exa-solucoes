
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useBuildingDataMigration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const migratePedidosWithMissingListaPredios = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 [MIGRATION] Iniciando migração de lista_predios...');

      // Buscar pedidos que têm lista_paineis mas não têm lista_predios
      const { data: pedidosToMigrate, error: fetchError } = await supabase
        .from('pedidos')
        .select('id, lista_paineis, lista_predios')
        .not('lista_paineis', 'is', null)
        .neq('lista_paineis', '[]')
        .or('lista_predios.is.null,lista_predios.eq.[]');

      if (fetchError) {
        console.error('❌ [MIGRATION] Erro ao buscar pedidos:', fetchError);
        throw fetchError;
      }

      console.log(`📊 [MIGRATION] Encontrados ${pedidosToMigrate?.length || 0} pedidos para migrar`);
      
      if (!pedidosToMigrate || pedidosToMigrate.length === 0) {
        toast.success('Nenhum pedido necessita migração');
        return { success: true, migrated: 0 };
      }

      setProgress({ current: 0, total: pedidosToMigrate.length });
      let migratedCount = 0;

      for (const pedido of pedidosToMigrate) {
        try {
          console.log(`🔄 [MIGRATION] Processando pedido ${pedido.id}...`);
          
          // Buscar building_ids dos painéis
          const { data: painels, error: painelsError } = await supabase
            .from('painels')
            .select('building_id')
            .in('id', pedido.lista_paineis || []);

          if (painelsError) {
            console.error(`❌ [MIGRATION] Erro ao buscar painéis para pedido ${pedido.id}:`, painelsError);
            continue;
          }

          // Extrair building_ids únicos
          const buildingIds = [...new Set(
            (painels || [])
              .map(p => p.building_id)
              .filter(Boolean)
          )];

          console.log(`🏢 [MIGRATION] Pedido ${pedido.id}: ${buildingIds.length} prédios encontrados`);

          if (buildingIds.length > 0) {
            // Atualizar o pedido com a lista_predios
            const { error: updateError } = await supabase
              .from('pedidos')
              .update({ lista_predios: buildingIds })
              .eq('id', pedido.id);

            if (updateError) {
              console.error(`❌ [MIGRATION] Erro ao atualizar pedido ${pedido.id}:`, updateError);
              continue;
            }

            migratedCount++;
            console.log(`✅ [MIGRATION] Pedido ${pedido.id} migrado com sucesso`);
          }

          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
          
          // Pequena pausa para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`💥 [MIGRATION] Erro ao processar pedido ${pedido.id}:`, error);
          continue;
        }
      }

      console.log(`✅ [MIGRATION] Migração concluída: ${migratedCount}/${pedidosToMigrate.length} pedidos migrados`);
      
      toast.success(`Migração concluída: ${migratedCount} pedidos atualizados`);
      
      return { success: true, migrated: migratedCount, total: pedidosToMigrate.length };

    } catch (error: any) {
      console.error('💥 [MIGRATION] Erro geral na migração:', error);
      toast.error('Erro durante a migração');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const fixSpecificOrder = async (orderId: string) => {
    try {
      console.log(`🔧 [MIGRATION] Corrigindo pedido específico: ${orderId}`);
      
      // Buscar dados do pedido
      const { data: pedido, error: fetchError } = await supabase
        .from('pedidos')
        .select('id, lista_paineis, lista_predios, log_pagamento')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error('❌ [MIGRATION] Erro ao buscar pedido:', fetchError);
        throw fetchError;
      }

      if (!pedido) {
        throw new Error('Pedido não encontrado');
      }

      console.log('📊 [MIGRATION] Dados do pedido:', pedido);

      // Se tem lista_paineis, extrair building_ids
      if (pedido.lista_paineis && pedido.lista_paineis.length > 0) {
        const { data: painels, error: painelsError } = await supabase
          .from('painels')
          .select('building_id')
          .in('id', pedido.lista_paineis);

        if (painelsError) {
          console.error('❌ [MIGRATION] Erro ao buscar painéis:', painelsError);
          throw painelsError;
        }

        const buildingIds = [...new Set(
          (painels || [])
            .map(p => p.building_id)
            .filter(Boolean)
        )];

        console.log(`🏢 [MIGRATION] Building IDs extraídos: ${buildingIds}`);

        if (buildingIds.length > 0) {
          const { error: updateError } = await supabase
            .from('pedidos')
            .update({ lista_predios: buildingIds })
            .eq('id', orderId);

          if (updateError) {
            console.error('❌ [MIGRATION] Erro ao atualizar:', updateError);
            throw updateError;
          }

          console.log('✅ [MIGRATION] Pedido corrigido com sucesso');
          toast.success('Pedido corrigido com sucesso');
          return { success: true };
        }
      }

      // Se não tem lista_paineis, tentar recuperar do log_pagamento
      if (pedido.log_pagamento && typeof pedido.log_pagamento === 'object') {
        const logData = pedido.log_pagamento as any;
        if (logData.cart_items_debug && Array.isArray(logData.cart_items_debug)) {
          const panelIds = logData.cart_items_debug
            .map((item: any) => item.panel_id)
            .filter(Boolean);

          if (panelIds.length > 0) {
            console.log('🔄 [MIGRATION] Tentando recuperar do log_pagamento:', panelIds);
            
            const { error: updateError } = await supabase
              .from('pedidos')
              .update({ lista_paineis: panelIds })
              .eq('id', orderId);

            if (updateError) {
              console.error('❌ [MIGRATION] Erro ao atualizar lista_paineis:', updateError);
              throw updateError;
            }

            // Agora extrair building_ids
            const { data: painels, error: painelsError } = await supabase
              .from('painels')
              .select('building_id')
              .in('id', panelIds);

            if (!painelsError && painels) {
              const buildingIds = [...new Set(
                painels.map(p => p.building_id).filter(Boolean)
              )];

              if (buildingIds.length > 0) {
                const { error: updateBuildingsError } = await supabase
                  .from('pedidos')
                  .update({ lista_predios: buildingIds })
                  .eq('id', orderId);

                if (!updateBuildingsError) {
                  console.log('✅ [MIGRATION] Dados recuperados e migrados');
                  toast.success('Dados recuperados e migrados com sucesso');
                  return { success: true };
                }
              }
            }
          }
        }
      }

      toast.warning('Não foi possível extrair dados de localização');
      return { success: false, error: 'Dados insuficientes' };

    } catch (error: any) {
      console.error('💥 [MIGRATION] Erro ao corrigir pedido:', error);
      toast.error('Erro ao corrigir pedido');
      return { success: false, error: error.message };
    }
  };

  return {
    migratePedidosWithMissingListaPredios,
    fixSpecificOrder,
    isLoading,
    progress
  };
};
