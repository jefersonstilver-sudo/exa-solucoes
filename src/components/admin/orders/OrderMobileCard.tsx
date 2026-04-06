import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, DollarSign, Calendar, Building2, Phone, Mail, Check, Clock, CreditCard, FileText, AlertCircle, Crown } from 'lucide-react';
import { CollapsibleCard } from '@/components/admin/shared/CollapsibleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CouponBadge } from '@/components/admin/orders/CouponBadge';
import { InstallmentProgress } from '@/components/admin/shared/InstallmentProgress';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLongPress } from '@/hooks/useLongPress';
import { cn } from '@/lib/utils';

interface Installment {
  installment: number;
  due_date: string;
  amount: number;
  status?: string;
  paid_at?: string;
}

interface OrderMobileCardProps {
  order: any;
  onViewDetails: (orderId: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onLongPress?: () => void;
  onToggleSelect?: () => void;
  installments?: Installment[];
}

export const OrderMobileCard: React.FC<OrderMobileCardProps> = ({
  order,
  onViewDetails,
  isSelectionMode = false,
  isSelected = false,
  onLongPress,
  onToggleSelect,
  installments = [],
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

  // Check if order has custom installments
  const hasCustomInstallments = installments && installments.length > 0;
  const isCustomPayment = order.payment_type === 'custom' || hasCustomInstallments;

  // Calculate paid stats for custom installments
  const paidInstallments = installments.filter(i => i.status === 'pago');
  const paidAmount = paidInstallments.reduce((sum, i) => sum + i.amount, 0);
  const totalAmount = installments.reduce((sum, i) => sum + i.amount, 0) || order.valor_total;
  const progressPercent = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  // Find next and last paid
  const pendingInstallments = installments.filter(i => i.status !== 'pago').sort((a, b) => a.installment - b.installment);
  const nextInstallment = pendingInstallments[0];
  const lastPaid = paidInstallments.sort((a, b) => b.installment - a.installment)[0];

  // Get contract badge config
  const getContractBadge = () => {
    if (!order.contrato_status || order.contrato_status === 'nao_aplicavel') {
      return null;
    }
    
    if (order.contrato_assinado_em || order.contrato_status === 'assinado') {
      return {
        label: 'Contrato ✓',
        className: 'bg-emerald-100 text-emerald-700',
        icon: Check
      };
    }
    
    if (order.contrato_status === 'enviado') {
      return {
        label: 'Aguardando Assinatura',
        className: 'bg-amber-100 text-amber-700',
        icon: Clock
      };
    }
    
    if (order.contrato_status === 'pendente') {
      return {
        label: 'Contrato Pendente',
        className: 'bg-orange-100 text-orange-700',
        icon: AlertCircle
      };
    }
    
    return null;
  };

  const contractBadge = getContractBadge();

  const preview = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {order.nome_pedido && (
            <span className="text-xs font-semibold text-foreground">{order.nome_pedido}</span>
          )}
          <span className="text-xs text-muted-foreground">#{order.id.substring(0, 8)}</span>
          <CouponBadge couponCode={order.coupon_code} couponCategory={order.coupon_category} size="sm" />
          {order.is_master && (
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 border-amber-600 text-amber-950 text-[10px] px-1.5 py-0 font-bold border-0">
              <Crown className="h-2.5 w-2.5 mr-0.5" />
              MASTER
            </Badge>
          )}
          {isCustomPayment && (
            <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 border-0">
              <CreditCard className="h-2.5 w-2.5 mr-0.5" />
              {installments.length}x
            </Badge>
          )}
          {/* Contract status badge */}
          {contractBadge && (
            <Badge className={cn("text-[10px] px-1.5 py-0 border-0", contractBadge.className)}>
              <contractBadge.icon className="h-2.5 w-2.5 mr-0.5" />
              {contractBadge.label}
            </Badge>
          )}
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

      {/* Custom installments progress */}
      {isCustomPayment && hasCustomInstallments ? (
        <div className="space-y-1.5">
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  progressPercent === 100 ? "bg-emerald-500" : "bg-[#9C1E1E]"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
              {progressPercent}%
            </span>
          </div>

          {/* Next and last paid */}
          <div className="flex items-center justify-between text-[10px]">
            {lastPaid ? (
              <div className="flex items-center gap-1 text-emerald-600">
                <Check className="h-3 w-3" />
                <span>Pago: {formatCurrency(lastPaid.amount)}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Aguardando 1ª</span>
            )}
            {nextInstallment && (
              <div className="flex items-center gap-1 text-amber-600">
                <Clock className="h-3 w-3" />
                <span>
                  Próx: {formatCurrency(nextInstallment.amount)}
                </span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{formatCurrency(totalAmount)}</span>
            </span>
            <span className="text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
      ) : (
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
      )}
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

      {/* Custom installments full details */}
      {isCustomPayment && hasCustomInstallments && (
        <div className="pt-3 border-t">
          <InstallmentProgress 
            installments={installments}
            totalValue={totalAmount}
            showDetails={true}
          />
        </div>
      )}

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
