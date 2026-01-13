import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Clock, Building, User, Calendar } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';

interface MinimalOrderCardProps {
  item: OrderOrAttempt;
  isSelected: boolean;
  onSelectionChange: (id: string, checked: boolean) => void;
  onViewOrderDetails?: (orderId: string) => void;
  showCheckbox?: boolean;
}

// Mapeamento de status consolidado - Fluxo Opção B
const getStatusConfig = (status: string, correctStatus?: string) => {
  const targetStatus = correctStatus || status;
  
  const statusConfigs: Record<string, { label: string; className: string; icon: string }> = {
    // Ativos / Em Exibição
    'ativo': { label: 'Em Exibição', className: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '🟢' },
    'video_aprovado': { label: 'Em Exibição', className: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '🟢' },
    'em_exibicao': { label: 'Em Exibição', className: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '🟢' },
    
    // Processando
    'aguardando_video': { label: 'Aguardando Vídeo', className: 'bg-blue-100 text-blue-800 border-blue-200', icon: '📹' },
    'video_enviado': { label: 'Vídeo Enviado', className: 'bg-purple-100 text-purple-800 border-purple-200', icon: '📤' },
    'aguardando_aprovacao': { label: 'Em Análise', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⏳' },
    
    // Aguardando Contrato - NOVO do Fluxo B
    'aguardando_contrato': { label: 'Aguardando Contrato', className: 'bg-amber-100 text-amber-800 border-amber-200', icon: '📄' },
    
    // Aguardando Pagamento
    'pendente': { label: 'Aguardando Pagamento', className: 'bg-orange-100 text-orange-800 border-orange-200', icon: '⏳' },
    'aguardando_pagamento': { label: 'Aguardando Pagamento', className: 'bg-orange-100 text-orange-800 border-orange-200', icon: '⏳' },
    
    // Legados / Bloqueados
    'pago_pendente_video': { label: 'Legado Bloqueado', className: 'bg-red-100 text-red-800 border-red-200', icon: '🔒' },
    'bloqueado': { label: 'Bloqueado', className: 'bg-red-100 text-red-800 border-red-200', icon: '🔒' },
    
    // Cancelados
    'cancelado': { label: 'Cancelado', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: '❌' },
    'cancelado_automaticamente': { label: 'Cancelado', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: '⏰' },
    
    // Tentativas
    'tentativa': { label: 'Tentativa', className: 'bg-slate-100 text-slate-600 border-slate-200', icon: '📝' },
  };
  
  return statusConfigs[targetStatus] || { 
    label: targetStatus, 
    className: 'bg-gray-100 text-gray-600 border-gray-200', 
    icon: '❓' 
  };
};

export const MinimalOrderCard: React.FC<MinimalOrderCardProps> = ({
  item,
  isSelected,
  onSelectionChange,
  onViewOrderDetails,
  showCheckbox = true
}) => {
  const statusConfig = getStatusConfig(item.status, item.correct_status);
  
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
      
      {/* ID e Status */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <span className="font-mono text-sm text-muted-foreground">
          #{item.id.substring(0, 8)}
        </span>
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
      
      {/* Tempo */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[90px]">
        <Clock className="h-3.5 w-3.5" />
        <span>{timeAgo}</span>
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
