
import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Play, User, Calendar, DollarSign, Eye, ExternalLink, TvMinimal, Sparkles } from 'lucide-react';
import { useBuildingActiveCampaigns } from '@/hooks/useBuildingActiveCampaigns';
import { useBuildingActiveVideos } from '@/hooks/useBuildingActiveVideos';
import { VideoScheduleTooltip } from '../VideoScheduleTooltip';
import ModernSkeleton from '@/components/ui/ModernSkeleton';

interface BuildingActiveCampaignsTabProps {
  buildingId: string;
  buildingName: string;
}

const BuildingActiveCampaignsTab: React.FC<BuildingActiveCampaignsTabProps> = ({
  buildingId,
  buildingName
}) => {
  const { campaigns, loading, error, refetch } = useBuildingActiveCampaigns(buildingId);
  const { videos: activeVideos, loading: videosLoading } = useBuildingActiveVideos(buildingId);

  console.log('🎬 [CAMPAIGNS TAB] Renderizando para prédio:', buildingName, {
    buildingId,
    campaignsCount: campaigns.length,
    loading
  });

  // ⚡ OTIMIZAÇÃO: Memoizar funções auxiliares
  const getStatusBadge = useCallback((status: string) => {
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
  }, []);

  const getVideoStatusBadge = useCallback((video: any) => {
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
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return 'Data não definida';
    return new Date(dateString).toLocaleDateString('pt-BR');
  }, []);

  const getDaysRemaining = useCallback((endDate: string) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  // ⚡ OTIMIZAÇÃO: Skeleton Loading para melhor UX
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <ModernSkeleton variant="text" className="h-6 w-64" />
            <ModernSkeleton variant="text" className="h-4 w-96" />
          </div>
          <ModernSkeleton variant="button" />
        </div>

        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <ModernSkeleton variant="text" className="h-5 w-48" />
                    <ModernSkeleton variant="text" className="h-4 w-64" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <ModernSkeleton variant="button" className="w-32" />
                    <ModernSkeleton variant="button" className="w-28" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg mb-4">
                  <ModernSkeleton variant="text" className="h-12" />
                  <ModernSkeleton variant="text" className="h-12" />
                  <ModernSkeleton variant="text" className="h-12" />
                </div>
                <ModernSkeleton variant="card" className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
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

  // ⚡ OTIMIZAÇÃO: Memoizar dados processados
  const processedCampaigns = useMemo(() => {
    return campaigns.map((campaign) => ({
      ...campaign,
      daysRemaining: getDaysRemaining(campaign.data_fim),
      totalVideos: campaign.videos.length,
      activeVideos: campaign.videos.filter(v => v.is_active).length,
      displayingVideos: campaign.videos.filter(v => v.selected_for_display && v.is_active).length,
      videosToShow: campaign.videos.filter(v => v.selected_for_display && v.is_active)
    }));
  }, [campaigns, getDaysRemaining]);

  // Estatísticas dos vídeos ativos
  const stats = useMemo(() => {
    const total = activeVideos.length;
    const scheduled = activeVideos.filter(v => v.is_scheduled).length;
    const base = activeVideos.filter(v => !v.is_scheduled).length;
    const activeNow = activeVideos.filter(v => v.is_currently_active).length;
    const totalCampaigns = new Set(activeVideos.map(v => v.pedido_id)).size;
    const totalClients = new Set(activeVideos.map(v => v.client_email)).size;
    const totalValue = activeVideos.reduce((sum, v) => sum + v.valor_total, 0);
    
    return { total, scheduled, base, activeNow, totalCampaigns, totalClients, totalValue };
  }, [activeVideos]);

  return (
    <div className="space-y-6">
      {/* Seção de Vídeos em Exibição AGORA */}
      {activeVideos.length > 0 && (
        <Card className="border-green-500 border-2 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TvMinimal className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Vídeos em Exibição</CardTitle>
                  <CardDescription>Playlist atual rodando nas telas deste prédio</CardDescription>
                </div>
              </div>
              <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                🎬 {stats.total} vídeos
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Campanhas</p>
                      <p className="text-2xl font-bold text-green-600">{stats.totalCampaigns}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Clientes</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalClients}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Total</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalValue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">No AR Agora</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.activeNow}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Badges de Tipo */}
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-white">
                📺 Base: {stats.base}
              </Badge>
              <Badge variant="outline" className="bg-white">
                ⏰ Agendados: {stats.scheduled}
              </Badge>
            </div>

            {/* Lista de Vídeos */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-700">Playlist Completa ({stats.total} vídeos):</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {activeVideos.map((video, index) => (
                  <VideoScheduleTooltip
                    key={video.video_id}
                    scheduleRules={video.schedule_rules}
                    isCurrentlyActive={video.is_currently_active || false}
                  >
                    <Card className={`transition-all hover:shadow-md cursor-help ${
                      video.is_currently_active ? 'border-green-400 bg-green-50' : 'bg-white'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {index + 1}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">{video.video_name}</p>
                                {video.is_currently_active ? (
                                  <Badge className="bg-green-500 text-white">🟢 No AR agora</Badge>
                                ) : video.is_scheduled ? (
                                  <Badge variant="outline" className="border-yellow-500 text-yellow-700">⏸️ Agendado</Badge>
                                ) : (
                                  <Badge variant="secondary">🎯 Base</Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {video.client_name}
                                </span>
                                <span>•</span>
                                <span>Slot {video.slot_position}</span>
                                <span>•</span>
                                <span>{video.video_duracao}s</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {video.video_url && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(video.video_url, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </VideoScheduleTooltip>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção de Campanhas (mantida como estava) */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Todas as Campanhas em {buildingName}
          </h3>
          <p className="text-sm text-gray-600">
            Lista detalhada de todos os pedidos e campanhas deste prédio.
          </p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {processedCampaigns.map((campaign) => {
          const { daysRemaining, totalVideos, displayingVideos, videosToShow } = campaign;

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
                {videosToShow.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Vídeo em Exibição:</h4>
                    {videosToShow.map((video) => (
                        <div key={video.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Play className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{video.nome}</p>
                              <p className="text-sm text-gray-600">Slot {video.slot_position}</p>
                              {video.rejection_reason && (
                                <p className="text-xs text-red-600 mt-1">Motivo da rejeição: {video.rejection_reason}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getVideoStatusBadge(video)}
                            {video.url && (
                              <Button size="sm" variant="outline" onClick={() => window.open(video.url, '_blank')} className="flex items-center gap-1">
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
