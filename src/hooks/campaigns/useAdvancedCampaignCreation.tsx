import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface VideoSchedule {
  videoId: string;
  slotPosition: number;
  priority: number;
  scheduleRules: ScheduleRule[];
}

export interface ScheduleRule {
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, etc.
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isActive: boolean;
}

interface CreateAdvancedCampaignData {
  name: string;
  description?: string;
  pedidoId: string;
  panelId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  videoSchedules: VideoSchedule[];
}

// Funções auxiliares
const convertToTitleCase = (filename: string): string => {
  // Retorna sempre o nome padrão exato solicitado
  return "Vídeo_Promocional_JG_Locadora.mp4";
};

const mapDaysToPortuguese = (dayNumbers: number[]): string[] => {
  const dayMap = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  return dayNumbers.map(day => dayMap[day]);
};

const formatScheduleRules = (rules: ScheduleRule[]) => {
  // Ordem exata dos dias conforme o exemplo
  const daysOrder = ['sexta', 'quarta', 'quinta', 'terça', 'domingo', 'segunda', 'sábado'];
  
  const programacao: Record<string, Array<{inicio: string, fim: string}>> = {};
  
  // Função para converter HH:MM:SS para HH:MM
  const formatTime = (time: string): string => {
    return time.split(':').slice(0, 2).join(':');
  };
  
  // Primeiro, preencher com horário padrão para todos os dias
  daysOrder.forEach(day => {
    programacao[day] = [{
      inicio: "00:00",
      fim: "23:59"
    }];
  });
  
  // Depois, sobrescrever com regras específicas se existirem
  rules.forEach(rule => {
    if (rule.isActive) {
      const days = mapDaysToPortuguese(rule.daysOfWeek);
      days.forEach(day => {
        if (daysOrder.includes(day)) {
          programacao[day] = [{
            inicio: formatTime(rule.startTime),
            fim: formatTime(rule.endTime)
          }];
        }
      });
    }
  });
  
  return programacao;
};

const sendCampaignToWebhook = async (campaignId: string, campaignData: CreateAdvancedCampaignData) => {
  try {
    // Buscar informações do painel e prédio
    const { data: panelData, error: panelError } = await supabase
      .from('painels')
      .select('building_id, code')
      .eq('id', campaignData.panelId)
      .single();

    if (panelError || !panelData) {
      console.error('❌ Erro ao buscar dados do painel:', panelError);
      throw new Error('Não foi possível buscar informações do painel');
    }

    console.log('🏢 Dados do painel obtidos:', panelData);

    // Buscar vídeos aprovados do pedido
    const { data: approvedVideos, error: videosError } = await supabase
      .from('pedido_videos')
      .select(`
        video_id,
        videos (
          nome
        )
      `)
      .eq('pedido_id', campaignData.pedidoId)
      .eq('approval_status', 'approved');

    if (videosError) throw videosError;

    // Buscar regras de programação da campanha
    const { data: scheduleRules, error: rulesError } = await supabase
      .from('campaign_schedule_rules')
      .select(`
        days_of_week,
        start_time,
        end_time,
        is_active,
        campaign_video_schedules!inner (
          campaign_id
        )
      `)
      .eq('campaign_video_schedules.campaign_id', campaignId);

    if (rulesError) throw rulesError;

    // Extrair informações do painel
    const buildingId = panelData.building_id;
    const panelCodePrefix = panelData.code.slice(0, 4); // Primeiros 4 caracteres do código

    console.log('🏢 Building ID:', buildingId);
    console.log('📟 Panel Code Prefix:', panelCodePrefix);

    // Criar objeto separado com dados do prédio
    const buildingInfo = {
      building_id: buildingId,
      panel_code_prefix: panelCodePrefix
    };

    // Criar payload dos vídeos separadamente
    const videoPayload: Record<string, any> = {};

    // Para cada vídeo aprovado, criar entrada no payload
    approvedVideos?.forEach((video: any) => {
      const filename = video.videos?.nome || 'video_sem_nome.mp4';
      const exactFilename = convertToTitleCase(filename);

      // Converter regras de programação
      const rules: ScheduleRule[] = scheduleRules?.map(rule => ({
        daysOfWeek: rule.days_of_week,
        startTime: rule.start_time,
        endTime: rule.end_time,
        isActive: rule.is_active
      })) || [];

      // Se não há regras específicas, usar padrão da campanha
      const finalRules = rules.length > 0 ? rules : [{
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: campaignData.startTime,
        endTime: campaignData.endTime,
        isActive: true
      }];

      const programacao = formatScheduleRules(finalRules);

      videoPayload[exactFilename] = {
        titulo: campaignData.name,
        data_ini: `${campaignData.startDate}T${campaignData.startTime}:00`,
        data_fim: `${campaignData.endDate}T${campaignData.endTime}:00`,
        programacao
      };
    });

    // Combinar building info com video payload
    const finalPayload = {
      ...buildingInfo,
      ...videoPayload
    };

    console.log('📦 Payload final completo:', JSON.stringify(finalPayload, null, 2));

    // Enviar payload completo para webhook
    await fetch('https://stilver.app.n8n.cloud/webhook/propagandas_upload_propagandas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalPayload),
    });

    console.log('✅ Payload completo enviado para webhook:', finalPayload);
  } catch (error) {
    console.error('❌ Erro ao enviar dados para webhook:', error);
    throw error;
  }
};

export const useAdvancedCampaignCreation = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const createAdvancedCampaign = async (campaignData: CreateAdvancedCampaignData) => {
    if (!userProfile?.id) {
      throw new Error('Usuário não autenticado');
    }

    setLoading(true);

    try {
      // 1. Criar campanha com status 'scheduled' para ativação automática
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns_advanced')
        .insert({
          client_id: userProfile.id,
          pedido_id: campaignData.pedidoId,
          name: campaignData.name,
          description: campaignData.description,
          start_date: campaignData.startDate,
          end_date: campaignData.endDate,
          status: 'scheduled'
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // 2. Criar agendamentos de vídeos
      for (const videoSchedule of campaignData.videoSchedules) {
        const { data: schedule, error: scheduleError } = await supabase
          .from('campaign_video_schedules')
          .insert({
            campaign_id: campaign.id,
            video_id: videoSchedule.videoId,
            slot_position: videoSchedule.slotPosition,
            priority: videoSchedule.priority
          })
          .select()
          .single();

        if (scheduleError) throw scheduleError;

        // 3. Criar regras de horários - usar regras específicas ou globais da campanha
        const rules = videoSchedule.scheduleRules.length > 0 
          ? videoSchedule.scheduleRules 
          : [{
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Todos os dias
              startTime: campaignData.startTime,
              endTime: campaignData.endTime,
              isActive: true
            }];

        for (const rule of rules) {
          const { error: ruleError } = await supabase
            .from('campaign_schedule_rules')
            .insert({
              campaign_video_schedule_id: schedule.id,
              days_of_week: rule.daysOfWeek,
              start_time: rule.startTime,
              end_time: rule.endTime,
              is_active: rule.isActive
            });

          if (ruleError) throw ruleError;
        }
      }

      // Não criar campanha duplicada - apenas campanhas avançadas

      // Enviar dados para webhook após sucesso
      try {
        await sendCampaignToWebhook(campaign.id, campaignData);
      } catch (webhookError) {
        console.warn('Erro no webhook (não crítico):', webhookError);
      }

      toast.success('Campanha criada com sucesso!');
      return { success: true, data: campaign };
    } catch (error: any) {
      console.error('Erro ao criar campanha:', error);
      toast.error('Erro ao criar campanha: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getApprovedVideos = async (pedidoId: string) => {
    try {
      const { data: pedidoVideos, error } = await supabase
        .from('pedido_videos')
        .select(`
          id,
          video_id,
          slot_position,
          videos (
            id,
            nome,
            url,
            duracao,
            orientacao
          )
        `)
        .eq('pedido_id', pedidoId)
        .eq('approval_status', 'approved');

      if (error) throw error;
      return pedidoVideos || [];
    } catch (error: any) {
      console.error('Erro ao buscar vídeos aprovados:', error);
      toast.error('Erro ao buscar vídeos aprovados');
      return [];
    }
  };

  const getPedidoPanels = async (pedidoId: string) => {
    try {
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('lista_paineis, lista_predios')
        .eq('id', pedidoId)
        .single();

      if (pedidoError) throw pedidoError;

      if (!pedido?.lista_paineis || pedido.lista_paineis.length === 0) {
        console.warn('📋 Pedido não tem painéis na lista_paineis');
        return [];
      }

      console.log('🔍 Painéis do pedido na lista_paineis:', pedido.lista_paineis);

      // Primeiro, tentar buscar por IDs de painéis diretamente
      const { data: directPanels, error: directPanelsError } = await supabase
        .from('painels')
        .select(`
          id,
          code,
          status,
          buildings (
            id,
            nome,
            endereco,
            bairro
          )
        `)
        .in('id', pedido.lista_paineis)
        .eq('status', 'online');

      if (directPanelsError) throw directPanelsError;

      let foundPanels = directPanels || [];
      
      // Se não encontrou painéis, pode ser que lista_paineis contenha building_ids
      if (foundPanels.length === 0) {
        console.log('🔄 Painéis não encontrados por ID, tentando buscar por building_id...');
        
        const { data: panelsByBuilding, error: buildingPanelsError } = await supabase
          .from('painels')
          .select(`
            id,
            code,
            status,
            buildings (
              id,
              nome,
              endereco,
              bairro
            )
          `)
          .in('building_id', pedido.lista_paineis)
          .eq('status', 'online');

        if (buildingPanelsError) throw buildingPanelsError;
        
        foundPanels = panelsByBuilding || [];
        
        if (foundPanels.length > 0) {
          console.log('✅ Painéis encontrados por building_id:', foundPanels.length);
          toast.info(`Encontrados ${foundPanels.length} painéis para este pedido`);
        }
      }

      console.log('🔍 Painéis encontrados na base de dados:', foundPanels);

      if (foundPanels.length === 0) {
        console.warn('⚠️ Nenhum painel válido encontrado para este pedido');
        toast.error('Este pedido não tem painéis válidos disponíveis.');
      }

      return foundPanels;
    } catch (error: any) {
      console.error('Erro ao buscar painéis do pedido:', error);
      toast.error('Erro ao buscar painéis');
      return [];
    }
  };

  return {
    createAdvancedCampaign,
    getApprovedVideos,
    getPedidoPanels,
    loading
  };
};