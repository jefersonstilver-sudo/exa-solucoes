
import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileMyCampaigns from './MobileMyCampaigns';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Plus, Calendar, Monitor, Edit, Trash2, Eye, Building } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import CampaignCreationForm from '@/components/campaigns/CampaignCreationForm';
import CampaignEditModal from '@/components/campaigns/CampaignEditModal';

interface Campaign {
  id: string;
  client_id: string;
  painel_id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  created_at: string;
  obs?: string;
  video_id?: string;
  name?: string;
  start_time?: string;
  end_time?: string;
  is_advanced?: boolean;
  start_date?: string;
  end_date?: string;
  description?: string;
  pedido_id?: string;
  updated_at?: string;
  buildings_names?: string[];
  days_of_week?: number[];
}

const MyCampaigns = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Controle de carregamento para evitar múltiplas chamadas
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  
  // Estado para modal de edição
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const isMobile = useIsMobile();

  useEffect(() => {
    if (userProfile?.id && !isLoadingData) {
      loadCampaigns();
    }
  }, [userProfile]);

  // Configurar atualizações automáticas com menor frequência
  useEffect(() => {
    if (!userProfile?.id) return;

    // Atualizar a cada 5 minutos (reduzido de 30 segundos)
    const interval = setInterval(() => {
      const now = Date.now();
      // Evitar atualizações se a última foi há menos de 4 minutos
      if (now - lastLoadTime > 240000 && !isLoadingData) {
        console.log('🔄 Auto-refresh campaigns (5min interval)');
        loadCampaigns();
      }
    }, 300000);

    return () => {
      clearInterval(interval);
    };
  }, [userProfile, lastLoadTime, isLoadingData]);

  const loadCampaigns = async () => {
    if (!userProfile?.id) return;

    // Evitar múltiplas chamadas simultâneas
    if (isLoadingData) {
      console.log('⏳ Carregamento já em andamento, ignorando chamada');
      return;
    }

    // Implementar debounce básico - evitar chamadas muito frequentes
    const now = Date.now();
    if (now - lastLoadTime < 2000) {
      console.log('⚡ Chamada muito frequente, ignorando');
      return;
    }

    console.log('🔄 Iniciando carregamento de campanhas...');
    setIsLoadingData(true);
    setLoading(true);
    setLastLoadTime(now);

    try {

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
          pedido_id,
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

      // Buscar dados dos pedidos para obter lista de prédios
      const pedidoIds = advancedCampaignsData?.map(c => c.pedido_id).filter(Boolean) || [];
      let pedidosData: any[] = [];
      let buildingsData: any[] = [];

      if (pedidoIds.length > 0) {
        const { data: pedidos } = await supabase
          .from('pedidos')
          .select('id, lista_predios')
          .in('id', pedidoIds);
        
        pedidosData = pedidos || [];

        // Buscar dados dos prédios
        const buildingIds = pedidosData.flatMap(p => p.lista_predios || []);
        if (buildingIds.length > 0) {
          const { data: buildings } = await supabase
            .from('buildings')
            .select('id, nome')
            .in('id', buildingIds);
          
          buildingsData = buildings || [];
        }
      }

      // Converter campanhas avançadas para o formato legacy
      const advancedCampaigns = advancedCampaignsData?.map(campaign => {
        // Pegar o primeiro horário ativo das regras
        const firstSchedule = campaign.campaign_video_schedules?.[0];
        const firstRule = firstSchedule?.campaign_schedule_rules?.find(rule => rule.is_active);
        
        // Se não há regras específicas, significa que usa horários globais da campanha
        // Para campanhas existentes, mostrar que tem horários padrão
        const hasScheduleRules = firstRule != null;
        const defaultTime = hasScheduleRules ? null : "Todo o dia";

        // Buscar dados do pedido desta campanha
        const pedido = pedidosData.find(p => p.id === campaign.pedido_id);
        const campaignBuildingIds = pedido?.lista_predios || [];
        const campaignBuildings = buildingsData.filter(b => campaignBuildingIds.includes(b.id));

        // Pegar todos os dias da semana das regras ativas
        const allDays = campaign.campaign_video_schedules?.flatMap(schedule => 
          schedule.campaign_schedule_rules?.filter(rule => rule.is_active)?.flatMap(rule => rule.days_of_week) || []
        ) || [];
        const uniqueDays = [...new Set(allDays)];
        
        return {
          id: campaign.id,
          client_id: userProfile.id,
          painel_id: 'painel-advanced',
          data_inicio: campaign.start_date,
          data_fim: campaign.end_date,
          status: campaign.status === 'active' ? 'ativa' : campaign.status,
          obs: campaign.description || `Campanha avançada: ${campaign.name}`,
          created_at: campaign.created_at || new Date().toISOString(),
          video_id: 'advanced-video',
          name: campaign.name,
          start_time: firstRule?.start_time || defaultTime,
          end_time: firstRule?.end_time || defaultTime,
          is_advanced: true,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          description: campaign.description,
          pedido_id: campaign.pedido_id,
          buildings_names: campaignBuildings.map(b => b.nome),
          days_of_week: uniqueDays
        } as Campaign;
      }) || [];

      // Combinar ambas as listas
      const allCampaigns = [
        ...(legacyCampaigns || []).map(c => ({ 
          ...c, 
          is_advanced: false,
          start_date: c.data_inicio,
          end_date: c.data_fim,
          description: c.obs,
          created_at: c.created_at || new Date().toISOString()
        })),
        ...advancedCampaigns
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setCampaigns(allCampaigns);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
      setIsLoadingData(false);
    }
  };

  const getStatusBadge = (campaign: Campaign) => {
    const status = campaign.status;
    
    // Verificar se deveria estar pausada baseado no horário atual (apenas para campanhas com horário definido)
    if (campaign.start_time && campaign.end_time && (status === 'ativo' || status === 'active')) {
      const now = new Date();
      const currentTime = now.toTimeString().substring(0, 5); // HH:MM
      
      // Se tem horário definido e está fora do horário, mostrar indicador
      if (currentTime < campaign.start_time || currentTime > campaign.end_time) {
        return (
          <div className="flex flex-col space-y-1">
            <Badge className="bg-orange-500 text-white">Ativa (Fora do horário)</Badge>
            <span className="text-xs text-gray-500">Horário: {formatTime(campaign.start_time)} - {formatTime(campaign.end_time)}</span>
          </div>
        );
      }
    }

    switch (status) {
      case 'ativo':
      case 'active':
        return <Badge className="bg-green-500 text-white">Ativa</Badge>;
      case 'agendado':
      case 'scheduled':
        return <Badge className="bg-yellow-500 text-white">Agendada</Badge>;
      case 'pausado':
      case 'paused':
        return <Badge className="bg-red-500 text-white">Pausada</Badge>;
      case 'pendente':
        return <Badge className="bg-blue-500 text-white">Pendente</Badge>;
      case 'finalizado':
      case 'completed':
        return <Badge className="bg-blue-500 text-white">Finalizada</Badge>;
      case 'expirado':
      case 'expired':
        return <Badge className="bg-blue-500 text-white">Expirada</Badge>;
      case 'cancelado':
      case 'cancelled':
        return <Badge className="bg-blue-500 text-white">Cancelada</Badge>;
      case 'rascunho':
      case 'draft':
        return <Badge className="bg-blue-500 text-white">Rascunho</Badge>;
      default:
        return <Badge className="bg-blue-500 text-white">{status}</Badge>;
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

  const formatDaysOfWeek = (days: number[]): string => {
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    if (!days || days.length === 0) return '';
    return days.sort().map(day => dayNames[day]).join(', ');
  };


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
    // Aguardar um pouco antes de recarregar para evitar conflitos
    setTimeout(() => {
      if (!isLoadingData) {
        loadCampaigns();
      }
    }, 1000);
  };

  const handleViewCampaign = (campaignId: string) => {
    navigate(`/anunciante/campanhas/${campaignId}`);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    console.log('📝 [MY CAMPAIGNS] Abrindo modal de edição para campanha:', campaign);
    setSelectedCampaign(campaign);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    console.log('✅ [MY CAMPAIGNS] Edição bem-sucedida, fechando modal e recarregando...');
    setShowEditModal(false);
    setSelectedCampaign(null);
    
    // ✅ CORREÇÃO CRÍTICA: Forçar reload imediato dos dados
    console.log('🔄 [MY CAMPAIGNS] Forçando reload das campanhas...');
    setIsLoadingData(true);
    loadCampaigns().finally(() => {
      console.log('✅ [MY CAMPAIGNS] Campanhas recarregadas com sucesso');
    });
  };

  // 🔧 CORREÇÃO 4: Função para atualizar campanha com refresh forçado
  const handleCampaignUpdate = async (campaignId: string, updates: any) => {
    try {
      console.log('📝 [MY CAMPAIGNS] Atualizando campanha:', campaignId, updates);
      
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) {
        toast.error('Campanha não encontrada');
        return false;
      }

      // Determinar a tabela correta
      const tableName = campaign.is_advanced ? 'campaigns_advanced' : 'campanhas';
      console.log('🎯 [MY CAMPAIGNS] Usando tabela:', tableName);

      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', campaignId);

      if (error) {
        console.error('❌ [MY CAMPAIGNS] Erro na atualização:', error);
        toast.error('Erro ao atualizar campanha');
        return false;
      }

      console.log('✅ [MY CAMPAIGNS] Campanha atualizada com sucesso!');
      
      // 🔧 CORREÇÃO 5: Forçar reload dos dados após atualização
      setTimeout(() => {
        console.log('🔄 [MY CAMPAIGNS] Forçando reload após atualização...');
        if (!isLoadingData) {
          loadCampaigns();
        }
      }, 500);

      return true;
    } catch (error) {
      console.error('💥 [MY CAMPAIGNS] Erro inesperado:', error);
      toast.error('Erro inesperado ao atualizar campanha');
      return false;
    }
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
        <div className="flex space-x-2">
          <Button 
            onClick={loadCampaigns} 
            variant="outline"
            className="flex items-center"
          >
            <Monitor className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleCreateCampaign} className="bg-indexa-purple hover:bg-indexa-purple/90">
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </div>
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
                  {getStatusBadge(campaign)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(campaign.data_inicio)} - {formatDate(campaign.data_fim)}
                </div>
                
                 {campaign.start_time && campaign.end_time && (
                   <div className="flex items-center text-sm text-gray-600">
                     <Calendar className="h-4 w-4 mr-2" />
                     {formatTime(campaign.start_time)} - {formatTime(campaign.end_time)}
                   </div>
                 )}

                {campaign.buildings_names && campaign.buildings_names.length > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="h-4 w-4 mr-2" />
                    {campaign.buildings_names.join(', ')}
                  </div>
                )}

                {campaign.days_of_week && campaign.days_of_week.length > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDaysOfWeek(campaign.days_of_week)}
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
                    onClick={() => handleViewCampaign(campaign.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditCampaign(campaign)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
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

      {/* Modal de Edição */}
      {selectedCampaign && (
        <CampaignEditModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          campaign={selectedCampaign}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default MyCampaigns;
