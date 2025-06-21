
// SISTEMA RESTAURADO: Webhook N8N Real para PIX
const PIX_WEBHOOK_URL = 'https://stilver.app.n8n.cloud/webhook/d8e707ae-093a-4e08-9069-8627eb9c1d19';

export interface PixWebhookData {
  cliente_id: string;
  email: string;
  nome: string;
  plano_escolhido: string;
  periodo_meses: number;
  predios_selecionados: Array<{
    id: string;
    nome: string;
  }>;
  valor_total: string;
  periodo_exibicao: {
    inicio: string;
    fim: string;
  };
}

export interface PixWebhookResponse {
  success: boolean;
  qrCodeBase64?: string;
  qrCodeText?: string;
  paymentLink?: string;
  pix_url?: string;
  pix_base64?: string;
  message?: string;
  error?: string;
}

export const sendPixPaymentWebhook = async (data: PixWebhookData): Promise<PixWebhookResponse> => {
  console.log("🎯 SISTEMA RESTAURADO - Enviando dados para webhook N8N:", PIX_WEBHOOK_URL);
  console.log("📊 Dados do PIX:", data);
  
  try {
    const response = await fetch(PIX_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    console.log("📡 Resposta do webhook - Status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro HTTP do webhook:", errorText);
      throw new Error(`Webhook falhou: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("✅ SISTEMA RESTAURADO - Resposta do webhook:", result);
    
    // Verificar se tem dados PIX na resposta
    if (result.pix_base64 || result.qrCodeBase64) {
      return {
        success: true,
        qrCodeBase64: result.pix_base64 || result.qrCodeBase64,
        qrCodeText: result.pix_url || result.qrCodeText,
        paymentLink: result.paymentLink,
        pix_url: result.pix_url,
        pix_base64: result.pix_base64,
        ...result
      };
    } else {
      console.error("❌ Resposta sem dados PIX:", result);
      throw new Error("Webhook não retornou dados PIX válidos");
    }
    
  } catch (error) {
    console.error("❌ SISTEMA RESTAURADO - Erro no webhook:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido no webhook'
    };
  }
};

export const getUserInfo = async (userId: string) => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data: user, error } = await supabase
      .from('users')
      .select('email, nome, full_name')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Erro ao buscar usuário:", error);
      return null;
    }
    
    return {
      email: user.email || '',
      nome: user.nome || user.full_name || 'Cliente'
    };
  } catch (error) {
    console.error("Erro ao importar supabase:", error);
    return null;
  }
};
