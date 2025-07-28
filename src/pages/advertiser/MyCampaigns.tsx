
import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileMyCampaigns from './MobileMyCampaigns';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Plus, Calendar, Monitor, Edit, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import CampaignCreationForm from '@/components/campaigns/CampaignCreationForm';

interface Campaign {
  id: string;
  painel_id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  obs?: string;
  created_at?: string;
  video_id?: string;
  name?: string;
  start_time?: string;
  end_time?: string;
  is_advanced?: boolean;
}

const MyCampaigns = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadCampaigns();
  }, [userProfile]);

  const loadCampaigns = async () => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);

      // Buscar campanhas legacy
      const { data: legacyCampaigns, error: legacyError } = await supabase
        .from('campanhas')
        .select('*')
        .eq('client_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (legacyError) throw legacyError;

      // Buscar campanhas avançadas com horários
      const { data: advancedCampaignsData, error: advancedError } = await supabase
        .from('campaigns_advanced')
        .select(`
          id,
          name,
          start_date,
          end_date,
          status,
          description,
          created_at,
          campaign_video_schedules(
            id,
            campaign_schedule_rules(
              start_time,
              end_time,
              days_of_week,
              is_active
            )
          )
        `)
        .eq('client_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (advancedError) throw advancedError;

      // Converter campanhas avançadas para o formato legacy
      const advancedCampaigns = advancedCampaignsData?.map(campaign => {
        // Pegar o primeiro horário ativo das regras
        const firstSchedule = campaign.campaign_video_schedules?.[0];
        const firstRule = firstSchedule?.campaign_schedule_rules?.find(rule => rule.is_active);
        
        // Se não há regras específicas, significa que usa horários globais da campanha
        // Para campanhas existentes, mostrar que tem horários padrão
        const hasScheduleRules = firstRule != null;
        const defaultTime = hasScheduleRules ? null : "Todo o dia";
        
        return {
          id: campaign.id,
          painel_id: 'painel-advanced',
          data_inicio: campaign.start_date,
          data_fim: campaign.end_date,
          status: campaign.status === 'active' ? 'ativa' : campaign.status,
          obs: campaign.description || `Campanha avançada: ${campaign.name}`,
          created_at: campaign.created_at,
          video_id: 'advanced-video',
          name: campaign.name,
          start_time: firstRule?.start_time || defaultTime,
          end_time: firstRule?.end_time || defaultTime,
          is_advanced: true
        } as Campaign;
      }) || [];

      // Combinar ambas as listas
      const allCampaigns = [
        ...(legacyCampaigns || []).map(c => ({ ...c, is_advanced: false })),
        ...advancedCampaigns
      ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      setCampaigns(allCampaigns);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
      case 'agendado':
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Agendada</Badge>;
      case 'pausado':
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Pausada</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'finalizado':
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Finalizada</Badge>;
      case 'expirado':
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expirada</Badge>;
      case 'cancelado':
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      case 'rascunho':
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Rascunho</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    // Garantir que a data seja tratada como local (sem conversão de timezone)
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // Formato HH:MM
  };

  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateCampaign = () => {
    // Verificar se o usuário tem pedidos pagos primeiro
    checkPaidOrders();
  };

  const checkPaidOrders = async () => {
    if (!userProfile?.id) return;

    try {
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('client_id', userProfile.id)
        .in('status', ['pago', 'pago_pendente_video', 'video_aprovado']);

      if (error) throw error;

      if (!pedidos || pedidos.length === 0) {
        toast.error('Você precisa ter pelo menos um pedido pago para criar uma campanha');
        navigate('/paineis-digitais/loja');
        return;
      }

      // Se tem pedidos pagos, pode criar campanha
      setShowCreateForm(true);
    } catch (error) {
      console.error('Erro ao verificar pedidos:', error);
      toast.error('Erro ao verificar pedidos');
    }
  };

  const handleCampaignCreated = () => {
    setShowCreateForm(false);
    loadCampaigns(); // Reload campaigns to show the new one
  };

  const handleEditCampaign = (campaignId: string) => {
    navigate(`/anunciante/campanhas/${campaignId}`);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;

    try {
      // Encontrar a campanha para determinar o tipo
      const campaign = campaigns.find(c => c.id === campaignId);
      
      if (!campaign) {
        toast.error('Campanha não encontrada');
        return;
      }

      if (campaign.is_advanced) {
        // Excluir campanha avançada e dados relacionados
        
        // 1. Buscar e excluir regras de agendamento
        const { data: schedules } = await supabase
          .from('campaign_video_schedules')
          .select('id')
          .eq('campaign_id', campaignId);

        if (schedules?.length) {
          const scheduleIds = schedules.map(s => s.id);
          
          // Excluir regras de agendamento
          await supabase
            .from('campaign_schedule_rules')
            .delete()
            .in('campaign_video_schedule_id', scheduleIds);
          
          // Excluir agendamentos de vídeo
          await supabase
            .from('campaign_video_schedules')
            .delete()
            .eq('campaign_id', campaignId);
        }

        // 2. Excluir campanha avançada
        const { error } = await supabase
          .from('campaigns_advanced')
          .delete()
          .eq('id', campaignId);

        if (error) throw error;
      } else {
        // Excluir campanha legacy
        const { error } = await supabase
          .from('campanhas')
          .delete()
          .eq('id', campaignId);

        if (error) throw error;
      }

      toast.success('Campanha excluída com sucesso');
      loadCampaigns();
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      toast.error('Erro ao excluir campanha');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-indexa-purple" />
        <p className="ml-2 text-lg">Carregando campanhas...</p>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <CampaignCreationForm 
          onCancel={() => setShowCreateForm(false)}
          onSuccess={handleCampaignCreated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Campanhas</h1>
          <p className="text-gray-600 mt-1">Gerencie todas as suas campanhas de publicidade</p>
        </div>
        <Button onClick={handleCreateCampaign} className="bg-indexa-purple hover:bg-indexa-purple/90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Campanhas */}
      {campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Campanha #{campaign.id.substring(0, 8)}
                  </CardTitle>
                  {getStatusBadge(campaign.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(campaign.data_inicio)} - {formatDate(campaign.data_fim)}
                </div>
                
                {campaign.start_time && campaign.end_time && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {formatTime(campaign.start_time)} - {formatTime(campaign.end_time)}
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-600">
                  <Monitor className="h-4 w-4 mr-2" />
                  {campaign.is_advanced ? 'Campanha Avançada' : `Painel: ${campaign.painel_id.substring(0, 8)}...`}
                </div>

                {campaign.obs && (
                  <p className="text-sm text-gray-600">{campaign.obs}</p>
                )}

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditCampaign(campaign.id)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
              <Play className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">Nenhuma campanha encontrada</h3>
            <p className="text-gray-500 mb-6">
              Você ainda não criou nenhuma campanha. Comece criando sua primeira campanha para seus painéis.
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={handleCreateCampaign} className="bg-indexa-purple hover:bg-indexa-purple/90">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Campanha
              </Button>
              <Button variant="outline" onClick={() => navigate('/paineis-digitais/loja')}>
                Comprar Painéis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyCampaigns;
