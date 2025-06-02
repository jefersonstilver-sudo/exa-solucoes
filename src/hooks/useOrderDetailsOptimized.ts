
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OptimizedOrderData {
  orderDetails: any | null;
  videoSlots: any[];
  panelData: any[];
  contractStatus: {
    isActive: boolean;
    isExpired: boolean;
    isNearExpiration: boolean;
    daysRemaining: number;
    expiryDate: string | null;
  };
  enhancedData: any | null;
}

export const useOrderDetailsOptimized = (orderId: string, userId: string) => {
  const [data, setData] = useState<OptimizedOrderData>({
    orderDetails: null,
    videoSlots: [],
    panelData: [],
    contractStatus: {
      isActive: false,
      isExpired: false,
      isNearExpiration: false,
      daysRemaining: 0,
      expiryDate: null
    },
    enhancedData: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    if (!orderId || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 [OPTIMIZED] Carregando dados do pedido:', orderId);

      // 1. Buscar dados básicos do pedido
      const { data: orderData, error: orderError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', orderId)
        .eq('client_id', userId)
        .single();

      if (orderError) throw orderError;

      // 2. Calcular status do contrato
      const contractStatus = calculateContractStatus(orderData);

      // 3. Buscar vídeos do pedido em paralelo
      const videosPromise = supabase
        .from('pedido_videos')
        .select(`
          id,
          slot_position,
          approval_status,
          is_active,
          selected_for_display,
          created_at,
          approved_at,
          rejection_reason,
          videos (
            id,
            nome,
            url,
            duracao,
            orientacao
          )
        `)
        .eq('pedido_id', orderId);

      // 4. Buscar dados dos painéis em paralelo
      const panelsPromise = orderData.lista_paineis?.length > 0 
        ? supabase
            .from('painels')
            .select(`
              id,
              code,
              buildings (
                nome,
                endereco,
                bairro
              )
            `)
            .in('id', orderData.lista_paineis)
        : Promise.resolve({ data: [], error: null });

      // 5. Recuperar dados órfãos se necessário
      const recoveryPromise = (!orderData.lista_paineis || orderData.lista_paineis.length === 0)
        ? supabase
            .from('tentativas_compra')
            .select('*')
            .eq('id_user', userId)
            .eq('valor_total', orderData.valor_total)
            .order('created_at', { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [], error: null });

      // Executar todas as consultas em paralelo
      const [videosResult, panelsResult, recoveryResult] = await Promise.all([
        videosPromise,
        panelsPromise,
        recoveryPromise
      ]);

      if (videosResult.error) throw videosResult.error;
      if (panelsResult.error) throw panelsResult.error;

      // Processar dados de recuperação
      let recoveredPanels = orderData.lista_paineis || [];
      let isRecovered = false;

      if (recoveryResult.data && recoveryResult.data.length > 0 && recoveredPanels.length === 0) {
        const tentativa = recoveryResult.data[0];
        if (tentativa.predios_selecionados && tentativa.predios_selecionados.length > 0) {
          recoveredPanels = tentativa.predios_selecionados.map(String);
          isRecovered = true;
          console.log('🔄 [OPTIMIZED] Painéis recuperados:', recoveredPanels.length);
        }
      }

      // Formatar dados dos vídeos
      const formattedVideos = videosResult.data?.map(v => ({
        id: v.id,
        slot_position: v.slot_position,
        approval_status: v.approval_status,
        is_active: v.is_active,
        selected_for_display: v.selected_for_display,
        created_at: v.created_at,
        approved_at: v.approved_at,
        rejection_reason: v.rejection_reason,
        video_data: v.videos
      })) || [];

      // Formatar dados dos painéis
      const formattedPanels = panelsResult.data?.map(p => ({
        id: p.id,
        code: p.code,
        building_name: p.buildings?.nome || 'N/A',
        building_address: p.buildings?.endereco || 'N/A',
        building_neighborhood: p.buildings?.bairro || 'N/A'
      })) || [];

      // Atualizar estado com todos os dados
      setData({
        orderDetails: orderData,
        videoSlots: formattedVideos,
        panelData: formattedPanels,
        contractStatus,
        enhancedData: {
          recoveredPanels,
          isRecovered,
          originalTentativa: recoveryResult.data?.[0] || null
        }
      });

      console.log('✅ [OPTIMIZED] Dados carregados com sucesso');

    } catch (error) {
      console.error('❌ [OPTIMIZED] Erro ao carregar dados:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error('Erro ao carregar detalhes do pedido');
    } finally {
      setLoading(false);
    }
  }, [orderId, userId]);

  const calculateContractStatus = (orderData: any) => {
    if (!orderData.data_fim) {
      return {
        isActive: true,
        isExpired: false,
        isNearExpiration: false,
        daysRemaining: 30,
        expiryDate: null
      };
    }

    const endDate = new Date(orderData.data_fim);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      isActive: daysRemaining > 0,
      isExpired: daysRemaining <= 0,
      isNearExpiration: daysRemaining <= 7 && daysRemaining > 0,
      daysRemaining: Math.max(0, daysRemaining),
      expiryDate: orderData.data_fim
    };
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    ...data,
    loading,
    error,
    refetch: fetchAllData
  };
};
