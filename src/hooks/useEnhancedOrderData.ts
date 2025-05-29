
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedOrderData {
  originalOrder: any;
  recoveredPanels: string[];
  originalTentativa: any;
  isRecovered: boolean;
}

export const useEnhancedOrderData = (orderId: string, clientId: string) => {
  const [enhancedData, setEnhancedData] = useState<EnhancedOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnhancedData = async () => {
      if (!orderId || !clientId) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 [ENHANCED_ORDER] Buscando dados completos para:', { orderId, clientId });
        
        // Buscar pedido original
        const { data: orderData, error: orderError } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', orderId)
          .eq('client_id', clientId)
          .single();

        if (orderError) throw orderError;

        console.log('📊 [ENHANCED_ORDER] Pedido encontrado:', orderData);
        console.log('📍 [ENHANCED_ORDER] Lista painéis no pedido:', orderData.lista_paineis);

        let recoveredPanels = orderData.lista_paineis || [];
        let originalTentativa = null;
        let isRecovered = false;

        // Se lista_paineis estiver vazia, tentar recuperar da tentativa_compra
        if (!recoveredPanels || recoveredPanels.length === 0) {
          console.log('⚠️ [ENHANCED_ORDER] Lista vazia, tentando recuperar de tentativas_compra...');
          
          // Buscar tentativa original baseada no valor e usuário
          const { data: tentativaData, error: tentativaError } = await supabase
            .from('tentativas_compra')
            .select('*')
            .eq('id_user', clientId)
            .eq('valor_total', orderData.valor_total)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!tentativaError && tentativaData && tentativaData.length > 0) {
            originalTentativa = tentativaData[0];
            console.log('✅ [ENHANCED_ORDER] Tentativa encontrada:', originalTentativa);
            
            if (originalTentativa.predios_selecionados && originalTentativa.predios_selecionados.length > 0) {
              // Converter números para strings (IDs dos painéis)
              recoveredPanels = originalTentativa.predios_selecionados.map(String);
              isRecovered = true;
              console.log('🔄 [ENHANCED_ORDER] Painéis recuperados:', recoveredPanels);
            }
          } else {
            console.log('❌ [ENHANCED_ORDER] Nenhuma tentativa encontrada para recuperação');
          }
        }

        setEnhancedData({
          originalOrder: orderData,
          recoveredPanels,
          originalTentativa,
          isRecovered
        });

      } catch (error) {
        console.error('💥 [ENHANCED_ORDER] Erro ao buscar dados:', error);
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchEnhancedData();
  }, [orderId, clientId]);

  return { enhancedData, loading, error };
};
