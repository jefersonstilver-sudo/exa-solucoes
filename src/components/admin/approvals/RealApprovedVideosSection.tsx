import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Play, User, RefreshCw, Download, Eye, UserCheck, Shield, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PeriodSelector from './PeriodSelector';
import VideoStatusIndicator from './VideoStatusIndicator';
import VideoAdminActions from './VideoAdminActions';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';

interface ApprovedVideo {
  pedido_video_id: string;
  video_id: string;
  video_name: string;
  slot_position: number;
  approved_at: string;
  pedido_id: string;
  client_id: string;
  client_email: string;
  client_name: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio: string;
  data_fim: string;
  approved_by: string;
  approver_email: string;
  approver_name: string;
  created_at: string;
  status?: {
    video_id: string;
    pedido_video_id: string;
    pedido_id: string;
    is_displaying: boolean;
    is_base_video: boolean;
    is_scheduled: boolean;
    schedule_active_now: boolean;
    is_blocked: boolean;
    is_active: boolean;
    primary_status: string;
  };
}

interface RealApprovedVideosSectionProps {
  loading: boolean;
  onRefresh: () => void;
}

const RealApprovedVideosSection: React.FC<RealApprovedVideosSectionProps> = ({ loading, onRefresh }) => {
  const [approvedVideos, setApprovedVideos] = useState<ApprovedVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const { isMobile } = useAdvancedResponsive();
  
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  const fetchApprovedVideos = async () => {
    try {
      setLoadingVideos(true);
      
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      if (selectedPeriod === 'custom') {
        if (customStartDate && customEndDate) {
          startDate = customStartDate.toISOString().split('T')[0];
          endDate = customEndDate.toISOString().split('T')[0];
        } else {
          toast.error('Por favor, selecione as datas de início e fim');
          return;
        }
      } else {
        const [year, month] = selectedPeriod.split('-').map(Number);
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0);
        
        startDate = monthStart.toISOString().split('T')[0];
        endDate = monthEnd.toISOString().split('T')[0];
      }
      
      const { data, error } = await supabase.rpc('get_approved_videos_by_period', {
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) {
        console.error('Erro ao buscar vídeos aprovados:', error);
        if (error.message.includes('Access denied')) {
          toast.error('Acesso negado: Apenas super admins podem visualizar esta seção');
        } else {
          toast.error('Erro ao carregar vídeos aprovados');
        }
        return;
      }

      if (!data || data.length === 0) {
        setApprovedVideos([]);
        return;
      }

      const mappedVideos: ApprovedVideo[] = data.map((item: any) => ({
        pedido_video_id: item.pedido_video_id,
        video_id: item.video_id,
        video_name: item.video_name || 'Vídeo sem nome',
        slot_position: item.slot_position,
        approved_at: item.approved_at,
        pedido_id: item.pedido_id,
        client_id: item.client_id,
        client_email: item.client_email,
        client_name: item.client_name,
        valor_total: item.valor_total,
        lista_paineis: item.lista_paineis || [],
        plano_meses: item.plano_meses,
        data_inicio: item.data_inicio,
        data_fim: item.data_fim,
        approved_by: item.approved_by,
        approver_email: item.approver_email,
        approver_name: item.approver_name,
        created_at: item.created_at,
      }));

      setApprovedVideos(mappedVideos);
      await fetchVideoStatuses(mappedVideos);
    } catch (error) {
      console.error('Erro geral ao buscar vídeos aprovados:', error);
      toast.error('Erro ao carregar vídeos aprovados');
    } finally {
      setLoadingVideos(false);
    }
  };

  const fetchVideoStatuses = async (videos: ApprovedVideo[]) => {
    try {
      setStatusLoading(true);
      
      const statusPromises = videos.map(async (video) => {
        const { data, error } = await supabase.rpc('get_video_current_status', {
          p_video_id: video.video_id
        });
        
        if (error) {
          console.error(`Erro ao buscar status do vídeo ${video.video_id}:`, error);
          return null;
        }
        
        return {
          video_id: video.video_id,
          status: data
        };
      });
      
      const statuses = await Promise.all(statusPromises);
      
      const videosWithStatus = videos.map(video => {
        const statusData = statuses.find(s => s?.video_id === video.video_id);
        const status = statusData?.status;
        
        return {
          ...video,
          status: status && typeof status === 'object' && !Array.isArray(status) ? {
            video_id: String(status.video_id || ''),
            pedido_video_id: String(status.pedido_video_id || ''),
            pedido_id: String(status.pedido_id || ''),
            is_displaying: Boolean(status.is_displaying),
            is_base_video: Boolean(status.is_base_video),
            is_scheduled: Boolean(status.is_scheduled),
            schedule_active_now: Boolean(status.schedule_active_now),
            is_blocked: Boolean(status.is_blocked),
            is_active: Boolean(status.is_active),
            primary_status: String(status.primary_status || 'standby')
          } : undefined
        };
      });
      
      setApprovedVideos(videosWithStatus);
    } catch (error) {
      console.error('Erro ao buscar status dos vídeos:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedVideos();
  }, [selectedPeriod, customStartDate, customEndDate]);

  const handleActionComplete = () => {
    fetchApprovedVideos();
    onRefresh();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loadingVideos || loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-3 text-foreground text-sm">
            {statusLoading ? 'Carregando status...' : 'Carregando vídeos aprovados...'}
          </span>
        </div>
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Period Selector - Compact */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-2 shadow-sm">
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomStartDateChange={setCustomStartDate}
            onCustomEndDateChange={setCustomEndDate}
          />
        </div>

        {approvedVideos.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-6 text-center shadow-sm">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="text-sm font-medium text-foreground mb-1">
              Nenhum vídeo aprovado
            </h3>
            <p className="text-xs text-muted-foreground">
              Selecione um período diferente
            </p>
          </div>
        ) : (
          approvedVideos.map((video) => (
            <div 
              key={video.pedido_video_id} 
              className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-3 shadow-sm space-y-2"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Play className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                    {video.video_name}
                  </span>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5">
                  Slot {video.slot_position}
                </Badge>
              </div>

              {/* Client & Value */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  {video.client_name?.split('@')[0] || video.client_email?.split('@')[0]}
                </span>
                <span className="text-emerald-600 font-semibold">{formatCurrency(video.valor_total)}</span>
              </div>

              {/* Approval Info */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  Por: {video.approver_name?.split('@')[0]}
                </span>
                <span>{formatDateShort(video.approved_at)}</span>
              </div>

              {/* Status */}
              {video.status && (
                <div className="pt-1">
                  <VideoStatusIndicator status={video.status} />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-[10px]"
                  onClick={() => {
                    window.open(`/admin/video-preview/${video.video_id}`, '_blank');
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Button>
                
                {video.status && (
                  <VideoAdminActions
                    video={{
                      pedido_video_id: video.pedido_video_id,
                      video_id: video.video_id,
                      video_name: video.video_name,
                      pedido_id: video.pedido_id
                    }}
                    status={video.status}
                    onActionComplete={handleActionComplete}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-6">
      <PeriodSelector
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomStartDateChange={setCustomStartDate}
        onCustomEndDateChange={setCustomEndDate}
      />
      
      <Card className="bg-card border">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center text-foreground">
            <Shield className="h-5 w-5 mr-2 text-emerald-600" />
            Vídeos Aprovados no Período ({approvedVideos.length})
            <Badge variant="outline" className="ml-2">
              Auditoria Segura
            </Badge>
          </CardTitle>
          <CardDescription>
            Lista de vídeos aprovados no período selecionado com trilha de auditoria completa
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {approvedVideos.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum vídeo aprovado no período selecionado
              </h3>
              <p className="text-muted-foreground">
                Selecione um período diferente ou aguarde novos vídeos aprovados
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {approvedVideos.map((video) => (
                <Card key={video.pedido_video_id} className="bg-card border hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-foreground flex items-center gap-2">
                          <Play className="h-5 w-5 text-emerald-600" />
                          {video.video_name}
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Slot {video.slot_position}
                          </Badge>
                        </CardTitle>
                        
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Cliente:</span>
                              <span className="text-foreground">{video.client_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">@</span>
                              <span>{video.client_email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                              <span className="font-medium">Aprovado por:</span>
                              <span className="text-foreground">{video.approver_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">@</span>
                              <span>{video.approver_email}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Valor:</span>
                              <span className="text-foreground">{formatCurrency(video.valor_total)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Período:</span>
                              <span className="text-foreground">{video.plano_meses} meses</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Aprovado em:</span>
                              <span className="text-foreground">{formatDate(video.approved_at)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {video.data_inicio && video.data_fim && (
                          <div className="mt-3 p-3 bg-muted/30 border rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-foreground">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">Período de Exibição:</span>
                              <span>{formatDate(video.data_inicio)} até {formatDate(video.data_fim)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-4 ml-4">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Status Atual
                          </span>
                          {video.status ? (
                            <VideoStatusIndicator status={video.status} />
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Carregando status...
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Visualização
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-background text-foreground border hover:bg-accent"
                            onClick={() => {
                              window.open(`/admin/video-preview/${video.video_id}`, '_blank');
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-background text-foreground border hover:bg-accent"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = `/admin/download-video/${video.video_id}`;
                              link.download = `${video.video_name}.mp4`;
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Ações Admin
                          </span>
                          {video.status && (
                            <VideoAdminActions
                              video={{
                                pedido_video_id: video.pedido_video_id,
                                video_id: video.video_id,
                                video_name: video.video_name,
                                pedido_id: video.pedido_id
                              }}
                              status={video.status}
                              onActionComplete={handleActionComplete}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealApprovedVideosSection;
