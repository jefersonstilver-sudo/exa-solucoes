
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Play, User, Calendar, DollarSign, Eye, ExternalLink } from 'lucide-react';
import { useBuildingActiveCampaigns } from '@/hooks/useBuildingActiveCampaigns';

interface BuildingActiveCampaignsTabProps {
  buildingId: string;
  buildingName: string;
}

const BuildingActiveCampaignsTab: React.FC<BuildingActiveCampaignsTabProps> = ({
  buildingId,
  buildingName
}) => {
  const { campaigns, loading, error, refetch } = useBuildingActiveCampaigns(buildingId);

  console.log('🎬 [CAMPAIGNS TAB] Renderizando para prédio:', buildingName, {
    buildingId,
    campaignsCount: campaigns.length,
    loading
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'ativo': { color: 'bg-green-500', label: '✅ Ativo' },
      'video_aprovado': { color: 'bg-blue-500', label: '👍 Vídeo Aprovado' },
      'pago_pendente_video': { color: 'bg-yellow-500', label: '⏳ Aguardando Vídeo' },
      'video_enviado': { color: 'bg-purple-500', label: '📤 Vídeo Enviado' }
    };

    const config = statusMap[status as keyof typeof statusMap] || { color: 'bg-gray-500', label: status };
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const getVideoStatusBadge = (video: any) => {
    if (video.selected_for_display && video.is_active) {
      return <Badge className="bg-green-500 text-white">🎥 Em Exibição</Badge>;
    } else if (video.approval_status === 'approved' && video.is_active) {
      return <Badge className="bg-blue-500 text-white">✅ Aprovado</Badge>;
    } else if (video.approval_status === 'rejected') {
      return <Badge className="bg-red-500 text-white">❌ Rejeitado</Badge>;
    } else if (video.approval_status === 'pending') {
      return <Badge className="bg-yellow-500 text-white">⏳ Pendente</Badge>;
    } else {
      return <Badge variant="outline">📴 Inativo</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não definida';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDaysRemaining = (endDate: string) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando programação...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">Erro ao carregar programação: {error}</p>
            <Button onClick={refetch} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <Video className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma Programação Ativa</h3>
            <p className="text-gray-500">
              Este prédio não possui vídeos programados no momento.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Programação em {buildingName}
          </h3>
          <p className="text-sm text-gray-600">
            Lista de vídeos atualmente programados e em exibição para este prédio.
          </p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {campaigns.map((campaign) => {
          const daysRemaining = getDaysRemaining(campaign.data_fim);
          const totalVideos = campaign.videos.length;
          const activeVideos = campaign.videos.filter(v => v.is_active).length;
          const displayingVideos = campaign.videos.filter(v => v.selected_for_display && v.is_active).length;

          return (
            <Card key={campaign.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{campaign.client_name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4" />
                      {campaign.client_email}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(campaign.status)}
                    {daysRemaining !== null && (
                      <Badge variant={daysRemaining <= 7 ? "destructive" : "outline"}>
                        {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Expirado'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Informações do Pedido */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Valor Total</p>
                      <p className="font-medium">R$ {campaign.valor_total.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Período</p>
                      <p className="font-medium text-sm">
                        {formatDate(campaign.data_inicio)} - {formatDate(campaign.data_fim)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Vídeos</p>
                      <p className="font-medium">
                        {displayingVideos} em exibição / {totalVideos} total
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lista de Vídeos */}
                {campaign.videos.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Vídeos da Campanha:</h4>
                    {campaign.videos.map((video, index) => (
                      <div key={video.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Play className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{video.nome}</p>
                            <p className="text-sm text-gray-600">Slot {video.slot_position}</p>
                            {video.rejection_reason && (
                              <p className="text-xs text-red-600 mt-1">
                                Motivo da rejeição: {video.rejection_reason}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getVideoStatusBadge(video)}
                          {video.url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(video.url, '_blank')}
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ver
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BuildingActiveCampaignsTab;
