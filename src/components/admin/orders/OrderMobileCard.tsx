import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, DollarSign, Calendar, Building2, Phone, Mail } from 'lucide-react';
import { CollapsibleCard } from '@/components/admin/shared/CollapsibleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CouponBadge } from '@/components/admin/orders/CouponBadge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderMobileCardProps {
  order: any;
  onViewDetails: (orderId: string) => void;
}

export const OrderMobileCard: React.FC<OrderMobileCardProps> = ({
  order,
  onViewDetails,
}) => {
  const navigate = useNavigate();

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
          className="w-full bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] hover:from-[#7A1818] hover:to-[#B91C1C] text-white"
        >
          👁️ Ver Detalhes Completos
        </Button>
      </div>
    </div>
  );

  return (
    <CollapsibleCard
      preview={preview}
      borderColor="border-[#9C1E1E]"
      className="shadow-md hover:shadow-lg transition-shadow"
    >
      {expandedContent}
    </CollapsibleCard>
  );
};
