
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCampaignDetails } from '@/hooks/campaigns/useCampaignDetails';
import { Loader2, ArrowLeft, Calendar, Monitor, Play, Eye, Edit, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import CampaignEditForm from '@/components/campaigns/CampaignEditForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CampaignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, isLoading: authLoading } = useAuth();
  const { campaign, panels, videos, order, isAdvanced, loading, error, updateCampaign } = useCampaignDetails(id);
  const [showEditForm, setShowEditForm] = useState(false);
  
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-indexa-purple" />
        <p className="ml-2 text-lg">Carregando detalhes da campanha...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/anunciante/campanhas')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <Play className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium mb-2">Campanha não encontrada</h3>
            <p className="text-gray-500 mb-6">
              {error || 'A campanha solicitada não foi encontrada ou você não tem permissão para visualizá-la.'}
            </p>
            <Button onClick={() => navigate('/anunciante/campanhas')}>
              Voltar para Campanhas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
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
      case 'finalizado':
      case 'completed':
        return <Badge className="bg-blue-500 text-white">Finalizada</Badge>;
      case 'cancelado':
      case 'cancelled':
        return <Badge className="bg-blue-500 text-white">Cancelada</Badge>;
      default:
        return <Badge className="bg-blue-500 text-white">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      // Se for uma string de data, garantir que seja tratada corretamente
      const date = new Date(dateString + 'T00:00:00');
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const campaignName = campaign.name || `Campanha #${campaign.id.substring(0, 8)}`;
  const startDate = campaign.start_date || campaign.data_inicio;
  const endDate = campaign.end_date || campaign.data_fim;
  const description = campaign.description || campaign.obs;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/anunciante/campanhas')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{campaignName}</h1>
            <p className="text-gray-600 mt-1">
              {isAdvanced ? 'Campanha Avançada' : 'Campanha'} • ID: {campaign.id.substring(0, 8)}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowEditForm(true)} className="flex items-center">
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Status da Campanha</span>
            {getStatusBadge(campaign.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium">Período</p>
                <p className="text-sm text-gray-600">
                  {startDate && endDate 
                    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                    : 'Período não definido'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Monitor className="h-8 w-8 text-purple-500" />
              <div>
                <p className="font-medium">Painéis</p>
                <p className="text-sm text-gray-600">
                  {panels.length} {panels.length === 1 ? 'painel' : 'painéis'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Play className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-medium">Vídeos</p>
                <p className="text-sm text-gray-600">
                  {videos.length} {videos.length === 1 ? 'vídeo' : 'vídeos'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description Card */}
      {description && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isAdvanced ? 'Descrição' : 'Observações'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{description}</p>
          </CardContent>
        </Card>
      )}

      {/* Panels Card */}
      {panels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Painéis da Campanha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {panels.map((panel) => (
                <div key={panel.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{panel.code}</h4>
                    <Badge variant={panel.status === 'online' ? 'default' : 'secondary'}>
                      {panel.status}
                    </Badge>
                  </div>
                  {panel.buildings && (
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {panel.buildings.nome}
                      </div>
                      <p className="text-xs text-gray-500">
                        {panel.buildings.endereco}, {panel.buildings.bairro}
                      </p>
                      <p className="text-xs text-gray-500">
                        {panel.buildings.quantidade_telas} painéis no prédio
                      </p>
                    </div>
                  )}
                  {panel.resolucao && (
                    <p className="text-sm text-gray-500 mt-1">
                      Resolução: {panel.resolucao}
                    </p>
                  )}
                  {panel.localizacao && (
                    <p className="text-sm text-gray-500">
                      Local: {panel.localizacao}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Videos Card */}
      {videos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Play className="h-5 w-5 mr-2" />
              Vídeos da Campanha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((video) => (
                <div key={video.id} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    {/* Video Preview */}
                    {video.videos?.url && (
                      <div className="flex-shrink-0">
                        <video 
                          className="w-24 h-16 object-cover rounded border"
                          src={video.videos.url}
                          preload="metadata"
                          muted
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">
                        {video.videos?.nome || video.nome || 'Vídeo sem nome'}
                      </h4>
                      <div className="space-y-1">
                        {video.videos?.duracao && (
                          <p className="text-sm text-gray-600">
                            Duração: {Math.floor(video.videos.duracao / 60)}:{(video.videos.duracao % 60).toString().padStart(2, '0')}
                          </p>
                        )}
                        {video.videos?.orientacao && (
                          <p className="text-sm text-gray-600">
                            Orientação: {video.videos.orientacao}
                          </p>
                        )}
                        {video.videos?.largura && video.videos?.altura && (
                          <p className="text-sm text-gray-600">
                            Resolução: {video.videos.largura}x{video.videos.altura}
                          </p>
                        )}
                        {video.videos?.formato && (
                          <p className="text-sm text-gray-600">
                            Formato: {video.videos.formato.toUpperCase()}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        {video.is_active && (
                          <Badge className="bg-green-500 text-white">
                            Ativo
                          </Badge>
                        )}
                        {video.selected_for_display && (
                          <Badge className="bg-blue-500 text-white">
                            Em Exibição
                          </Badge>
                        )}
                        {video.videos?.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(video.videos.url, '_blank')}
                            className="flex items-center"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Vídeo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      {campaign && (
        <CampaignEditForm
          open={showEditForm}
          onOpenChange={setShowEditForm}
          campaign={campaign}
          onUpdate={updateCampaign}
          isAdvanced={isAdvanced}
        />
      )}
    </div>
  );
};

export default CampaignDetails;
