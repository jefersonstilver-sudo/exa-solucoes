import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CampaignAdvanced } from '@/types/campaignScheduling';

export interface CampaignWithSchedule {
  id: string;
  client_id: string;
  pedido_id: string;
  name: string;
  description?: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  video_schedules: any[];
}

export const useCampaignWithSchedule = () => {
  const [campaigns, setCampaigns] = useState<CampaignWithSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  const fetchCampaignsWithSchedule = async () => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);
      setError(null);

      // First, fetch basic campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns_advanced')
        .select('*')
        .eq('client_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      // Then fetch video schedules for each campaign
      const campaignsWithSchedules = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          // Get video schedules
          const { data: videoSchedules } = await supabase
            .from('campaign_video_schedules')
            .select(`
              *,
              campaign_schedule_rules (*),
              videos (
                id,
                nome,
                url,
                duracao,
                orientacao
              )
            `)
            .eq('campaign_id', campaign.id);

          return {
            ...campaign,
            video_schedules: videoSchedules?.map(schedule => ({
              ...schedule,
              video_data: schedule.videos || null,
              schedule_rules: schedule.campaign_schedule_rules || []
            })) || []
          } as CampaignWithSchedule;
        })
      );

      setCampaigns(campaignsWithSchedules);
    } catch (err) {
      console.error('Error fetching campaigns with schedule:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsWithSchedule();
  }, [userProfile?.id]);

  return {
    campaigns,
    loading,
    error,
    refetch: fetchCampaignsWithSchedule
  };
};