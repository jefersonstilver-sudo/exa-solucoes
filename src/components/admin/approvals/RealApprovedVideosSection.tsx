import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Play, User, RefreshCw, Eye, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PeriodSelector from './PeriodSelector';
import VideoStatusIndicator from './VideoStatusIndicator';
import VideoAdminActions from './VideoAdminActions';
import { VideoPlayer } from '@/components/video-management/VideoPlayer';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';

interface ApprovedVideo {
  pedido_video_id: string;
  video_id: string;
  video_name: string;
  video_url?: string;
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
        video_url: item.video_url || undefined,
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
        return { video_id: video.video_id, status: data };
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
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loadingVideos || loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground text-sm">
            {statusLoading ? 'Carregando status...' : 'Carregando vídeos aprovados...'}
          </span>
        </div>
      </div>
    );
  }

  const renderVideoCard = (video: ApprovedVideo) => (
    <div
      key={video.pedido_video_id}
      className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'}`}>
        {/* Video Preview */}
        <div className={`${isMobile ? 'w-full' : 'w-[280px] min-w-[280px]'} bg-black/5`}>
          {video.video_url ? (
            <VideoPlayer
              src={video.video_url}
              title={video.video_name}
              className={`${isMobile ? 'aspect-video' : 'h-full min-h-[180px]'}`}
              muted
              controls
            />
          ) : (
            <div className={`flex items-center justify-center ${isMobile ? 'aspect-video' : 'h-full min-h-[180px]'} bg-muted/30`}>
              <div className="text-center">
                <Play className="h-8 w-8 mx-auto text-muted-foreground/40 mb-1" />
                <span className="text-xs text-muted-foreground/60">Sem preview</span>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-4 flex flex-col justify-between gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {video.video_name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">
                  Slot {video.slot_position}
                </Badge>
                {video.status && <VideoStatusIndicator status={video.status} />}
              </div>
            </div>
            <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
              {formatCurrency(video.valor_total)}
            </span>
          </div>

          {/* Details Grid */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-x-6 gap-y-1.5 text-xs text-muted-foreground`}>
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{video.client_name?.split('@')[0] || video.client_email?.split('@')[0]}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
              <span className="truncate">Por: {video.approver_name?.split('@')[0]}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>{video.plano_meses} meses</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>Aprovado: {formatDate(video.approved_at)}</span>
            </div>
            {video.data_inicio && video.data_fim && (
              <div className="flex items-center gap-1.5 col-span-2">
                <DollarSign className="h-3 w-3 shrink-0" />
                <span>Exibição: {formatDate(video.data_inicio)} → {formatDate(video.data_fim)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] px-2.5"
              onClick={() => window.open(`/admin/video-preview/${video.video_id}`, '_blank')}
            >
              <Eye className="h-3 w-3 mr-1" />
              Visualizar
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
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-3 shadow-sm">
        <PeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomStartDateChange={setCustomStartDate}
          onCustomEndDateChange={setCustomEndDate}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-foreground">
            Aprovados ({approvedVideos.length})
          </span>
        </div>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => fetchApprovedVideos()}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Atualizar
        </Button>
      </div>

      {/* Videos */}
      {approvedVideos.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-10 text-center shadow-sm">
          <CheckCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="text-sm font-medium text-foreground mb-1">Nenhum vídeo aprovado</h3>
          <p className="text-xs text-muted-foreground">Selecione um período diferente</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {approvedVideos.map(renderVideoCard)}
        </div>
      )}
    </div>
  );
};

export default RealApprovedVideosSection;
