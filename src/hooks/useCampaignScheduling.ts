import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CampaignAdvanced, 
  CampaignVideoSchedule, 
  CampaignInput 
} from '@/types/campaignScheduling';

export const useCampaignScheduling = (pedidoId: string) => {
  const [campaigns, setCampaigns] = useState<CampaignAdvanced[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    if (!pedidoId) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('campaigns_advanced')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns((data || []) as CampaignAdvanced[]);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaignData: CampaignInput): Promise<string | null> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns_advanced')
        .insert({
          client_id: user.id,
          pedido_id: pedidoId,
          name: campaignData.name,
          description: campaignData.description,
          start_date: campaignData.start_date,
          end_date: campaignData.end_date,
          status: 'draft'
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create video schedules
      for (const videoSchedule of campaignData.video_schedules) {
        const { data: schedule, error: scheduleError } = await supabase
          .from('campaign_video_schedules')
          .insert({
            campaign_id: campaign.id,
            video_id: videoSchedule.video_id,
            slot_position: videoSchedule.slot_position,
            priority: videoSchedule.priority
          })
          .select()
          .single();

        if (scheduleError) throw scheduleError;

        // Create schedule rules
        for (const rule of videoSchedule.schedule_rules) {
          const { error: ruleError } = await supabase
            .from('campaign_schedule_rules')
            .insert({
              campaign_video_schedule_id: schedule.id,
              days_of_week: rule.days_of_week,
              start_time: rule.start_time,
              end_time: rule.end_time,
              is_active: rule.is_active
            });

          if (ruleError) throw ruleError;
        }
      }

      toast({
        title: "Campanha criada com sucesso!",
        description: "Sua campanha foi configurada e está pronta para ativação.",
      });

      await fetchCampaigns();
      return campaign.id;
    } catch (err: any) {
      const message = err.message || 'Erro ao criar campanha';
      setError(message);
      toast({
        title: "Erro ao criar campanha",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: CampaignAdvanced['status']) => {
    try {
      const { error } = await supabase
        .from('campaigns_advanced')
        .update({ status })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Campanha ${status === 'active' ? 'ativada' : status === 'paused' ? 'pausada' : 'atualizada'} com sucesso.`,
      });

      await fetchCampaigns();
    } catch (err: any) {
      const message = err.message || 'Erro ao atualizar status';
      toast({
        title: "Erro ao atualizar status",
        description: message,
        variant: "destructive",
      });
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns_advanced')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Campanha removida",
        description: "A campanha foi removida com sucesso.",
      });

      await fetchCampaigns();
    } catch (err: any) {
      const message = err.message || 'Erro ao remover campanha';
      toast({
        title: "Erro ao remover campanha",
        description: message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [pedidoId]);

  return {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaignStatus,
    deleteCampaign,
    refetch: fetchCampaigns
  };
};