
interface CardWebhookData {
  cliente_id: string;
  pedido_id: string;
  email: string;
  nome: string;
  plano_escolhido: string;
  periodo_meses: number;
  predios_selecionados: Array<{
    id: string;
    nome: string;
    painel_ids: string[];
  }>;
  valor_total: string;
  periodo_exibicao: {
    inicio: string;
    fim: string;
  };
}

interface CardWebhookResponse {
  success: boolean;
  init_point?: string;
  preference_id?: string;
  id_transacao?: string;
  init_point_opcoes_pagamento?: string;
  error?: string;
  message?: string;
}

export const sendCardWebhookData = async (data: CardWebhookData): Promise<CardWebhookResponse> => {
  console.log('💳 [CardWebhook] Processing Mercado Pago card payment request', {
    pedido_id: data.pedido_id,
    valor: data.valor_total,
    cliente_id: data.cliente_id
  });

  try {
    // This service now processes card payments via Mercado Pago
    // The actual card processing happens through process-card-payment edge function
    return {
      success: true,
      message: 'Use process-card-payment edge function for Mercado Pago card processing'
    };
  } catch (error) {
    console.error('❌ [CardWebhook] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
