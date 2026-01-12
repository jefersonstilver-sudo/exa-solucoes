
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

    // FLUXO OPÇÃO B: Upload só liberado após CONTRATO ASSINADO (não pagamento)
    // Status aguardando_contrato = pago mas sem contrato = BLOQUEADO
    // Status aguardando_video = contrato assinado = LIBERADO
    const allowedStatuses = ['aguardando_video', 'video_enviado', 'video_aprovado', 'ativo'];
    
    // Manter retrocompatibilidade temporária com status legado
    const legacyAllowed = ['pago', 'pago_pendente_video'];
    const isLegacyStatus = legacyAllowed.includes(order.status);
    
    const canUpload = allowedStatuses.includes(order.status);

    console.log('🔍 [VideoSecurity] Resultado da validação:', {
      orderId,
      status: order.status,
      canUpload,
      isLegacyStatus,
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

    // Status legado com aviso
    if (isLegacyStatus && !canUpload) {
      console.warn('⚠️ [VideoSecurity] Status legado detectado:', order.status);
      return {
        canUpload: false,
        reason: 'Contrato pendente de assinatura. Entre em contato com o suporte.',
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
    'pago': {
      level: 'blocked', // Legado - tratar como aguardando_contrato
      message: 'Verificando contrato',
      description: 'Aguardando verificação do contrato'
    },
    'pago_pendente_video': {
      level: 'blocked', // Legado - tratar como aguardando_contrato
      message: 'Verificando contrato',
      description: 'Aguardando verificação do contrato'
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
