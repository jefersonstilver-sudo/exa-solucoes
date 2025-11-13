
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
  console.log('🏦 [CardWebhook] DEPRECATED - Card payments now use Stripe Checkout');

  return {
    success: false,
    error: 'Card webhook deprecated - use Stripe Checkout via process-payment edge function'
  };
};
