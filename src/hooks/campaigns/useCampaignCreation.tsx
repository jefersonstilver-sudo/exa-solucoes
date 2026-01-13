import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface CreateCampaignData {
  painel_id: string;
  data_inicio: string;
  data_fim: string;
  obs?: string;
}

export const useCampaignCreation = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const createCampaign = async (campaignData: CreateCampaignData) => {
    if (!userProfile?.id) {
      throw new Error('Usuário não autenticado');
    }

    setLoading(true);

    try {
      // Check panel availability for the date range
      const { data: conflictingCampaigns, error: checkError } = await supabase
        .from('campanhas')
        .select('id')
        .eq('painel_id', campaignData.painel_id)
        .eq('status', 'ativa')
        .gte('data_fim', campaignData.data_inicio)
        .lte('data_inicio', campaignData.data_fim);

      if (checkError) throw checkError;

      if (conflictingCampaigns && conflictingCampaigns.length > 0) {
        throw new Error('Este painel já possui uma campanha ativa no período selecionado');
      }

      // Create the campaign
      const newCampaign = {
        client_id: userProfile.id,
        painel_id: campaignData.painel_id,
        video_id: 'default_video_id', // Placeholder until video is uploaded
        data_inicio: campaignData.data_inicio,
        data_fim: campaignData.data_fim,
        status: 'ativa',
        obs: campaignData.obs || null
      };

      const { data, error } = await supabase
        .from('campanhas')
        .insert(newCampaign)
        .select()
        .single();

      if (error) throw error;

      toast.success('Campanha criada com sucesso!');
      return { success: true, data };
    } catch (error: any) {
      console.error('Erro ao criar campanha:', error);
      toast.error('Erro ao criar campanha: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const checkPaidOrders = async () => {
    if (!userProfile?.id) return { hasOrders: false, orders: [] };

    try {
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('id, lista_paineis, data_inicio, data_fim, valor_total')
        .eq('client_id', userProfile.id)
        .in('status', ['aguardando_video', 'video_enviado', 'video_aprovado', 'ativo']);

      if (error) throw error;

      return {
        hasOrders: pedidos && pedidos.length > 0,
        orders: pedidos || []
      };
    } catch (error: any) {
      console.error('Erro ao verificar pedidos:', error);
      toast.error('Erro ao verificar pedidos');
      return { hasOrders: false, orders: [] };
    }
  };

  return {
    createCampaign,
    checkPaidOrders,
    loading
  };
};