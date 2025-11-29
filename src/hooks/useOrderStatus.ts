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

export const useOrderStatus = (order: any, onGeneratePix?: (orderId: string) => void) => {
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

    switch (status) {
      case 'pendente':
        return {
          label: 'Pagamento não realizado',
          description: 'Efetue o pagamento para ativar sua campanha',
          color: 'text-white',
          bgColor: 'bg-orange-600 border-orange-700',
          icon: CreditCard,
          action: {
            label: 'Pagar Agora',
            variant: 'default',
            onClick: onGeneratePix ? () => onGeneratePix(order.id) : undefined,
            href: !onGeneratePix ? `/payment?pedido=${order.id}` : undefined
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
        // NOTA: Este caso não deve mais acontecer devido ao trigger automático
        // que atualiza o status para 'video_aprovado' quando um vídeo é aprovado
        return {
          label: 'EM EXIBIÇÃO',
          description: 'Sua campanha está ativa e sendo exibida nos painéis',
          color: 'text-white',
          bgColor: 'bg-green-600 border-green-700',
          icon: Monitor,
          action: {
            label: 'Ver Detalhes',
            variant: 'outline',
            onClick: () => {
              const event = new CustomEvent('openVideoDisplay', { detail: { orderId: order.id } });
              window.dispatchEvent(event);
            }
          }
        };

      case 'video_aprovado':
        // NOVA LÓGICA: video_aprovado sempre significa "EM EXIBIÇÃO"
        // Uma vez aprovado o vídeo, o contrato está ativo e em exibição
        return {
          label: 'EM EXIBIÇÃO',
          description: 'Sua campanha está ativa e sendo exibida nos painéis',
          color: 'text-white',
          bgColor: 'bg-green-600 border-green-700',
          icon: Monitor,
          action: {
            label: 'Ver Detalhes',
            variant: 'outline',
            onClick: () => {
              // Esta ação será interceptada pelo componente pai para abrir o popup
              const event = new CustomEvent('openVideoDisplay', { detail: { orderId: order.id } });
              window.dispatchEvent(event);
            }
          }
        };

      case 'ativo':
        // Status 'ativo' também significa "EM EXIBIÇÃO"
        // Campanha ativa e sendo exibida nos painéis
        return {
          label: 'EM EXIBIÇÃO',
          description: 'Sua campanha está ativa e sendo exibida nos painéis',
          color: 'text-white',
          bgColor: 'bg-green-600 border-green-700',
          icon: Monitor,
          action: {
            label: 'Ver Detalhes',
            variant: 'outline',
            onClick: () => {
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
  }, [order?.status, order?.videos, order?.id, order?.type, onGeneratePix]);

  return statusInfo;
};