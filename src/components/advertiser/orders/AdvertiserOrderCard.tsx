import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Repeat, Monitor, Smartphone } from 'lucide-react';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { useOrderCurrentVideoData } from '@/hooks/useOrderCurrentVideoData';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface AdvertiserOrderCardProps {
  item: any;
  isMobile: boolean;
  onNavigate: (id: string) => void;
  onDelete: (id: string, type: 'order' | 'attempt') => void;
  onFinalize: (id: string) => void;
  isProcessingAttempt: boolean;
  isGeneratingPix: boolean;
  handleGeneratePix: (orderId: string) => void;
  handleStripePayment: (orderId: string) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR');

export const AdvertiserOrderCard: React.FC<AdvertiserOrderCardProps> = ({
  item,
  isMobile,
  onNavigate,
  onDelete,
  onFinalize,
  isProcessingAttempt,
  isGeneratingPix,
  handleGeneratePix,
  handleStripePayment,
}) => {
  const statusInfo = useOrderStatus(item, handleGeneratePix, handleStripePayment);
  const StatusIcon = statusInfo.icon;
  const painelsList = item.type === 'order' ? item.lista_paineis || [] : item.predios_selecionados || [];

  // Video slot usage
  const usedSlots = item.videos?.length || 0;
  const totalSlots = 10;
  const slotPercent = (usedSlots / totalSlots) * 100;

  const canDelete = item.type === 'attempt' ||
    (item.type === 'order' && ['pendente', 'cancelado'].includes(item.status));

  // Show video preview for active orders
  const showVideoPreview = item.type === 'order';
  const { videoData, loading: videoLoading } = useOrderCurrentVideoData(
    showVideoPreview ? item.id : ''
  );

  // Lazy loading via IntersectionObserver
  const { isVisible, elementRef } = useIntersectionObserver({ threshold: 0.1, triggerOnce: false });
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isVisible && videoData?.videoUrl) {
      if (!videoRef.current.src || videoRef.current.src !== videoData.videoUrl) {
        videoRef.current.src = videoData.videoUrl;
      }
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isVisible, videoData?.videoUrl]);

  const handleAction = () => {
    if (item.type === 'attempt') {
      onFinalize(item.id);
    } else if (statusInfo.action?.onClick) {
      statusInfo.action.onClick();
    } else if (statusInfo.action?.href) {
      onNavigate(statusInfo.action.href);
    }
  };

  // Estimated impressions
  const impressions = item.type === 'order' && item.total_visualizacoes_mes
    ? ((item.total_visualizacoes_mes || 0) * (item.plano_meses || 1))
    : ((painelsList.length || 0) * 7200);

  return (
    <div
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={cn(
        'bg-card border border-border/40 rounded-xl shadow-sm overflow-hidden',
        'hover:shadow-md transition-all duration-200',
        item.type === 'attempt' && 'border-l-4 border-l-orange-500'
      )}
    >
      {/* DESKTOP: flex-row | MOBILE: flex-col */}
      <div className={cn('flex', isMobile ? 'flex-col' : 'flex-row')}>

        {/* Video Preview Area */}
        {showVideoPreview && (
          <div className={cn(
            'relative bg-muted flex items-center justify-center overflow-hidden flex-shrink-0',
            isMobile
              ? 'w-full aspect-video max-h-[160px] rounded-t-xl'
              : 'w-[160px] min-h-[120px] rounded-l-xl'
          )}>
            {videoData?.videoUrl ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <p className="text-xs text-muted-foreground text-center px-4">
                Nenhum vídeo em exibição
              </p>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3">

          {/* Top: ID + Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                {item.type === 'order' && item.nome_pedido
                  ? `${item.nome_pedido} · #${item.id.substring(0, 8)}`
                  : `${item.type === 'attempt' ? 'Tentativa' : 'Campanha'} #${item.id.substring(0, 8)}`}
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Criado em {formatDate(item.created_at)}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 flex-shrink-0">
              {item.type === 'order' && item.is_fidelidade && (
                <Badge className="bg-purple-600 border-purple-700 text-white text-[10px] px-1.5 py-0">
                  <Repeat className="h-2.5 w-2.5 mr-0.5" />
                  Fidelidade
                </Badge>
              )}
              <Badge className={cn('border text-[10px] px-1.5 py-0', statusInfo.bgColor, statusInfo.color)}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          {/* Metrics */}
          {isMobile ? (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-semibold text-foreground">{formatCurrency(item.valor_total || 0)}</span>
                {' · '}
                {item.type === 'order' ? `${item.plano_meses} meses` : '1 mês'}
              </p>
              <p>
                {painelsList.length} locais · {impressions.toLocaleString('pt-BR')} exibições
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground">Valor</p>
                <p className="font-semibold text-foreground">{formatCurrency(item.valor_total || 0)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Duração</p>
                <p className="font-medium text-foreground">
                  {item.type === 'order' ? `${item.plano_meses} meses` : '1 mês'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Locais</p>
                <p className="font-medium text-foreground">{painelsList.length}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Exibições</p>
                <p className="font-medium text-foreground">{impressions.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          )}

          {/* Video Slots */}
          {item.type === 'order' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-muted-foreground">Slots de vídeo</p>
                <p className="text-[11px] font-medium text-foreground">{usedSlots} / {totalSlots}</p>
              </div>
              <Progress value={slotPercent} className="h-1.5" />
            </div>
          )}

          {/* Actions */}
          <div className={cn(
            'flex gap-2 pt-1',
            isMobile ? 'flex-col' : 'flex-row items-center'
          )}>
            {/* Primary action button (from useOrderStatus) */}
            {statusInfo.action && (
              <Button
                variant={statusInfo.action.variant}
                size="sm"
                onClick={handleAction}
                disabled={isProcessingAttempt || isGeneratingPix}
                className="min-h-[44px] sm:min-h-[36px] text-xs w-full sm:w-auto"
              >
                {isGeneratingPix && item.status === 'pendente' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  statusInfo.action.label
                )}
              </Button>
            )}

            {/* Single "Ver Detalhes" button */}
            {item.type === 'order' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate(`/anunciante/pedido/${item.id}`)}
                className="min-h-[44px] sm:min-h-[36px] text-xs w-full sm:w-auto"
              >
                Ver Detalhes
              </Button>
            )}

            {/* Delete button */}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] sm:min-h-[36px] text-destructive hover:text-destructive hover:bg-destructive/10 text-xs w-full sm:w-auto"
                onClick={() => onDelete(item.id, item.type)}
              >
                Excluir
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};