import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CampaignData {
  id: string;
  client_id: string;
  status: string;
  created_at: string;
  // Legacy campaigns fields
  data_inicio?: string;
  data_fim?: string;
  obs?: string;
  painel_id?: string;
  video_id?: string;
  // Advanced campaigns fields
  start_date?: string;
  end_date?: string;
  name?: string;
  description?: string;
  pedido_id?: string;
  updated_at?: string;
}

interface CampaignDetails {
  campaign: CampaignData | null;
  panels: any[];
  videos: any[];
  order: any;
  isAdvanced: boolean;
}

export const useCampaignDetails = (campaignId: string | undefined) => {
  const [details, setDetails] = useState<CampaignDetails>({
    campaign: null,
    panels: [],
    videos: [],
    order: null,
    isAdvanced: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaignDetails = async () => {
    if (!campaignId) {
      setError('ID da campanha não fornecido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Primeiro, tentar buscar como campanha avançada
      const { data: advancedCampaign, error: advancedError } = await supabase
        .from('campaigns_advanced')
        .select('*')
        .eq('id', campaignId)
        .maybeSingle();

      if (advancedError && advancedError.code !== 'PGRST116') {
        throw advancedError;
      }

      let campaignData: CampaignData | null = null;
      let isAdvanced = false;

      if (advancedCampaign) {
        campaignData = advancedCampaign;
        isAdvanced = true;
      } else {
        // Se não for avançada, buscar na tabela de campanhas legacy
        const { data: legacyCampaign, error: legacyError } = await supabase
          .from('campanhas')
          .select('*')
          .eq('id', campaignId)
          .maybeSingle();

        if (legacyError) throw legacyError;
        
        if (!legacyCampaign) {
          throw new Error('Campanha não encontrada');
        }

        campaignData = legacyCampaign;
      }

      // Buscar dados relacionados
      let panels: any[] = [];
      let videos: any[] = [];
      let order: any = null;

      if (isAdvanced && campaignData?.pedido_id) {
        // Para campanhas avançadas, buscar painéis e vídeos do pedido
        const { data: orderData, error: orderError } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', campaignData.pedido_id)
          .maybeSingle();

        if (orderError) throw orderError;
        order = orderData;

        if (orderData?.lista_paineis) {
          const { data: panelsData, error: panelsError } = await supabase
            .from('painels')
            .select('*, buildings(*)')
            .in('id', orderData.lista_paineis);

          if (panelsError) throw panelsError;
          panels = panelsData || [];
        }

        // Buscar vídeos aprovados do pedido
        const { data: videosData, error: videosError } = await supabase
          .from('pedido_videos')
          .select('*, videos(*)')
          .eq('pedido_id', campaignData.pedido_id)
          .eq('approval_status', 'approved');

        if (videosError) throw videosError;
        videos = videosData || [];
      } else if (!isAdvanced && campaignData?.painel_id) {
        // Para campanhas legacy, buscar painel específico
        const { data: panelData, error: panelError } = await supabase
          .from('painels')
          .select('*, buildings(*)')
          .eq('id', campaignData.painel_id)
          .maybeSingle();

        if (panelError) throw panelError;
        if (panelData) panels = [panelData];

        // Buscar vídeo específico
        if (campaignData.video_id) {
          const { data: videoData, error: videoError } = await supabase
            .from('videos')
            .select('*')
            .eq('id', campaignData.video_id)
            .maybeSingle();

          if (videoError) throw videoError;
          if (videoData) videos = [videoData];
        }
      }

      setDetails({
        campaign: campaignData,
        panels,
        videos,
        order,
        isAdvanced
      });
    } catch (error: any) {
      console.error('Erro ao carregar detalhes da campanha:', error);
      setError(error.message || 'Erro ao carregar detalhes da campanha');
      toast.error('Erro ao carregar detalhes da campanha');
    } finally {
      setLoading(false);
    }
  };

  const updateCampaign = async (updates: Partial<CampaignData>) => {
    if (!details.campaign) return false;

    try {
      const table = details.isAdvanced ? 'campaigns_advanced' : 'campanhas';
      
      const { error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', details.campaign.id);

      if (error) throw error;

      // Atualizar estado local
      setDetails(prev => ({
        ...prev,
        campaign: prev.campaign ? { ...prev.campaign, ...updates } : null
      }));

      toast.success('Campanha atualizada com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar campanha:', error);
      toast.error('Erro ao atualizar campanha');
      return false;
    }
  };

  useEffect(() => {
    loadCampaignDetails();
  }, [campaignId]);

  return {
    ...details,
    loading,
    error,
    refreshData: loadCampaignDetails,
    updateCampaign
  };
};