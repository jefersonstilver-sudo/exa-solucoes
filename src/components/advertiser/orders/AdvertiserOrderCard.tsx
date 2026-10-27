import React, { useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Monitor, Smartphone, Clock, Crown } from 'lucide-react';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { useOrderCurrentVideoData } from '@/hooks/useOrderCurrentVideoData';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { MoveToGroupMenu } from '@/components/orders/MoveToGroupMenu';
import { OrderGroup } from '@/hooks/useOrderGroups';

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
  // Group support
  groups?: OrderGroup[];
  onMoveToGroup?: (orderId: string, groupId: string | null) => void;
  onCreateGroup?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, orderId: string) => void;
  /** nome da empresa (ja mostrado no cabecalho): se o pedido tiver o mesmo nome, o cartao mostra os predios */
  companyName?: string;
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
  groups,
  onMoveToGroup,
  onCreateGroup,
  draggable,
  onDragStart,
  companyName,
}) => {
  const statusInfo = useOrderStatus(item, handleGeneratePix, handleStripePayment);
  const painelsList = item.type === 'order' ? item.lista_paineis || [] : item.predios_selecionados || [];

  // Video slot usage
  const usedSlots = item.videos?.length || 0;
  const totalSlots = 10;
  const slotPercent = (usedSlots / totalSlots) * 100;

  const canDelete = item.type === 'attempt' ||
    (item.type === 'order' && ['pendente', 'cancelado'].includes(item.status));

  // Show video preview for active orders
  const showVideoPreview = item.type === 'order';
  const { videoData } = useOrderCurrentVideoData(
    showVideoPreview ? item.id : ''
  );

  // Display time progress calculation
  const displayTimeProgress = useMemo(() => {
    if (item.type !== 'order' || !item.data_inicio || !item.data_fim) return null;

    const now = new Date().getTime();
    const start = new Date(item.data_inicio).getTime();
    const end = new Date(item.data_fim).getTime();
    const totalDuration = end - start;

    if (totalDuration <= 0) return null;

    const elapsed = Math.max(0, now - start);
    const percent = Math.min(100, (elapsed / totalDuration) * 100);
    const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    const totalDays = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.min(totalDays, Math.max(0, Math.ceil(elapsed / (1000 * 60 * 60 * 24))));
    const isExpired = now > end;

    return { percent, daysRemaining, totalDays, daysElapsed, isExpired };
  }, [item.type, item.data_inicio, item.data_fim]);

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

  const nomeLimpo = String(item.nome_pedido || '').replace(/^\s*EXA\s*[-–—:]\s*/i, '').trim();
  const nomesPredios = (painelsList as any[]).map((p) => { try { const o = typeof p === 'string' ? JSON.parse(p) : p; return o?.building_name || o?.nome || o?.name || null; } catch { return null; } }).filter(Boolean) as string[];
  const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const repeteEmpresa = !!companyName && !!nomeLimpo && (norm(nomeLimpo) === norm(companyName) || norm(companyName).includes(norm(nomeLimpo)));
  const titulo = item.type === 'order'
    ? (!nomeLimpo || repeteEmpresa)
      ? (nomesPredios.length ? nomesPredios.slice(0, 2).join(' + ') + (nomesPredios.length > 2 ? ` + ${nomesPredios.length - 2}` : '') : `Pedido #${item.id.substring(0, 8)}`)
      : nomeLimpo
    : `Tentativa #${item.id.substring(0, 8)}`;
  const tom = (() => {
    const st = item.type === 'attempt' ? 'tentativa' : item.status;
    if (['ativo', 'video_aprovado'].includes(st)) return 'bg-[#13a24a]/10 text-[#0f7a39]';
    if (['aguardando_contrato', 'pendente', 'tentativa'].includes(st)) return 'bg-amber-100 text-amber-800';
    if (['video_enviado'].includes(st)) return 'bg-violet-100 text-violet-800';
    if (['cancelado', 'cancelado_automaticamente', 'bloqueado', 'expirado'].includes(st)) return 'bg-[#1b1719]/[0.06] text-[#554e50]';
    return 'bg-sky-100 text-sky-800';
  })();
  const vertical = item.tipo_produto === 'vertical_premium';
  const abrir = () => item.type === 'order' && onNavigate(`/anunciante/pedido/${item.id}`);

  return (
    <div
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={cn(
        'group overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(27,23,25,0.04),0_8px_24px_-12px_rgba(27,23,25,0.12)] ring-1 ring-[#1b1719]/[0.05]',
        'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(27,23,25,0.05),0_18px_40px_-18px_rgba(27,23,25,0.25)]',
        item.type === 'attempt' && 'ring-amber-300',
        draggable && 'cursor-grab active:cursor-grabbing'
      )}
      draggable={draggable}
      onDragStart={draggable && onDragStart ? (e) => onDragStart(e, item.id) : undefined}
    >
      <div className={cn('flex', isMobile ? 'flex-col' : 'flex-row')}>
        {/* Miniatura do que está no ar */}
        {showVideoPreview && (
          <button
            type="button"
            onClick={abrir}
            className={cn(
              'relative flex flex-shrink-0 items-center justify-center overflow-hidden bg-[#1b1719]',
              isMobile ? 'aspect-[1080/890] max-h-[220px] w-full' : 'm-3 aspect-[1080/890] w-[210px] self-start rounded-2xl'
            )}
            aria-label="Abrir pedido"
          >
            {videoData?.videoUrl ? (
              <>
                <video ref={videoRef} className="h-full w-full object-cover" muted loop playsInline preload="metadata" />
                <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white backdrop-blur">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#34d27b]" /> No ar
                </span>
              </>
            ) : (
              <span className="px-5 text-center">
                <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  {vertical ? <Smartphone className="h-5 w-5 text-white/70" /> : <Monitor className="h-5 w-5 text-white/70" />}
                </span>
                <span className="block text-[12px] font-medium leading-snug text-white/70">Nenhum vídeo no ar ainda</span>
              </span>
            )}
          </button>
        )}

        {/* Conteúdo */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <button type="button" onClick={abrir} className="min-w-0 flex-1 text-left">
              <h3 className="truncate text-[18px] font-extrabold tracking-tight text-[#1b1719] sm:text-[20px]">{titulo}</h3>
              <p className="mt-0.5 text-[12.5px] text-[#8b8285]">
                #{item.id.substring(0, 8)} · criado em {formatDate(item.created_at)}
              </p>
            </button>
            <div className="flex flex-wrap items-center gap-1.5">
              {item.type === 'order' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#1b1719]/[0.05] px-2.5 py-1 text-[11.5px] font-semibold text-[#554e50]">
                  {vertical ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                  {vertical ? 'Vertical Premium' : 'Horizontal'}
                </span>
              )}
              {item.type === 'order' && item.is_master && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11.5px] font-bold text-amber-900">
                  <Crown className="h-3 w-3" /> Master
                </span>
              )}
              <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-bold', tom)}>{statusInfo.label}</span>
            </div>
          </div>

          {/* Números */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            {[
              { k: 'Valor', v: formatCurrency(item.valor_total || 0) },
              { k: 'Duração', v: item.type === 'order' ? `${item.plano_meses} meses` : '1 mês' },
              { k: 'Prédios', v: String(painelsList.length) },
              { k: 'Exibições', v: impressions.toLocaleString('pt-BR') },
            ].map((m) => (
              <div key={m.k}>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#a39a9d]">{m.k}</div>
                <div className="mt-0.5 text-[15px] font-bold text-[#1b1719]">{m.v}</div>
              </div>
            ))}
          </div>

          {/* Progresso */}
          {item.type === 'order' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {displayTimeProgress && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
                    <span className="flex items-center gap-1 font-semibold text-[#8b8285]"><Clock className="h-3 w-3" /> Período</span>
                    <span className="font-semibold text-[#554e50]">
                      {displayTimeProgress.isExpired ? 'Encerrado' : `${displayTimeProgress.daysRemaining} dias restantes`}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#1b1719]/[0.06]">
                    <div className={cn('h-full rounded-full', displayTimeProgress.isExpired ? 'bg-[#8b8285]' : 'bg-[#9C1E1E]')} style={{ width: `${Math.max(2, displayTimeProgress.percent)}%` }} />
                  </div>
                </div>
              )}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
                  <span className="font-semibold text-[#8b8285]">Vídeos</span>
                  <span className="font-semibold text-[#554e50]">{usedSlots} de {totalSlots}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#1b1719]/[0.06]">
                  <div className="h-full rounded-full bg-[#1b1719]" style={{ width: `${Math.max(2, slotPercent)}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className={cn('flex gap-2', isMobile ? 'flex-col' : 'flex-row flex-wrap items-center')}>
            {item.type === 'order' && (
              <button
                type="button"
                onClick={abrir}
                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#9C1E1E] px-5 text-[13.5px] font-bold text-white shadow-[0_6px_16px_-8px_rgba(156,30,30,0.8)] transition-colors hover:bg-[#861919]"
              >
                Abrir pedido
              </button>
            )}
            {statusInfo.action && (
              <button
                type="button"
                onClick={handleAction}
                disabled={isProcessingAttempt || isGeneratingPix}
                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#1b1719]/[0.05] px-4 text-[13.5px] font-semibold text-[#1b1719] hover:bg-[#1b1719]/[0.09] disabled:opacity-60"
              >
                {isGeneratingPix && item.status === 'pendente' ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Gerando...</>) : statusInfo.action.label}
              </button>
            )}
            {item.type === 'order' && groups && onMoveToGroup && onCreateGroup && (
              <MoveToGroupMenu groups={groups} currentGroupId={item.grupo_id} onMove={(groupId) => onMoveToGroup(item.id, groupId)} onCreateNew={onCreateGroup} />
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(item.id, item.type)}
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl px-4 text-[13.5px] font-semibold text-[#b42318] hover:bg-[#b42318]/[0.07]"
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};