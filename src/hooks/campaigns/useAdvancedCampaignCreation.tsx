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

export const useAdvancedCampaignCreation = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const createAdvancedCampaign = async (campaignData: CreateAdvancedCampaignData) => {
    if (!userProfile?.id) {
      throw new Error('Usuário não autenticado');
    }

    setLoading(true);

    try {
      // 1. Criar campanha
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns_advanced')
        .insert({
          client_id: userProfile.id,
          pedido_id: campaignData.pedidoId,
          name: campaignData.name,
          description: campaignData.description,
          start_date: campaignData.startDate,
          end_date: campaignData.endDate,
          status: 'active'
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