
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
  Eye
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

export const useOrderStatus = (order: any) => {
  const statusInfo = useMemo((): OrderStatusInfo => {
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
          color: 'text-orange-700',
          bgColor: 'bg-orange-100 border-orange-200',
          icon: CreditCard,
          action: {
            label: 'Pagar com PIX',
            variant: 'default',
            onClick: () => {
              console.log('Abrir PIX para pedido:', order.id);
            }
          }
        };

      case 'pago':
      case 'pago_pendente_video':
        if (!hasVideos) {
          return {
            label: 'Aguardando Vídeo',
            description: 'Faça upload do seu vídeo para análise e aprovação',
            color: 'text-blue-700',
            bgColor: 'bg-blue-100 border-blue-200',
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
            color: 'text-purple-700',
            bgColor: 'bg-purple-100 border-purple-200',
            icon: Clock
          };
        }
        return {
          label: 'Vídeo Aprovado',
          description: 'Vídeo aprovado! Contrato iniciado automaticamente.',
          color: 'text-green-700',
          bgColor: 'bg-green-100 border-green-200',
          icon: CheckCircle
        };

      case 'video_aprovado':
        if (hasVideoInDisplay) {
          return {
            label: 'Ativo e em Exibição',
            description: 'Sua campanha está ativa e sendo exibida nos painéis',
            color: 'text-green-700',
            bgColor: 'bg-green-100 border-green-200',
            icon: Play,
            action: {
              label: 'Ver Relatório',
              variant: 'outline',
              href: `/anunciante/pedido/${order.id}#relatorio`
            }
          };
        }
        return {
          label: 'Contrato Iniciado',
          description: 'Vídeo aprovado, contrato iniciado. Selecione para exibição.',
          color: 'text-green-700',
          bgColor: 'bg-green-100 border-green-200',
          icon: CheckCircle
        };

      case 'ativo':
        return {
          label: 'Ativo e em Exibição',
          description: 'Sua campanha está ativa e sendo exibida nos painéis',
          color: 'text-green-700',
          bgColor: 'bg-green-100 border-green-200',
          icon: Play,
          action: {
            label: 'Ver Relatório',
            variant: 'outline',
            href: `/anunciante/pedido/${order.id}#relatorio`
          }
        };

      case 'video_rejeitado':
        return {
          label: 'Vídeo Rejeitado',
          description: 'Seu vídeo foi rejeitado. Envie um novo vídeo',
          color: 'text-red-700',
          bgColor: 'bg-red-100 border-red-200',
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
          color: 'text-red-700',
          bgColor: 'bg-red-100 border-red-200',
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
          color: 'text-gray-700',
          bgColor: 'bg-gray-100 border-gray-200',
          icon: XCircle
        };

      default:
        return {
          label: 'Status Desconhecido',
          description: 'Entre em contato com o suporte',
          color: 'text-gray-700',
          bgColor: 'bg-gray-100 border-gray-200',
          icon: AlertTriangle
        };
    }
  }, [order?.status, order?.videos, order?.id]);

  return statusInfo;
};
