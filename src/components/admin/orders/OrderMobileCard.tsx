import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, DollarSign, Calendar, Building2, Phone, Mail, Check } from 'lucide-react';
import { CollapsibleCard } from '@/components/admin/shared/CollapsibleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CouponBadge } from '@/components/admin/orders/CouponBadge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLongPress } from '@/hooks/useLongPress';
import { cn } from '@/lib/utils';

interface OrderMobileCardProps {
  order: any;
  onViewDetails: (orderId: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onLongPress?: () => void;
  onToggleSelect?: () => void;
}

export const OrderMobileCard: React.FC<OrderMobileCardProps> = ({
  order,
  onViewDetails,
  isSelectionMode = false,
  isSelected = false,
  onLongPress,
  onToggleSelect,
}) => {
  const navigate = useNavigate();

  const longPressHandlers = useLongPress({
    onLongPress: () => {
      if (onLongPress) onLongPress();
    },
    onClick: () => {
      if (isSelectionMode && onToggleSelect) {
        onToggleSelect();
      }
    },
    threshold: 500,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pago: 'bg-green-500',
      video_enviado: 'bg-blue-500',
      video_aprovado: 'bg-purple-500',
      aguardando_pagamento: 'bg-yellow-500',
      cancelado: 'bg-red-500',
      bloqueado: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pago: 'Pago',
      video_enviado: 'Vídeo Enviado',
      video_aprovado: 'Aprovado',
      aguardando_pagamento: 'Aguardando',
      cancelado: 'Cancelado',
      bloqueado: 'Bloqueado',
    };
    return texts[status] || status;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const timeAgo = formatDistanceToNow(new Date(order.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const preview = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">#{order.id.substring(0, 8)}</span>
          <CouponBadge couponCode={order.coupon_code} couponCategory={order.coupon_category} size="sm" />
        </div>
        <Badge className={`${getStatusColor(order.status)} text-white border-0`}>
          {getStatusText(order.status)}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="font-medium text-foreground truncate">
          {order.client_name || 'Cliente não informado'}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="font-semibold text-foreground">
            {formatCurrency(order.valor_total)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">{timeAgo}</span>
        </div>
      </div>
    </>
  );

  const expandedContent = (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      {/* Client Information */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <User className="h-5 w-5 text-[#9C1E1E] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="font-medium text-foreground">{order.client_name}</p>
            {order.client_email && (
              <div className="flex items-center gap-1 mt-1">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{order.client_email}</p>
              </div>
            )}
            {order.client_phone && (
              <div className="flex items-center gap-1 mt-1">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{order.client_phone}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Valor Total</p>
          <p className="font-semibold text-foreground">{formatCurrency(order.valor_total)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Plano</p>
          <p className="font-semibold text-foreground">{order.plano_meses} meses</p>
        </div>
      </div>

      {order.lista_paineis && order.lista_paineis.length > 0 && (
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#9C1E1E] flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Painéis</p>
            <p className="font-medium text-foreground">{order.lista_paineis.length} selecionados</p>
          </div>
        </div>
      )}

      <div>
        <p className="text-xs text-muted-foreground">Criado</p>
        <p className="text-sm text-foreground">{timeAgo}</p>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t space-y-2">
        <Button
          onClick={() => onViewDetails(order.id)}
          className="w-full bg-[#9C1E1E] hover:bg-[#7A1818] text-white h-9 text-sm font-medium"
        >
          Ver Detalhes
        </Button>
      </div>
    </div>
  );

  // Selection mode - render simple selectable card
  if (isSelectionMode) {
    return (
      <div
        {...longPressHandlers}
        className={cn(
          "relative p-3 rounded-xl border-2 transition-all duration-200 select-none",
          "bg-white/80 backdrop-blur-sm shadow-md",
          isSelected 
            ? "border-[#9C1E1E] bg-red-50/50" 
            : "border-transparent"
        )}
      >
        {/* Selection checkbox */}
        <div 
          className={cn(
            "absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
            isSelected 
              ? "bg-[#9C1E1E] border-[#9C1E1E]" 
              : "border-gray-300 bg-white"
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleSelect) onToggleSelect();
          }}
        >
          {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
        </div>
        
        {/* Card content */}
        <div className="pr-8 space-y-2">
          {preview}
        </div>
      </div>
    );
  }

  // Normal mode - render collapsible card with long press
  return (
    <div {...longPressHandlers}>
      <CollapsibleCard
        preview={preview}
        borderColor="border-[#9C1E1E]"
        className="shadow-md hover:shadow-lg transition-shadow"
      >
        {expandedContent}
      </CollapsibleCard>
    </div>
  );
};
