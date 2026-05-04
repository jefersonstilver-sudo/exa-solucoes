import { useMemo } from 'react';
import { 
  Clock, 
  DollarSign, 
  Upload, 
  Play, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  CreditCard,
  Eye,
  Monitor
} from 'lucide-react';

export interface OrderStatusInfo {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: any;
  action?: {
    label: string;
    variant: 'default' | 'outline' | 'destructive';
    href?: string;
    onClick?: () => void;
  };
}

export const useOrderStatus = (
  order: any, 
  onGeneratePix?: (orderId: string) => void,
  onStripePayment?: (orderId: string) => void
) => {
  const statusInfo = useMemo((): OrderStatusInfo => {
    // CORREÇÃO: Verificar se é uma tentativa de compra primeiro
    if (order?.type === 'attempt') {
      return {
        label: 'Pagamento não realizado',
        description: 'Esta compra foi iniciada mas não foi finalizada',
        color: 'text-white',
        bgColor: 'bg-red-600 border-red-700',
        icon: XCircle,
        action: {
          label: 'Finalizar Compra',
          variant: 'default',
          onClick: () => {
            // This will be handled by the component that uses this hook
            console.log('Finalizar Compra clicked for attempt:', order.id);
          }
        }
      };
    }

    const status = order?.status;
    const hasVideos = order?.videos && order.videos.length > 0;
    const hasApprovedVideo = order?.videos?.some((v: any) => v.approval_status === 'approved');
    const isFidelidade = order?.is_fidelidade === true;
    const paymentMethod = order?.metodo_pagamento || order?.tipo_pagamento || 'pix';

    // NOVO: Tratamento especial para pedidos fidelidade (PIX ou Boleto)
    if (isFidelidade && status === 'pendente') {
      const isPix = paymentMethod === 'pix_fidelidade';
      return {
        label: 'Aguardando 1ª Parcela',
        description: isPix 
          ? 'Pague a primeira parcela PIX para ativar sua campanha' 
          : 'Pague a primeira parcela para ativar sua campanha',
        color: 'text-white',
        bgColor: 'bg-purple-600 border-purple-700',
        icon: CreditCard,
        action: {
          label: isPix ? 'Ver Parcelas PIX' : 'Ver Parcelas',
          variant: 'default',
          href: `/anunciante/faturas?pedido=${order.id}`
        }
      };
    }

    switch (status) {
      case 'pendente':
        // Verificar se é boleto (normal ou fidelidade)
        if (paymentMethod === 'boleto' || paymentMethod === 'boleto_fidelidade') {
          return {
            label: 'Aguardando Pagamento',
            description: 'Gere o boleto para efetuar o pagamento',
            color: 'text-white',
            bgColor: 'bg-orange-600 border-orange-700',
            icon: CreditCard,
            action: {
              label: 'Gerar Boleto',
              variant: 'default',
              href: `/anunciante/faturas?pedido=${order.id}`
            }
          };
        }
        
        // Verificar se é PIX fidelidade
        if (paymentMethod === 'pix_fidelidade') {
          return {
            label: 'Aguardando Pagamento',
            description: 'Pague a parcela PIX para ativar sua campanha',
            color: 'text-white',
            bgColor: 'bg-purple-600 border-purple-700',
            icon: CreditCard,
            action: {
              label: 'Ver Parcelas PIX',
              variant: 'default',
              href: `/anunciante/faturas?pedido=${order.id}`
            }
          };
        }
        
        // Verificar se é cartão
        if (paymentMethod === 'cartao' || paymentMethod === 'credit_card') {
          return {
            label: 'Aguardando Pagamento',
            description: 'Finalize o pagamento com cartão de crédito',
            color: 'text-white',
            bgColor: 'bg-orange-600 border-orange-700',
            icon: CreditCard,
            action: {
              label: 'Pagar com Cartão',
              variant: 'default',
              onClick: onStripePayment ? () => onStripePayment(order.id) : undefined,
              href: !onStripePayment ? `/payment?pedido=${order.id}&method=credit_card` : undefined
            }
          };
        }
        
        // Default: PIX à Vista
        return {
          label: 'Aguardando Pagamento',
          description: 'Efetue o pagamento PIX para ativar sua campanha',
          color: 'text-white',
          bgColor: 'bg-orange-600 border-orange-700',
          icon: CreditCard,
          action: {
            label: 'Pagar com PIX',
            variant: 'default',
            onClick: onGeneratePix ? () => onGeneratePix(order.id) : undefined,
            href: !onGeneratePix ? `/payment?pedido=${order.id}&method=pix` : undefined
          }
        };

      case 'pago':
      case 'pago_pendente_video':
        if (!hasVideos) {
          return {
            label: 'Aguardando Vídeo',
            description: 'Acesse "Ver Detalhes" para enviar o vídeo da sua campanha',
            color: 'text-white',
            bgColor: 'bg-blue-600 border-blue-700',
            icon: Upload,
            // Sem action: upload acontece SOMENTE dentro de "Ver Detalhes" (página do pedido)
          };
        } else if (!hasApprovedVideo) {
          return {
            label: 'Vídeo em Análise',
            description: 'Seu vídeo está sendo analisado pela nossa equipe',
            color: 'text-white',
            bgColor: 'bg-purple-600 border-purple-700',
            icon: Clock
          };
        }
        // NOTA: Este caso não deve mais acontecer devido ao trigger automático
        // que atualiza o status para 'video_aprovado' quando um vídeo é aprovado
        return {
          label: 'EM EXIBIÇÃO',
          description: 'Sua campanha está ativa e sendo exibida nos painéis',
          color: 'text-white',
          bgColor: 'bg-green-600 border-green-700',
          icon: Monitor
        };

      case 'video_aprovado':
        return {
          label: 'EM EXIBIÇÃO',
          description: 'Sua campanha está ativa e sendo exibida nos painéis',
          color: 'text-white',
          bgColor: 'bg-green-600 border-green-700',
          icon: Monitor
        };

      case 'ativo':
        return {
          label: 'EM EXIBIÇÃO',
          description: 'Sua campanha está ativa e sendo exibida nos painéis',
          color: 'text-white',
          bgColor: 'bg-green-600 border-green-700',
          icon: Monitor
        };

      case 'video_rejeitado':
        return {
          label: 'Vídeo Rejeitado',
          description: 'Seu vídeo foi rejeitado. Envie um novo vídeo',
          color: 'text-white',
          bgColor: 'bg-red-600 border-red-700',
          icon: XCircle,
          action: {
            label: 'Enviar Novo Vídeo',
            variant: 'default',
            href: `/anunciante/pedido/${order.id}#upload`
          }
        };

      case 'expirado':
        return {
          label: 'Contrato Encerrado',
          description: 'Seu contrato expirou. Renove para continuar',
          color: 'text-white',
          bgColor: 'bg-red-600 border-red-700',
          icon: XCircle,
          action: {
            label: 'Renovar Contrato',
            variant: 'default',
            href: '/paineis-digitais/loja'
          }
        };

      case 'bloqueado':
        return {
          label: 'Pedido Bloqueado',
          description: 'Pedido bloqueado por questões de segurança. Entre em contato com o suporte.',
          color: 'text-white',
          bgColor: 'bg-red-600 border-red-700',
          icon: AlertTriangle
        };
      
      case 'cancelado':
        return {
          label: 'Cancelado',
          description: 'Este pedido foi cancelado',
          color: 'text-white',
          bgColor: 'bg-gray-600 border-gray-700',
          icon: XCircle
        };

      default:
        return {
          label: 'Status Desconhecido',
          description: 'Entre em contato com o suporte',
          color: 'text-white',
          bgColor: 'bg-gray-600 border-gray-700',
          icon: AlertTriangle
        };
    }
  }, [order?.status, order?.videos, order?.id, order?.type, order?.metodo_pagamento, onGeneratePix, onStripePayment]);

  return statusInfo;
};