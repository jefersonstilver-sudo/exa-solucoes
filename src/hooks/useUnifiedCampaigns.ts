import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CampaignAdvanced } from '@/types/campaignScheduling';

interface OldCampaign {
  id: string;
  painel_id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  obs?: string;
  created_at: string;
  video_id: string;
}

export interface VideoInfo {
  id: string;
  nome: string;
  url: string;
  duracao?: number;
  orientacao?: string;
  formato?: string;
}

export interface UnifiedCampaign {
  id: string;
  name: string;
  type: 'advanced' | 'legacy';
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  description?: string;
  pedido_id?: string;
  painel_id?: string;
  video_id?: string;
  videos?: VideoInfo[]; // Para campanhas avançadas
  video?: VideoInfo;    // Para campanhas legadas
}

export const useUnifiedCampaigns = () => {
  const { userProfile } = useAuth();
  const [campaigns, setCampaigns] = useState<UnifiedCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  const fetchAllCampaigns = async () => {
    if (!userProfile?.id) {
      console.log('❌ [UNIFIED_CAMPAIGNS] userProfile.id não encontrado:', userProfile);
      return;
    }

    console.log('🔄 [UNIFIED_CAMPAIGNS] Iniciando busca de campanhas para usuário:', userProfile.id);
    console.log('🔄 [UNIFIED_CAMPAIGNS] UserProfile completo:', userProfile);
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 [UNIFIED_CAMPAIGNS] Starting to fetch campaigns...');
      
      // Buscar campanhas avançadas com vídeos (incluindo todas, mesmo drafts)
      const { data: advancedCampaigns, error: advancedError } = await supabase
        .from('campaigns_advanced')
        .select(`
          *,
          campaign_video_schedules (
            video_id,
            videos (
              id,
              nome,
              url,
              duracao,
              orientacao,
              formato
            )
          )
        `)
        .eq('client_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (advancedError) {
        console.error('❌ [UNIFIED_CAMPAIGNS] Erro ao buscar campanhas avançadas:', advancedError);
        throw advancedError;
      }

      console.log('✅ [UNIFIED_CAMPAIGNS] Campanhas avançadas encontradas:', advancedCampaigns?.length || 0);
      console.log('📊 [UNIFIED_CAMPAIGNS] Dados das campanhas avançadas:', advancedCampaigns);
      console.log('🔍 [CAMPAIGNS] Advanced campaigns found:', advancedCampaigns?.length || 0);
      console.log('🔍 [CAMPAIGNS] Advanced campaigns data:', advancedCampaigns);

      // Buscar campanhas legadas com vídeos
      const { data: legacyCampaigns, error: legacyError } = await supabase
        .from('campanhas')
        .select(`
          *,
          videos (
            id,
            nome,
            url,
            duracao,
            orientacao,
            formato
          )
        `)
        .eq('client_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (legacyError) throw legacyError;
      console.log('🔍 [CAMPAIGNS] Legacy campaigns found:', legacyCampaigns?.length || 0);

      // Converter campanhas avançadas
      const unifiedAdvanced: UnifiedCampaign[] = (advancedCampaigns || []).map((campaign: any) => {
        // Extrair vídeos dos agendamentos
        const videos = campaign.campaign_video_schedules?.map((schedule: any) => schedule.videos).filter(Boolean) || [];
        
        console.log(`🔍 [CAMPAIGNS] Processing advanced campaign ${campaign.id}:`, {
          name: campaign.name,
          status: campaign.status,
          videosCount: videos.length,
          schedules: campaign.campaign_video_schedules?.length || 0
        });
        
        return {
          id: campaign.id,
          name: campaign.name,
          type: 'advanced' as const,
          status: campaign.status,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          created_at: campaign.created_at,
          description: campaign.description,
          pedido_id: campaign.pedido_id,
          videos: videos
        };
      });

      // Converter campanhas legadas
      const unifiedLegacy: UnifiedCampaign[] = (legacyCampaigns || []).map((campaign: any) => ({
        id: campaign.id,
        name: `Campanha ${campaign.id.substring(0, 8)}`,
        type: 'legacy' as const,
        status: campaign.status,
        start_date: campaign.data_inicio,
        end_date: campaign.data_fim,
        created_at: campaign.created_at,
        description: campaign.obs,
        painel_id: campaign.painel_id,
        video_id: campaign.video_id,
        video: campaign.videos || null
      }));

      // Combinar e ordenar por data de criação
      const allCampaigns = [...unifiedAdvanced, ...unifiedLegacy].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log('🔍 [CAMPAIGNS] Total unified campaigns:', allCampaigns.length);
      console.log('🔍 [CAMPAIGNS] Campaigns data:', allCampaigns);
      
      // Verificar se há uma nova campanha criada recentemente
      if (allCampaigns.length > 0) {
        const newest = allCampaigns[0];
        if (lastCreatedId !== newest.id) {
          setLastCreatedId(newest.id);
          console.log('🆕 [CAMPAIGNS] New campaign detected:', newest.name);
        }
      }
      
      setCampaigns(allCampaigns);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCampaigns();
  }, [userProfile?.id]);

  // Auto-refresh when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userProfile?.id) {
        console.log('🔄 [CAMPAIGNS] Page visible - auto-refreshing campaigns');
        fetchAllCampaigns();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userProfile?.id]);

  // Real-time subscription para campanhas avançadas
  useEffect(() => {
    if (!userProfile?.id) return;

    console.log('🔄 [CAMPAIGNS] Setting up real-time subscription');
    
    const channel = supabase
      .channel('campaigns-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns_advanced',
          filter: `client_id=eq.${userProfile.id}`
        },
        (payload) => {
          console.log('🔄 [CAMPAIGNS] Real-time update received:', payload);
          console.log('🔄 [CAMPAIGNS] Payload details:', {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          });
          
          // Aguardar delay e fazer múltiplos refreshes para garantir sincronização
          setTimeout(() => {
            console.log('🔄 [CAMPAIGNS] Executing first refresh from real-time');
            fetchAllCampaigns();
          }, 500);
          
          setTimeout(() => {
            console.log('🔄 [UNIFIED_CAMPAIGNS] Segundo refresh em tempo real');  
            fetchAllCampaigns();
          }, 1500);
        }
      )
      .subscribe();

    // Listener para evento customizado de criação de campanha
    const handleCampaignCreated = (event: CustomEvent) => {
      console.log('🔔 [UNIFIED_CAMPAIGNS] Evento de campanha criada recebido:', event.detail);
      setTimeout(() => {
        console.log('🔄 [UNIFIED_CAMPAIGNS] Refresh por evento customizado');
        fetchAllCampaigns();
      }, 1000);
    };

    window.addEventListener('campaignCreated', handleCampaignCreated as EventListener);

    return () => {
      console.log('🔄 [UNIFIED_CAMPAIGNS] Cleaning up subscription and event listener');
      supabase.removeChannel(channel);
      window.removeEventListener('campaignCreated', handleCampaignCreated as EventListener);
    };
  }, [userProfile?.id]);

  return {
    campaigns,
    loading,
    error,
    refetch: fetchAllCampaigns,
    lastCreatedId
  };
};