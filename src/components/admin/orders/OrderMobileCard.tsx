import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, DollarSign, Calendar, Building2, Phone, Mail, Check, Clock, CreditCard, FileText, AlertCircle, Crown, RefreshCw } from 'lucide-react';
import { CollapsibleCard } from '@/components/admin/shared/CollapsibleCard';
import { pedidoStatusInfo } from '@/lib/pedidoStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CouponBadge } from '@/components/admin/orders/CouponBadge';
import { InstallmentProgress } from '@/components/admin/shared/InstallmentProgress';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AccessAsClientButton from '@/components/impersonation/AccessAsClientButton';
import OrderPixActions from '@/components/admin/orders/pix/OrderPixActions';
import SofiaSoldBadge from '@/components/admin/orders/SofiaSoldBadge';
import OrderCRM360Fields from '@/components/admin/crm/OrderCRM360Fields';

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

const SyncApiButtonMobile: React.FC<{ orderId: string; buildingIds: string[] }> = ({ orderId, buildingIds }) => {
  const [syncing, setSyncing] = useState(false);
  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-buildings-external-api', {
        body: { pedido_id: orderId, action: 'add', building_ids: buildingIds }
      });
      if (error) throw error;
      if (!data?.success) {
        toast.error('Sincronização parcial com a API AWS.');
      } else {
        toast.success(`Sincronizado! ${data.synced} vídeo(s) → ${data.buildings} prédio(s)`);
      }
    } catch (err: any) {
      toast.error(`Erro ao sincronizar: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={syncing}
      className="w-full h-9 text-xs"
    >
      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Sincronizando...' : 'Sincronizar API AWS'}
    </Button>
  );
};

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

  // Segurar ~0,5 s seleciona; tocar abre. Rolar a lista não abre nada (o clique do navegador já ignora arrasto).
  const timer = React.useRef<number>();
  const segurou = React.useRef(false);
  const comecar = () => { segurou.current = false; window.clearTimeout(timer.current); timer.current = window.setTimeout(() => { segurou.current = true; if ('vibrate' in navigator) navigator.vibrate(40); onLongPress?.(); }, 500); };
  const soltar = () => window.clearTimeout(timer.current);

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

  // Valor por mês (pago mensalmente), nunca o total acumulado do plano
  const valorMensal = order.valor_mensal && order.valor_mensal > 0
    ? order.valor_mensal
    : order.plano_meses && order.plano_meses > 1 ? (order.valor_total || 0) / order.plano_meses : (order.valor_total || 0);
  const st = pedidoStatusInfo(order.status);
  const nPredios = (order.lista_predios?.length || order.lista_paineis?.length || 0) as number;
  const nome = order.client_name || order.nome_pedido || order.client_email || order.email || 'Pedido';
  const quando = new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  // Celular: uma linha limpa por pedido. Tocar abre o detalhe; segurar entra no modo de seleção.
  return (
    <div
      onPointerDown={comecar}
      onPointerUp={soltar}
      onPointerLeave={soltar}
      onPointerCancel={soltar}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (segurou.current) { segurou.current = false; return; }
        if (isSelectionMode) onToggleSelect?.(); else onViewDetails(order.id);
      }}
      role="button"
      tabIndex={0}
      className={cn(
        'flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.06] active:bg-gray-50 transition-colors select-none',
        isSelected && 'ring-2 ring-[#9C1E1E] bg-red-50/40',
      )}
    >
      {isSelectionMode ? (
        <span className={cn('flex h-6 w-6 flex-none items-center justify-center rounded-full border-2', isSelected ? 'border-[#9C1E1E] bg-[#9C1E1E] text-white' : 'border-gray-300')}>
          {isSelected && <Check className="h-3.5 w-3.5" />}
        </span>
      ) : (
        <span className={cn('h-10 w-1 flex-none rounded-full', st.dot)} aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="truncate text-[15px] font-bold text-gray-900">{nome}</span>
          {order.is_master && <Crown className="h-3.5 w-3.5 flex-none text-amber-500" aria-label="Pedido master" />}
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] text-gray-500">
          {order.plano_meses ? `${order.plano_meses} ${order.plano_meses > 1 ? 'meses' : 'mês'}` : 'Plano'}
          {nPredios ? ` · ${nPredios} ${nPredios > 1 ? 'prédios' : 'prédio'}` : ''}
          {` · ${quando}`}
          {contractBadge ? ` · ${contractBadge.label}` : ''}
        </span>
      </span>
      <span className="flex flex-none flex-col items-end gap-1">
        <span className="text-[14px] font-bold tabular-nums text-gray-900">{formatCurrency(valorMensal)}<span className="text-[11px] font-semibold text-gray-400">/mês</span></span>
        <span className={cn('rounded-full px-2 py-0.5 text-[10.5px] font-bold', st.cls)}>{st.label}</span>
      </span>
    </div>
  );
};
