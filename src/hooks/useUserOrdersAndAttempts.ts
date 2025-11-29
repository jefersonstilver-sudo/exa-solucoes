
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserOrderAttempt {
  id: string;
  created_at: string;
  valor_total: number;
  predios_selecionados: string[]; // CORREÇÃO: Manter como string[] conforme Supabase
  credencial?: string;
  predio?: string;
  type: 'attempt';
  status: 'tentativa';
}

export interface UserCompleteOrder {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio?: string;
  data_fim?: string;
  client_id: string;
  nome_pedido?: string;
  metodo_pagamento?: string;
  total_visualizacoes_mes?: number;
  total_publico_estimado?: number;
  total_telas?: number;
  type: 'order';
  videos?: {
    id: string;
    approval_status: string;
    is_active: boolean;
    selected_for_display: boolean;
    video_data?: any;
  }[];
}

export type UserOrderOrAttempt = UserOrderAttempt | UserCompleteOrder;

export const useUserOrdersAndAttempts = (userId?: string) => {
  const [userOrdersAndAttempts, setUserOrdersAndAttempts] = useState<UserOrderOrAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserOrdersAndAttempts = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Buscando pedidos e tentativas do usuário:', userId);

      // Buscar pedidos completos do usuário primeiro (prioridade)
      const { data: orders, error: ordersError } = await supabase
        .from('pedidos')
        .select('*, nome_pedido')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Erro ao buscar pedidos do usuário:', ordersError);
        throw ordersError;
      }

      console.log('✅ Pedidos do usuário encontrados:', orders?.length || 0);

      // Buscar vídeos para cada pedido
      const orderIds = (orders || []).map(order => order.id);
      let videosData: any = {};
      
      if (orderIds.length > 0) {
        try {
          const { data: videos, error: videosError } = await supabase
            .from('pedido_videos')
            .select(`
              id,
              pedido_id,
              approval_status,
              is_active,
              selected_for_display,
              video_id,
              videos(id, nome, url, duracao, orientacao, tem_audio)
            `)
            .in('pedido_id', orderIds);

          if (videosError) {
            console.warn('Erro ao buscar vídeos dos pedidos (não crítico):', videosError);
          } else {
            console.log('✅ Vídeos dos pedidos encontrados:', videos?.length || 0);
            
            // Organizar vídeos por pedido_id
            videosData = (videos || []).reduce((acc, video) => {
              if (!acc[video.pedido_id]) {
                acc[video.pedido_id] = [];
              }
              acc[video.pedido_id].push({
                id: video.id,
                approval_status: video.approval_status,
                is_active: video.is_active,
                selected_for_display: video.selected_for_display,
                video_data: video.videos
              });
              return acc;
            }, {} as Record<string, any[]>);
          }
        } catch (error) {
          console.warn('Erro não crítico ao buscar vídeos dos pedidos:', error);
        }
      }

      // Buscar dados reais dos buildings (visualizacoes_mes, publico_estimado, quantidade_telas)
      const allBuildingIds = [...new Set(
        (orders || []).flatMap(order => order.lista_paineis || [])
      )];

      let buildingsData: Record<string, { 
        visualizacoes_mes: number; 
        publico_estimado: number;
        quantidade_telas: number;
      }> = {};

      if (allBuildingIds.length > 0) {
        try {
          const { data: buildings, error: buildingsError } = await supabase
            .from('buildings')
            .select('id, visualizacoes_mes, publico_estimado, quantidade_telas')
            .in('id', allBuildingIds);

          if (buildingsError) {
            console.warn('Erro ao buscar dados dos buildings (não crítico):', buildingsError);
          } else {
            console.log('✅ Dados dos buildings encontrados:', buildings?.length || 0);
            
            buildingsData = (buildings || []).reduce((acc, b) => {
              acc[b.id] = {
                visualizacoes_mes: b.visualizacoes_mes || 0,
                publico_estimado: b.publico_estimado || 0,
                quantidade_telas: b.quantidade_telas || 0
              };
              return acc;
            }, {} as Record<string, { visualizacoes_mes: number; publico_estimado: number; quantidade_telas: number }>);
          }
        } catch (error) {
          console.warn('Erro não crítico ao buscar dados dos buildings:', error);
        }
      }

      // Processar pedidos completos com dados de vídeo e totais reais
      const processedOrders: UserCompleteOrder[] = (orders || []).map(order => {
        // Calcular totais reais somando os dados dos buildings
        const totals = (order.lista_paineis || []).reduce((acc, buildingId) => {
          const data = buildingsData[buildingId] || { 
            visualizacoes_mes: 0, 
            publico_estimado: 0,
            quantidade_telas: 0
          };
          return {
            visualizacoes: acc.visualizacoes + data.visualizacoes_mes,
            publico: acc.publico + data.publico_estimado,
            telas: acc.telas + data.quantidade_telas
          };
        }, { visualizacoes: 0, publico: 0, telas: 0 });

        console.log(`📊 [ORDER ${order.id.substring(0, 8)}] Totais calculados:`, {
          buildings: order.lista_paineis?.length || 0,
          visualizacoes_mes: totals.visualizacoes,
          publico_estimado: totals.publico,
          quantidade_telas: totals.telas
        });

        return {
          id: order.id,
          created_at: order.created_at,
          status: order.status,
          valor_total: order.valor_total || 0,
          lista_paineis: order.lista_paineis || [],
          plano_meses: order.plano_meses,
          data_inicio: order.data_inicio,
          data_fim: order.data_fim,
          client_id: order.client_id,
          nome_pedido: order.nome_pedido,
          metodo_pagamento: order.metodo_pagamento,
          total_visualizacoes_mes: totals.visualizacoes,
          total_publico_estimado: totals.publico,
          total_telas: totals.telas,
          type: 'order' as const,
          videos: videosData[order.id] || []
        };
      });

      // Buscar tentativas de compra do usuário (sem foreign key problemática)
      let processedAttempts: UserOrderAttempt[] = [];
      try {
        const { data: attempts, error: attemptsError } = await supabase
          .from('tentativas_compra')
          .select('*')
          .eq('id_user', userId)
          .order('created_at', { ascending: false });

        if (attemptsError) {
          console.warn('Erro ao buscar tentativas do usuário (não crítico):', attemptsError);
        } else {
          console.log('✅ Tentativas do usuário encontradas:', attempts?.length || 0);

          // CORREÇÃO: Manter predios_selecionados como string[] conforme vem do Supabase
          processedAttempts = (attempts || []).map(attempt => ({
            id: attempt.id,
            created_at: attempt.created_at,
            valor_total: attempt.valor_total || 0,
            predios_selecionados: attempt.predios_selecionados || [], // Já vem como string[] do Supabase
            credencial: attempt.credencial,
            predio: attempt.predio,
            type: 'attempt' as const,
            status: 'tentativa' as const
          }));
        }
      } catch (error) {
        console.warn('Erro não crítico ao buscar tentativas do usuário:', error);
        // Continuar sem tentativas se houver erro
      }

      // ✅ CORREÇÃO AGRESSIVA: Remover TODAS as tentativas que têm pedido correspondente
      // (independente do tempo - pode ser antes OU depois)
      const validAttempts = processedAttempts.filter(attempt => {
        // Filtrar tentativas com valor inválido (menor ou igual a zero)
        if (attempt.valor_total <= 0) {
          console.log(`🚫 Tentativa com valor inválido removida: ${attempt.id} (Valor: R$ ${attempt.valor_total})`);
          return false;
        }
        
        // ✅ CRÍTICO: Verificar se existe QUALQUER pedido com mesmo valor e mesmo usuário
        // Não importa quando foi criado - se existe pedido, tentativa deve ser removida
        const hasMatchingOrder = processedOrders.some(order => {
          // Mesmo valor (com tolerância de centavos)
          const sameValue = Math.abs(order.valor_total - attempt.valor_total) < 0.01;
          
          if (!sameValue) {
            return false;
          }
          
          // ✅ NOVO: Se tem o mesmo valor, remover a tentativa
          // Não importa a diferença de tempo - pode ser criada antes ou depois
          console.log(`🔍 Tentativa ${attempt.id} tem pedido correspondente ${order.id} (Valor: R$ ${order.valor_total})`);
          return true;
        });
        
        if (hasMatchingOrder) {
          console.log(`🚫 Tentativa removida (pedido correspondente existe): ${attempt.id} (Valor: R$ ${attempt.valor_total})`);
          return false;
        }
        
        return true;
      });

      // Combinar e ordenar por data
      const combined = [...processedOrders, ...validAttempts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log(`📊 [UserOrders] Tentativas antes da filtragem: ${processedAttempts.length}`);
      console.log(`📊 [UserOrders] Tentativas após filtragem: ${validAttempts.length}`);
      console.log(`🗑️ [UserOrders] Tentativas órfãs removidas: ${processedAttempts.length - validAttempts.length}`);

      setUserOrdersAndAttempts(combined);

    } catch (error: any) {
      console.error('💥 Erro ao carregar pedidos e tentativas do usuário:', error);
      toast.error('Erro ao carregar seus pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserOrdersAndAttempts();

    if (userId) {
      // Configurar escuta em tempo real para pedidos e vídeos
      const channel = supabase
        .channel(`user-orders-${userId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'pedidos',
            filter: `client_id=eq.${userId}`
          }, 
          (payload) => {
            console.log('🔄 Mudança detectada em pedidos do usuário:', payload);
            fetchUserOrdersAndAttempts();
          }
        )
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pedido_videos'
          },
          (payload) => {
            console.log('🔄 Mudança detectada em vídeos do usuário:', payload);
            // Verificar se o vídeo pertence a um pedido do usuário antes de refetch
            const videoData = payload.new || payload.old;
            if (videoData && typeof videoData === 'object' && 'pedido_id' in videoData) {
              // Refetch para garantir que temos dados atualizados
              fetchUserOrdersAndAttempts();
            }
          }
        )
        .subscribe();

      return () => {
        console.log('🧹 Limpando inscrições de tempo real do usuário');
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  return {
    userOrdersAndAttempts,
    loading,
    refetch: fetchUserOrdersAndAttempts
  };
};
