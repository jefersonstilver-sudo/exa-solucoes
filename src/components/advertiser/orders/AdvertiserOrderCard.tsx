import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, Trash2, Loader2, Repeat } from 'lucide-react';
import { useOrderStatus } from '@/hooks/useOrderStatus';

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
    <div className={cn(
      'bg-card border border-border/40 rounded-xl shadow-sm overflow-hidden',
      'hover:shadow-md transition-all duration-200',
      item.type === 'attempt' && 'border-l-4 border-l-orange-500'
    )}>
      <div className="p-4 sm:p-5">
        {/* Top: ID + Status */}
        <div className="flex items-start justify-between gap-2 mb-3">
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
            <Badge className={cn('border text-[10px] px-1.5 py-0', statusInfo.bgColor)}>
              <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Metrics row */}
        {isMobile ? (
          <div className="text-xs text-muted-foreground space-y-1 mb-3">
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
          <div className="grid grid-cols-4 gap-3 text-sm mb-3">
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
              <p className="font-medium text-foreground">{painelsList.length} selecionados</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Exibições</p>
              <p className="font-medium text-foreground flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                {impressions.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        )}

        {/* Video Slots Progress */}
        {item.type === 'order' && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-muted-foreground">Video Slots</p>
              <p className="text-[11px] font-medium text-foreground">{usedSlots} / {totalSlots}</p>
            </div>
            <Progress value={slotPercent} className="h-1.5" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {statusInfo.action && (
            <Button
              variant={statusInfo.action.variant}
              size="sm"
              onClick={handleAction}
              disabled={isProcessingAttempt || isGeneratingPix}
              className="min-h-[44px] sm:min-h-[36px] text-xs flex-1 sm:flex-none"
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

          {item.type === 'order' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate(`/anunciante/pedido/${item.id}`)}
              className="min-h-[44px] sm:min-h-[36px] text-xs flex-1 sm:flex-none"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Detalhes
            </Button>
          )}

          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] sm:min-h-[36px] text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(item.id, item.type)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
