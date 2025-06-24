
import { PixWebhookData, PixWebhookResponse } from '@/types/pixWebhook';

const PIX_WEBHOOK_URL = 'https://stilver.app.n8n.cloud/webhook-test/d8e707ae-093a-4e08-9069-8627eb9c1d19';

export const sendPixPaymentWebhook = async (data: PixWebhookData): Promise<PixWebhookResponse> => {
  const timestamp = new Date().toISOString();
  
  try {
    // Validar dados antes de enviar
    if (!data.cliente_id || !data.email || !data.nome) {
      throw new Error("Dados obrigatórios do cliente estão faltando");
    }

    if (!data.predios_selecionados || data.predios_selecionados.length === 0) {
      throw new Error("Nenhum prédio foi selecionado para a campanha");
    }

    // Dados completos com timestamp para rastreamento
    const webhookPayload = {
      ...data,
      timestamp,
      webhook_version: "2.0",
      source: "indexa-app",
      environment: "production"
    };

    const response = await fetch(PIX_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'IndexaApp/2.0',
        'X-Timestamp': timestamp
      },
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        // Ignore
      }
      throw new Error(`Webhook falhou: ${response.status} - ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }
    
    let result;
    const responseText = await response.text();
    
    if (!responseText || responseText.trim() === '') {
      throw new Error("Webhook retornou resposta vazia");
    }
    
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
        throw new Error("Webhook retornou uma página HTML em vez de JSON. Verifique se o webhook está ativo.");
      }
      
      throw new Error(`Resposta não é um JSON válido: ${parseError.message}`);
    }
    
    // Verificar se tem dados PIX
    const hasPixData = !!(
      result.pix_base64 || 
      result.qrCodeBase64 || 
      result.qr_code_base64 ||
      result.qrCode ||
      result.pix_url ||
      result.qrCodeText ||
      result.qr_code
    );
    
    if (hasPixData) {
      // Mapear para o formato esperado pelo frontend
      const pixResponse = {
        success: true,
        qrCodeBase64: result.pix_base64 || result.qrCodeBase64 || result.qr_code_base64,
        qrCodeText: result.pix_url || result.qrCodeText || result.qr_code,
        paymentLink: result.paymentLink || result.payment_link,
        pix_url: result.pix_url,
        pix_base64: result.pix_base64,
        message: result.message,
        id_transacao: result.id_transacao,
        ...result
      };
      
      return pixResponse;
    } else {
      if (result.success === false && result.error) {
        throw new Error(`Erro do webhook: ${result.error}`);
      }
      
      throw new Error("Webhook não retornou dados PIX válidos");
    }
    
  } catch (error) {
    let userMessage = "Erro ao processar pagamento PIX";
    
    if (error.name === 'AbortError') {
      userMessage = "Timeout ao conectar com o serviço de pagamento. Tente novamente.";
    } else if (error.message.includes('fetch')) {
      userMessage = "Erro de conexão. Verifique sua internet.";
    } else if (error.message.includes('JSON')) {
      userMessage = "Erro na resposta do serviço. Tente novamente em alguns minutos.";
    } else if (error.message.includes('Webhook')) {
      userMessage = error.message;
    }
    
    return {
      success: false,
      error: userMessage
    };
  }
};
