
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
  error?: string;
  message?: string;
}

export const sendCardWebhookData = async (data: CardWebhookData): Promise<CardWebhookResponse> => {
  console.log('🏦 [CardWebhook] Enviando dados para webhook de cartão:', {
    cliente_id: data.cliente_id,
    valor_total: data.valor_total,
    predios_count: data.predios_selecionados.length,
    plano: data.plano_escolhido
  });

  try {
    const response = await fetch('https://stilver.app.n8n.cloud/webhook/cartão_pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('🏦 [CardWebhook] Resposta recebida:', {
      success: result.success,
      has_init_point: !!result.init_point,
      has_preference_id: !!result.preference_id
    });

    return {
      success: true,
      init_point: result.init_point,
      preference_id: result.preference_id,
      message: result.message || 'Dados enviados com sucesso'
    };

  } catch (error: any) {
    console.error('🏦 [CardWebhook] Erro ao enviar dados:', error);
    
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao processar pagamento com cartão'
    };
  }
};
