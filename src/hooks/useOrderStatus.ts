
import { useMemo, useState } from 'react';
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
import PixQrCodeDialog from '@/components/checkout/payment/PixQrCodeDialog';
import { usePixPayment } from '@/hooks/payment/usePixPayment';

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

export const useOrderStatus = (order: any) => {
  const [isPixDialogOpen, setIsPixDialogOpen] = useState(false);
  const { paymentData, isLoading } = usePixPayment(isPixDialogOpen ? order?.id : null);

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
            // Redirecionar para a página de checkout/pagamento
            window.location.href = '/checkout';
          }
        }
      };
    }

    const status = order?.status;
    const hasVideos = order?.videos && order.videos.length > 0;
    const hasApprovedVideo = order?.videos?.some((v: any) => v.approval_status === 'approved');
    const hasActiveVideo = order?.videos?.some((v: any) => v.is_active || v.selected_for_display);
    const hasVideoInDisplay = order?.videos?.some((v: any) => v.selected_for_display && v.approval_status === 'approved');

    switch (status) {
      case 'pendente':
        return {
          label: 'Aguardando Pagamento',
          description: 'Efetue o pagamento para ativar sua campanha',
          color: 'text-white',
          bgColor: 'bg-orange-600 border-orange-700',
          icon: CreditCard,
          action: {
            label: 'Pagar com PIX',
            variant: 'default',
            onClick: () => {
              console.log('Abrindo PIX para pedido específico:', order.id);
              setIsPixDialogOpen(true);
            }
          }
        };

      case 'pago':
      case 'pago_pendente_video':
        if (!hasVideos) {
          return {
            label: 'Aguardando Vídeo',
            description: 'Faça upload do seu vídeo para análise e aprovação',
            color: 'text-white',
            bgColor: 'bg-blue-600 border-blue-700',
            icon: Upload,
            action: {
              label: 'Enviar Vídeo',
              variant: 'default',
              href: `/anunciante/pedido/${order.id}#upload`
            }
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
        return {
          label: 'Vídeo Aprovado',
          description: 'Vídeo aprovado! Contrato iniciado automaticamente.',
          color: 'text-white',
          bgColor: 'bg-green-600 border-green-700',
          icon: CheckCircle
        };

      case 'video_aprovado':
        if (hasVideoInDisplay) {
          return {
            label: 'Ativo e em Exibição',
            description: 'Sua campanha está ativa e sendo exibida nos painéis',
            color: 'text-white',
            bgColor: 'bg-green-600 border-green-700',
            icon: Play,
            action: {
              label: 'Em Exibição',
              variant: 'outline',
              onClick: () => {
                // Esta ação será interceptada pelo componente pai para abrir o popup
                const event = new CustomEvent('openVideoDisplay', { detail: { orderId: order.id } });
                window.dispatchEvent(event);
              }
            }
          };
        }
        return {
          label: 'Contrato Iniciado',
          description: 'Vídeo aprovado, contrato iniciado. Selecione para exibição.',
          color: 'text-white',
          bgColor: 'bg-green-600 border-green-700',
          icon: CheckCircle
        };

      case 'ativo':
        return {
          label: 'Ativo e em Exibição',
          description: 'Sua campanha está ativa e sendo exibida nos painéis',
          color: 'text-white',
          bgColor: 'bg-green-600 border-green-700',
          icon: Play,
          action: {
            label: 'Em Exibição',
            variant: 'outline',
            onClick: () => {
              // Esta ação será interceptada pelo componente pai para abrir o popup
              const event = new CustomEvent('openVideoDisplay', { detail: { orderId: order.id } });
              window.dispatchEvent(event);
            }
          }
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
  }, [order?.status, order?.videos, order?.id, order?.type]);

  const pixDialogProps = {
    isOpen: isPixDialogOpen,
    onClose: () => setIsPixDialogOpen(false),
    qrCodeBase64: paymentData?.qrCodeBase64,
    qrCodeText: paymentData?.qrCode,
    status: paymentData?.status === 'approved' ? 'approved' : 'pending',
    paymentId: paymentData?.paymentId,
    userId: order?.client_id,
    pedidoId: order?.id,
    createdAt: paymentData?.createdAt,
    onRefreshStatus: async () => {
      // Implementar refresh se necessário
    }
  };

  return {
    ...statusInfo,
    pixDialog: {
      isOpen: isPixDialogOpen,
      component: PixQrCodeDialog,
      props: pixDialogProps
    }
  };
};
