
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SecurityValidationResult {
  canUpload: boolean;
  reason?: string;
  orderStatus?: string;
}

export const validateVideoUploadPermission = async (orderId: string): Promise<SecurityValidationResult> => {
  try {
    console.log('🔐 [VideoSecurity] Validando permissão de upload para pedido:', orderId);
    
    // Buscar status do pedido
    const { data: order, error } = await supabase
      .from('pedidos')
      .select('status, valor_total')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('❌ [VideoSecurity] Pedido não encontrado:', error);
      return {
        canUpload: false,
        reason: 'Pedido não encontrado'
      };
    }

    const allowedStatuses = ['pago', 'pago_pendente_video', 'video_aprovado', 'ativo'];
    const canUpload = allowedStatuses.includes(order.status);

    console.log('🔍 [VideoSecurity] Resultado da validação:', {
      orderId,
      status: order.status,
      canUpload,
      allowedStatuses
    });

    if (!canUpload) {
      return {
        canUpload: false,
        reason: 'Upload permitido apenas para pedidos pagos',
        orderStatus: order.status
      };
    }

    return {
      canUpload: true,
      orderStatus: order.status
    };

  } catch (error) {
    console.error('💥 [VideoSecurity] Erro na validação:', error);
    return {
      canUpload: false,
      reason: 'Erro interno na validação de segurança'
    };
  }
};

export const getOrderSecurityStatus = (status: string) => {
  const securityMap = {
    'pendente': {
      level: 'blocked',
      message: 'Aguardando pagamento',
      description: 'Upload será liberado após confirmação do pagamento'
    },
    'pago': {
      level: 'allowed',
      message: 'Upload liberado',
      description: 'Pedido pago - você pode enviar vídeos'
    },
    'pago_pendente_video': {
      level: 'allowed',
      message: 'Aguardando vídeo',
      description: 'Pagamento confirmado - envie seu vídeo'
    },
    'video_enviado': {
      level: 'allowed',
      message: 'Vídeo em análise',
      description: 'Vídeo enviado e em processo de aprovação'
    },
    'video_aprovado': {
      level: 'allowed',
      message: 'Vídeo aprovado',
      description: 'Vídeo aprovado - selecione para ativar campanha'
    },
    'ativo': {
      level: 'active',
      message: 'Campanha ativa',
      description: 'Campanha em execução nos painéis'
    },
    'cancelado': {
      level: 'blocked',
      message: 'Pedido cancelado',
      description: 'Este pedido foi cancelado'
    }
  };

  return securityMap[status] || {
    level: 'blocked',
    message: 'Status desconhecido',
    description: 'Entre em contato com o suporte'
  };
};
