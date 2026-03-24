
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Parcela {
  id: string;
  numero_parcela: number;
  valor_original: number;
  valor_final: number;
  data_vencimento: string;
  status: string;
  data_pagamento?: string | null;
  metodo_pagamento?: string | null;
  mercadopago_payment_id?: string | null;
}

interface OrderWithClient {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis: any[];
  lista_predios: string[];
  plano_meses: number;
  data_inicio: string;
  data_fim: string;
  client_id: string;
  client_email: string;
  client_name: string;
  video_status: string;
  tipo_produto?: string;
  nome_pedido?: string;
  log_pagamento?: any;
  compliance_data?: any;
  cupom_id?: string;
  termos_aceitos?: boolean;
  transaction_id?: string;
  // Campos de fidelidade
  tipo_pagamento?: string;
  metodo_pagamento?: string;
  is_fidelidade?: boolean;
  dia_vencimento?: number;
  parcela_atual?: number;
  total_parcelas?: number;
  status_adimplencia?: string;
  // Campos do termo aceito
  termo_aceito_em?: string;
  dados_empresa_termo?: {
    cnpj?: string;
    razao_social?: string;
    nomeEmpresa?: string;
  };
  versao_termo?: string;
  // Parcelas do pedido
  parcelas?: Parcela[];
}

interface OrderVideo {
  id: string;
  slot_position: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  selected_for_display: boolean;
  created_at: string;
  approved_at?: string;
  rejection_reason?: string;
  video_data?: {
    id: string;
    nome: string;
    url: string;
    duracao: number;
    orientacao: string;
  };
}

interface BuildingData {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  imagem_principal?: string;
  imagem_2?: string;
  imagem_3?: string;
  imagem_4?: string;
  imageurl?: string;
  image_urls?: string[];
}

export const useRealOrderDetails = (orderId: string) => {
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderWithClient | null>(null);
  const [orderVideos, setOrderVideos] = useState<OrderVideo[]>([]);
  const [buildingData, setBuildingData] = useState<BuildingData[]>([]);

  const fetchOrderDetails = async () => {
      if (!orderId) return;

      try {
        setLoading(true);

        // Buscar pedido diretamente da tabela pedidos com dados do cliente
        const { data: order, error: ordersError } = await supabase
          .from('pedidos')
          .select(`
            id,
            created_at,
            status,
            valor_total,
            lista_paineis,
            lista_predios,
            plano_meses,
            data_inicio,
            data_fim,
            client_id,
            client_name,
            nome_pedido,
            compliance_data,
            log_pagamento,
            cupom_id,
            termos_aceitos,
            transaction_id,
            tipo_produto,
            tipo_pagamento,
            metodo_pagamento,
            is_fidelidade,
            dia_vencimento,
            parcela_atual,
            total_parcelas,
            status_adimplencia,
            users!pedidos_client_id_fkey (
              email,
              nome
            )
          `)
          .eq('id', orderId)
          .single();
        
        if (ordersError) throw ordersError;
        
        if (!order) {
          toast.error('Pedido não encontrado');
          return;
        }

        // Priorizar client_name do pedido, depois nome do usuário, depois email
        let clientName = order.client_name || order.users?.nome || order.users?.email?.split('@')[0] || 'Cliente';
        
        // Fallback: se ainda não tiver nome, buscar via edge function
        if (!order.client_name && !order.users?.nome) {
          try {
            const { data: usersData, error: usersError } = await supabase.functions.invoke('get-users-extended', {
              body: { userIds: [order.client_id] }
            });
            
            if (!usersError && usersData?.users && usersData.users.length > 0) {
              clientName = usersData.users[0].name || clientName;
            }
          } catch (error) {
            console.error('Erro ao buscar nome do cliente:', error);
          }
        }

        // Buscar dados do termo de fidelidade aceito
        let termoData: { aceito_em?: string; dados_empresa?: any; versao_termo?: string } | null = null;
        
        if (order.is_fidelidade) {
          const { data: termo, error: termoError } = await supabase
            .from('termos_fidelidade_aceites')
            .select('aceito_em, dados_empresa, versao_termo')
            .eq('pedido_id', orderId)
            .maybeSingle();
          
          if (!termoError && termo) {
            termoData = termo;
            console.log('📜 [ORDER DETAILS] Termo de fidelidade encontrado:', {
              aceito_em: termo.aceito_em,
              versao: termo.versao_termo
            });
          }
        }

        // Montar objeto completo do pedido
        const orderWithClient: OrderWithClient = {
          id: order.id,
          created_at: order.created_at,
          status: order.status,
          valor_total: order.valor_total,
          lista_paineis: order.lista_paineis || [],
          lista_predios: order.lista_predios || [],
          plano_meses: order.plano_meses,
          data_inicio: order.data_inicio,
          data_fim: order.data_fim,
          client_id: order.client_id,
          client_email: order.users?.email || 'Email não disponível',
          client_name: clientName,
          video_status: order.status,
          tipo_produto: order.tipo_produto || 'horizontal',
          nome_pedido: order.nome_pedido,
          log_pagamento: order.log_pagamento,
          compliance_data: order.compliance_data,
          cupom_id: order.cupom_id,
          termos_aceitos: order.termos_aceitos || !!termoData,
          transaction_id: order.transaction_id,
          // Campos fidelidade
          tipo_pagamento: order.tipo_pagamento,
          metodo_pagamento: order.metodo_pagamento,
          is_fidelidade: order.is_fidelidade,
          dia_vencimento: order.dia_vencimento,
          parcela_atual: order.parcela_atual,
          total_parcelas: order.total_parcelas,
          status_adimplencia: order.status_adimplencia,
          // Campos do termo aceito
          termo_aceito_em: termoData?.aceito_em,
          dados_empresa_termo: termoData?.dados_empresa,
          versao_termo: termoData?.versao_termo
        };

        // Buscar parcelas do pedido
        const { data: parcelas, error: parcelasError } = await supabase
          .from('parcelas')
          .select('*')
          .eq('pedido_id', orderId)
          .order('numero_parcela', { ascending: true });

        if (parcelasError) {
          console.error('⚠️ [ORDER DETAILS] Erro ao buscar parcelas:', parcelasError);
        } else if (parcelas && parcelas.length > 0) {
          orderWithClient.parcelas = parcelas.map(p => ({
            id: p.id,
            numero_parcela: p.numero_parcela,
            valor_original: p.valor_original,
            valor_final: p.valor_final,
            data_vencimento: p.data_vencimento,
            status: p.status,
            data_pagamento: p.data_pagamento,
            metodo_pagamento: p.metodo_pagamento,
            mercadopago_payment_id: p.mercadopago_payment_id
          }));
          console.log('💰 [ORDER DETAILS] Parcelas encontradas:', parcelas.length);
        }

        console.log('📦 [ORDER DETAILS] Order montado:', {
          id: orderWithClient.id.slice(0, 8),
          lista_predios_count: orderWithClient.lista_predios?.length || 0,
          lista_paineis_count: orderWithClient.lista_paineis?.length || 0,
          is_fidelidade: orderWithClient.is_fidelidade,
          tipo_pagamento: orderWithClient.tipo_pagamento,
          metodo_pagamento: orderWithClient.metodo_pagamento,
          parcelas_count: orderWithClient.parcelas?.length || 0,
          termos_aceitos: orderWithClient.termos_aceitos,
          termo_aceito_em: orderWithClient.termo_aceito_em
        });

        setOrderDetails(orderWithClient);

        // Buscar vídeos do pedido
        const { data: videos, error: videosError } = await supabase
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
          .eq('pedido_id', orderId)
          .order('selected_for_display', { ascending: false })
          .order('slot_position', { ascending: true });

        if (videosError) throw videosError;

        const formattedVideos: OrderVideo[] = videos?.map(v => ({
          id: v.id,
          slot_position: v.slot_position,
          approval_status: v.approval_status as 'pending' | 'approved' | 'rejected',
          is_active: v.is_active,
          selected_for_display: v.selected_for_display,
          created_at: v.created_at,
          approved_at: v.approved_at,
          rejection_reason: v.rejection_reason,
          video_data: v.videos ? {
            id: v.videos.id,
            nome: v.videos.nome,
            url: v.videos.url,
            duracao: v.videos.duracao,
            orientacao: v.videos.orientacao
          } : undefined
        })) || [];

        setOrderVideos(formattedVideos);

        // NOVA LÓGICA: Extrair building_ids de lista_paineis se lista_predios estiver vazio
        let buildingIds: string[] = [];

        // Primeiro, tentar usar lista_predios
        if (order.lista_predios && order.lista_predios.length > 0) {
          buildingIds = order.lista_predios;
          console.log('🏗️ [ORDER DETAILS] Usando lista_predios:', buildingIds.length, 'prédios');
        } 
        // Se lista_predios vazio, extrair de lista_paineis (objetos JSON ou strings JSON)
        else if (order.lista_paineis && order.lista_paineis.length > 0) {
          console.log('🔍 [ORDER DETAILS] lista_predios vazio, extraindo de lista_paineis...');
          
          // lista_paineis pode conter objetos, strings JSON, ou strings simples (UUIDs)
          buildingIds = order.lista_paineis
            .map((item: any) => {
              // Se for uma string, tentar parsear como JSON primeiro
              if (typeof item === 'string') {
                // Tentar parsear como JSON (caso seja "{\"building_id\":\"...\"}")
                try {
                  const parsed = JSON.parse(item);
                  if (parsed && typeof parsed === 'object') {
                    return parsed.building_id || parsed.painel_id || parsed.id;
                  }
                } catch {
                  // Se não for JSON válido, verificar se é um UUID válido
                  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                  if (uuidRegex.test(item)) {
                    return item;
                  }
                }
                return null;
              } else if (item && typeof item === 'object') {
                return item.building_id || item.painel_id || item.id;
              }
              return null;
            })
            .filter((id: string | null): id is string => id !== null && id.length > 0);
          
          console.log('🏗️ [ORDER DETAILS] Extraídos de lista_paineis:', buildingIds.length, 'building_ids');
          console.log('🏗️ [ORDER DETAILS] Building IDs extraídos:', buildingIds.slice(0, 3), '...');
        }

        // Buscar dados dos prédios
        if (buildingIds.length > 0) {
          console.log('🏗️ [ORDER DETAILS] Buscando', buildingIds.length, 'prédios');
          console.log('🏗️ [ORDER DETAILS] IDs dos prédios:', buildingIds);
          
          const { data: buildings, error: buildingsError } = await supabase
            .from('buildings')
            .select(`
              id,
              nome,
              endereco,
              bairro,
              imagem_principal,
              imagem_2,
              imagem_3,
              imagem_4,
              imageurl,
              image_urls
            `)
            .in('id', buildingIds);

          if (buildingsError) {
            console.error('💥 [ORDER DETAILS] Erro ao buscar prédios:', buildingsError);
            throw buildingsError;
          }

          console.log('✅ [ORDER DETAILS] Prédios encontrados:', buildings?.length || 0);
          console.log('📋 [ORDER DETAILS] Dados dos prédios:', buildings?.map(b => ({ id: b.id.slice(0, 8), nome: b.nome })));

          const formattedBuildings: BuildingData[] = buildings?.map(b => ({
            id: b.id,
            nome: b.nome || 'N/A',
            endereco: b.endereco || 'N/A',
            bairro: b.bairro || 'N/A',
            imagem_principal: b.imagem_principal,
            imagem_2: b.imagem_2,
            imagem_3: b.imagem_3,
            imagem_4: b.imagem_4,
            imageurl: b.imageurl,
            image_urls: b.image_urls
          })) || [];

          setBuildingData(formattedBuildings);
          console.log('💾 [ORDER DETAILS] BuildingData setado com', formattedBuildings.length, 'prédios');
        } else {
          console.log('⚠️ [ORDER DETAILS] Nenhum building_id encontrado em lista_predios ou lista_paineis');
        }

      } catch (error) {
        console.error('Erro ao carregar detalhes do pedido:', error);
        toast.error('Erro ao carregar detalhes do pedido');
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  return {
    loading,
    orderDetails,
    orderVideos,
    panelData: buildingData,
    refetch: fetchOrderDetails
  };
};
