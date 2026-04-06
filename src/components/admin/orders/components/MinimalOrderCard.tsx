import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Eye, Clock, Building, User, Calendar, Monitor, Smartphone, Video, Crown, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';
import { formatDistanceToNow, format, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';
import { getStatusConfig as getCanonicalStatusConfig } from '@/constants/pedidoStatus';
import { useOrderCurrentVideoData } from '@/hooks/useOrderCurrentVideoData';
import OrderExpirationIndicator from '@/components/admin/orders/OrderExpirationIndicator';

interface MinimalOrderCardProps {
  item: OrderOrAttempt;
  isSelected: boolean;
  onSelectionChange: (id: string, checked: boolean) => void;
  onViewOrderDetails?: (orderId: string) => void;
  showCheckbox?: boolean;
  isSuperAdmin?: boolean;
}

// Usa o mapper central canônico para obter configuração de status
const getStatusConfig = (status: string, type: 'order' | 'attempt') => {
  if (type === 'attempt') {
    return {
      label: 'Tentativa',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: '📝'
    };
  }
  
  const config = getCanonicalStatusConfig(status);
  return {
    label: config.label,
    className: config.className,
    icon: config.icon
  };
};

export const MinimalOrderCard: React.FC<MinimalOrderCardProps> = ({
  item,
  isSelected,
  onSelectionChange,
  onViewOrderDetails,
  showCheckbox = true,
  isSuperAdmin = false
}) => {
  const statusConfig = getStatusConfig(item.status, item.type);
  const showVideoPreview = item.type === 'order' && ['ativo', 'video_aprovado'].includes(item.status);
  const { videoData } = useOrderCurrentVideoData(showVideoPreview ? item.id : '');
  const isVertical = (item as any).tipo_produto === 'vertical_premium';
  
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { 
    addSuffix: true, 
    locale: ptBR 
  });
  
  // Usar lista_predios como fonte principal, fallback para lista_paineis
  const panelList = item.lista_predios?.length ? item.lista_predios : item.lista_paineis;
  const panelCount = item.type === 'order' 
    ? (panelList?.length || 0)
    : (item.predios_selecionados?.length || 0);

  // Calcular progresso do contrato
  const now = new Date();
  const hasContractDates = item.data_inicio && item.data_fim;
  let contractProgress = 0;
  let totalDays = 0;
  let elapsedDays = 0;
  let isExpired = false;

  if (hasContractDates) {
    const start = new Date(item.data_inicio!);
    const end = new Date(item.data_fim!);
    totalDays = differenceInDays(end, start);
    elapsedDays = differenceInDays(now, start);
    isExpired = isPast(end);
    contractProgress = totalDays > 0 ? Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100) : 0;
  }

  return (
    <div className="flex items-start gap-4 p-4 bg-card border border-border/50 rounded-xl hover:border-border hover:shadow-md transition-all">
      {/* Checkbox */}
      {showCheckbox && (
        <div className="pt-1">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={(checked) => onSelectionChange(item.id, checked as boolean)}
          />
        </div>
      )}

      {/* Mini Preview de Vídeo */}
      {showVideoPreview && (
        <div 
          className={`flex-shrink-0 rounded-lg overflow-hidden bg-black/90 border border-border/50 shadow-sm ${
            isVertical ? 'w-20 h-36' : 'w-28 aspect-video'
          }`}
        >
          {videoData?.videoUrl ? (
            <video
              src={videoData.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
      )}
      
      {/* Conteúdo Principal */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Linha 1: Nome/ID + Status + Tipo Produto */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex flex-col mr-2">
            {item.nome_pedido && (
              <span className="text-base font-bold text-foreground truncate max-w-[220px]">
                {item.nome_pedido}
              </span>
            )}
            <span className="font-mono text-xs text-muted-foreground">
              #{item.id.substring(0, 8)}
            </span>
          </div>
          {item.type === 'order' && (
            isVertical ? (
              <Badge variant="outline" className="text-[10px] border-purple-400 text-purple-700 bg-purple-50 px-1.5 py-0">
                <Smartphone className="h-2.5 w-2.5 mr-0.5" />
                Vertical
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] border-blue-400 text-blue-700 bg-blue-50 px-1.5 py-0">
                <Monitor className="h-2.5 w-2.5 mr-0.5" />
                Horizontal
              </Badge>
            )
          )}
          {item.is_master && (
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 border-amber-600 text-amber-950 text-[10px] px-1.5 py-0 font-bold">
              <Crown className="h-2.5 w-2.5 mr-0.5" />
              MASTER
            </Badge>
          )}
          <Badge className={`${statusConfig.className} text-xs font-medium`}>
            {statusConfig.icon} {statusConfig.label}
          </Badge>
        </div>

        {/* Linha 2: Cliente */}
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium truncate">
            {item.client_name || 'Nome não disponível'}
          </span>
          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
            • {item.client_email || 'Email não disponível'}
          </span>
        </div>

        {/* Linha 3: Painéis (com IDs para super_admin) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building className="h-3.5 w-3.5" />
            <span>{panelCount} {panelCount === 1 ? 'painel' : 'painéis'}</span>
          </div>
          {isSuperAdmin && item.type === 'order' && panelList && panelList.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {panelList.map((painelId: string) => (
                <Badge 
                  key={painelId} 
                  variant="outline" 
                  className="text-[10px] font-mono px-1.5 py-0 bg-muted/50 text-muted-foreground border-border"
                >
                  {painelId.substring(0, 8)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Linha 4: Barra de progresso do contrato */}
        {item.type === 'order' && hasContractDates && (
          <div className="flex items-center gap-3">
            <OrderExpirationIndicator endDate={item.data_fim!} compact />
            <div className="flex-1 max-w-[200px]">
              <Progress value={contractProgress} className="h-1.5" />
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {isExpired ? 'Finalizado' : `${Math.max(totalDays - elapsedDays, 0)}d restantes`}
            </span>
          </div>
        )}
      </div>
      
      {/* Coluna direita: Valor + Data + Ação */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {/* Valor */}
        <span className="text-base font-bold text-foreground">
          {formatCurrency(item.valor_total || 0)}
        </span>
        
        {/* Duração */}
        {item.type === 'order' && item.plano_meses && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{item.plano_meses} meses</span>
          </div>
        )}

        {/* Data */}
        <div className="flex flex-col items-end">
          <span className="text-xs font-medium text-foreground">
            {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </div>
        
        {/* Ações */}
        <div className="flex items-center gap-1.5">
          {item.type === 'order' && isSuperAdmin && panelList && panelList.length > 0 && (
            <SyncApiButton orderId={item.id} buildingIds={panelList} />
          )}
          {item.type === 'order' && onViewOrderDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewOrderDetails(item.id)}
              className="h-8 px-3 text-xs"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Ver
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinimalOrderCard;
