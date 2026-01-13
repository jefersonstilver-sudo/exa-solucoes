
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

    // MÁQUINA DE ESTADOS CANÔNICA v1.0
    // Upload só liberado após CONTRATO ASSINADO (não pagamento)
    // Status aguardando_contrato = pago mas sem contrato = BLOQUEADO
    // Status aguardando_video = contrato assinado = LIBERADO
    const allowedStatuses = ['aguardando_video', 'video_enviado', 'video_aprovado', 'ativo'];
    
    const canUpload = allowedStatuses.includes(order.status);

    console.log('🔍 [VideoSecurity] Resultado da validação:', {
      orderId,
      status: order.status,
      canUpload,
      allowedStatuses
    });

    // Status aguardando_contrato: Pagamento OK mas contrato pendente
    if (order.status === 'aguardando_contrato') {
      return {
        canUpload: false,
        reason: 'Contrato pendente de assinatura. Verifique seu email para assinar o contrato.',
        orderStatus: order.status
      };
    }

    // Bloqueados: Pedido foi bloqueado administrativamente
    if (order.status === 'bloqueado') {
      return {
        canUpload: false,
        reason: 'Pedido bloqueado. Entre em contato com o suporte para mais informações.',
        orderStatus: order.status
      };
    }

    if (!canUpload) {
      return {
        canUpload: false,
        reason: 'Upload não permitido para este status de pedido',
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

// MÁQUINA DE ESTADOS CANÔNICA v1.0 - Mapeamento de status para segurança
export const getOrderSecurityStatus = (status: string) => {
  const securityMap: Record<string, { level: string; message: string; description: string }> = {
    'pendente': {
      level: 'blocked',
      message: 'Aguardando pagamento',
      description: 'Upload será liberado após confirmação do pagamento e assinatura do contrato'
    },
    'aguardando_contrato': {
      level: 'blocked',
      message: 'Contrato pendente',
      description: 'Pagamento confirmado - aguardando assinatura do contrato. Verifique seu email.'
    },
    'aguardando_video': {
      level: 'allowed',
      message: 'Aguardando vídeo',
      description: 'Contrato assinado - envie seu vídeo para ativar a campanha'
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
    'finalizado': {
      level: 'completed',
      message: 'Campanha finalizada',
      description: 'Período de exibição encerrado'
    },
    'bloqueado': {
      level: 'blocked',
      message: 'Pedido bloqueado',
      description: 'Pedido bloqueado administrativamente. Entre em contato com o suporte.'
    },
    'cancelado': {
      level: 'blocked',
      message: 'Pedido cancelado',
      description: 'Este pedido foi cancelado'
    },
    'cancelado_automaticamente': {
      level: 'blocked',
      message: 'Pedido cancelado',
      description: 'Este pedido foi cancelado automaticamente'
    }
  };

  return securityMap[status] || {
    level: 'blocked',
    message: 'Status desconhecido',
    description: 'Entre em contato com o suporte'
  };
};
