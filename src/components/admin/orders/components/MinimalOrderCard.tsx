import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Clock, Building, User, Calendar, Monitor, Smartphone, Video } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';
import { getStatusConfig as getCanonicalStatusConfig } from '@/constants/pedidoStatus';
import { useOrderCurrentVideoData } from '@/hooks/useOrderCurrentVideoData';

interface MinimalOrderCardProps {
  item: OrderOrAttempt;
  isSelected: boolean;
  onSelectionChange: (id: string, checked: boolean) => void;
  onViewOrderDetails?: (orderId: string) => void;
  showCheckbox?: boolean;
}

// Usa o mapper central canônico para obter configuração de status
const getStatusConfig = (status: string, type: 'order' | 'attempt') => {
  // Tentativas têm configuração especial
  if (type === 'attempt') {
    return {
      label: 'Tentativa',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: '📝'
    };
  }
  
  // Usa o mapper central canônico
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
  showCheckbox = true
}) => {
  const statusConfig = getStatusConfig(item.status, item.type);
  const showVideoPreview = item.type === 'order' && ['ativo', 'video_aprovado'].includes(item.status);
  const { videoData } = useOrderCurrentVideoData(showVideoPreview ? item.id : '');
  
  // Calcular tempo relativo
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { 
    addSuffix: true, 
    locale: ptBR 
  });
  
  // Contagem de painéis
  const panelCount = item.type === 'order' 
    ? (item.lista_paineis?.length || 0)
    : (item.predios_selecionados?.length || 0);

  return (
    <div className="flex items-center gap-4 p-3 bg-card border border-border/50 rounded-lg hover:border-border hover:shadow-sm transition-all">
      {/* Checkbox */}
      {showCheckbox && (
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={(checked) => onSelectionChange(item.id, checked as boolean)}
        />
      )}

      {/* Mini Preview de Vídeo */}
      {showVideoPreview && (
        <div className="flex-shrink-0 w-20 aspect-video rounded overflow-hidden bg-black/90 border border-border/50">
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
              <Video className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      )}
      
      {/* ID, Nome, Tipo Produto e Status */}
      <div className="flex items-center gap-2 min-w-[280px]">
        <div className="flex flex-col">
          {item.nome_pedido && (
            <span className="text-sm font-semibold text-foreground truncate max-w-[160px]">
              {item.nome_pedido}
            </span>
          )}
          <span className="font-mono text-xs text-muted-foreground">
            #{item.id.substring(0, 8)}
          </span>
        </div>
        {item.type === 'order' && (
          (item as any).tipo_produto === 'vertical_premium' ? (
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
        <Badge className={`${statusConfig.className} text-xs font-medium`}>
          {statusConfig.icon} {statusConfig.label}
        </Badge>
      </div>
      
      {/* Cliente */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium truncate">
            {item.client_name || 'Nome não disponível'}
          </span>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {item.client_email || 'Email não disponível'}
        </div>
      </div>
      
      {/* Painéis */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-[80px]">
        <Building className="h-3.5 w-3.5" />
        <span>{panelCount} painéis</span>
      </div>
      
      {/* Duração */}
      {item.type === 'order' && item.plano_meses && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-[70px]">
          <Calendar className="h-3.5 w-3.5" />
          <span>{item.plano_meses} meses</span>
        </div>
      )}
      
      {/* Valor */}
      <div className="text-sm font-semibold min-w-[90px] text-right">
        {formatCurrency(item.valor_total || 0)}
      </div>
      
      {/* Data e Tempo */}
      <div className="flex flex-col items-end min-w-[90px]">
        <span className="text-xs font-medium text-foreground">
          {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })}
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{timeAgo}</span>
        </div>
      </div>
      
      {/* Ação */}
      {item.type === 'order' && onViewOrderDetails && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onViewOrderDetails(item.id)}
          className="h-8 px-2"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default MinimalOrderCard;
