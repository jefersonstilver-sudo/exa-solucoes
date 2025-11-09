
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Play, User, DollarSign, TvMinimal, Sparkles, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
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
  const { videos: activeVideos, loading, refetch } = useBuildingActiveVideos(buildingId);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  // Estatísticas dos vídeos
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

  const selectedVideo = activeVideos[selectedVideoIndex];

  // Loading
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <ModernSkeleton variant="card" className="h-96" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sem vídeos
  if (activeVideos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-6 bg-gray-100 rounded-full">
                <Video className="h-16 w-16 text-gray-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Nenhum Vídeo em Exibição</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Este prédio não possui vídeos ativos no momento. Para que vídeos apareçam aqui, é necessário:
            </p>
            <ul className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Ter pedidos <strong>ativos</strong> associados a este prédio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Vídeos com status <strong>aprovado</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Vídeos selecionados para <strong>exibição</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Dentro do <strong>período de veiculação</strong></span>
              </li>
            </ul>
            <Button onClick={refetch} variant="outline" className="mt-4">
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-lg">
                <TvMinimal className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Programação em Exibição</CardTitle>
                <CardDescription>Vídeos rodando nas telas deste prédio agora</CardDescription>
              </div>
            </div>
            <Badge className="bg-green-500 text-white text-lg px-4 py-2">
              🎬 {stats.total} vídeos
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Estatísticas em cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card className="bg-white shadow-sm">
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
            
            <Card className="bg-white shadow-sm">
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
            
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="text-base font-bold text-emerald-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalValue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm">
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

          {/* Badges de tipo */}
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-white">
              📺 Base: {stats.base}
            </Badge>
            <Badge variant="outline" className="bg-white">
              ⏰ Agendados: {stats.scheduled}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Player de Vídeo */}
      {selectedVideo && (
        <Card className="border-2 border-primary">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Preview da Programação
                </CardTitle>
                <CardDescription>
                  Vídeo {selectedVideoIndex + 1} de {stats.total}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedVideoIndex(Math.max(0, selectedVideoIndex - 1))}
                  disabled={selectedVideoIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedVideoIndex(Math.min(stats.total - 1, selectedVideoIndex + 1))}
                  disabled={selectedVideoIndex === stats.total - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Player */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  key={selectedVideo.video_url}
                  src={selectedVideo.video_url}
                  controls
                  className="w-full h-full"
                  autoPlay
                >
                  Seu navegador não suporta vídeo.
                </video>
              </div>

              {/* Informações do vídeo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Nome do Vídeo</p>
                    <p className="text-lg font-bold">{selectedVideo.video_name}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedVideo.is_currently_active ? (
                      <Badge className="bg-green-500 text-white">🟢 No AR Agora</Badge>
                    ) : selectedVideo.is_scheduled ? (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">⏸️ Agendado</Badge>
                    ) : (
                      <Badge variant="secondary">🎯 Base</Badge>
                    )}
                    
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {selectedVideo.video_duracao}s
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Cliente</p>
                    <p className="text-base font-medium">{selectedVideo.client_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedVideo.client_email}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Posição na Playlist</p>
                    <p className="text-base font-medium">Slot {selectedVideo.slot_position}</p>
                  </div>
                </div>
              </div>

              {/* Schedule info */}
              {selectedVideo.schedule_rules && selectedVideo.schedule_rules.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">📅 Agendamento:</p>
                    <div className="space-y-2 text-sm text-blue-800">
                      {selectedVideo.schedule_rules.map((rule, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span>•</span>
                          <span>
                            {rule.days_of_week.length === 7 ? 'Todos os dias' : 
                             rule.days_of_week.map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]).join(', ')}
                            {rule.is_all_day ? ' (o dia todo)' : ` (${rule.start_time.slice(0, 5)} - ${rule.end_time.slice(0, 5)})`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista completa de vídeos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Playlist Completa ({stats.total} vídeos)
          </CardTitle>
          <CardDescription>
            Sequência de vídeos em exibição nas telas
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {activeVideos.map((video, index) => (
              <VideoScheduleTooltip
                key={video.video_id}
                scheduleRules={video.schedule_rules}
                isCurrentlyActive={video.is_currently_active || false}
              >
                <Card 
                  className={`transition-all cursor-pointer hover:shadow-md ${
                    video.is_currently_active ? 'border-green-400 bg-green-50' : 
                    index === selectedVideoIndex ? 'border-primary bg-primary/5' : 
                    'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedVideoIndex(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{video.video_name}</p>
                            {video.is_currently_active && (
                              <Badge className="bg-green-500 text-white text-xs">🟢 No AR</Badge>
                            )}
                            {video.is_scheduled && !video.is_currently_active && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-700 text-xs">⏰</Badge>
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
                      
                      {index === selectedVideoIndex && (
                        <Badge variant="default">▶ Tocando</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </VideoScheduleTooltip>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuildingActiveCampaignsTab;
