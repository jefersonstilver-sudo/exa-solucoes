
import { PixWebhookData, PixWebhookResponse } from '@/types/pixWebhook';

const PIX_WEBHOOK_URL = 'https://stilver.app.n8n.cloud/webhook/d8e707ae-093a-4e08-9069-8627eb9c1d19';

export const sendPixPaymentWebhook = async (data: PixWebhookData): Promise<PixWebhookResponse> => {
  const timestamp = new Date().toISOString();
  
  console.log('[PixWebhookService] Enviando dados para webhook:', {
    url: PIX_WEBHOOK_URL,
    data,
    timestamp
  });
  
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

    console.log('[PixWebhookService] Payload sendo enviado:', webhookPayload);

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
    
    console.log('[PixWebhookService] Resposta recebida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('[PixWebhookService] Erro do servidor:', errorText);
      } catch (e) {
        console.error('[PixWebhookService] Erro ao ler resposta de erro:', e);
      }
      throw new Error(`Webhook falhou: ${response.status} - ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }
    
    let result;
    const responseText = await response.text();
    
    console.log('[PixWebhookService] Texto da resposta:', responseText);
    
    if (!responseText || responseText.trim() === '') {
      console.error('[PixWebhookService] Resposta vazia do webhook');
      throw new Error("Webhook retornou resposta vazia");
    }
    
    try {
      result = JSON.parse(responseText);
      console.log('[PixWebhookService] JSON parseado:', result);
    } catch (parseError) {
      console.error('[PixWebhookService] Erro ao parsear JSON:', parseError);
      
      if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
        throw new Error("Webhook retornou uma página HTML em vez de JSON. Verifique se o webhook está ativo.");
      }
      
      throw new Error(`Resposta não é um JSON válido: ${parseError.message}`);
    }
    
    // CORREÇÃO CRÍTICA: Tratar resposta como array
    if (Array.isArray(result) && result.length > 0) {
      console.log('[PixWebhookService] ✅ RESPOSTA É ARRAY - Usando primeiro elemento:', result[0]);
      result = result[0];
    }

    console.log('[PixWebhookService] 🎯 RESPOSTA FINAL PROCESSADA:', JSON.stringify(result, null, 2));
    
    // PRIORIDADE ABSOLUTA: Mapear init_point corretamente
    const initPoint = result["init_point_opçoes de pagamento"] || result.init_point;
    
    console.log('[PixWebhookService] 🚀 MAPEAMENTO INIT_POINT DEFINITIVO:', {
      'campo_original': 'init_point_opçoes de pagamento',
      'valor_encontrado': result["init_point_opçoes de pagamento"],
      'campo_fallback': 'init_point',
      'valor_fallback': result.init_point,
      'init_point_final': initPoint,
      'tem_init_point': !!initPoint,
      '🔗_URL_REDIRECIONAMENTO': initPoint
    });
    
    // RETORNO DEFINITIVO: Prioridade absoluta para init_point
    if (initPoint) {
      console.log('[PixWebhookService] ✅ INIT_POINT CONFIRMADO - RETORNANDO PARA REDIRECIONAMENTO:', initPoint);
      
      return {
        success: true,
        init_point: initPoint,
        pedido_id: result.pedido_id,
        transaction_id: result.transaction_id || result.id_transacao,
        message: 'Redirecionando para MercadoPago...',
        ...result
      };
    }
    
    // FALLBACK: Dados PIX apenas se não houver init_point
    const hasPixData = !!(
      result.pix_base64 || 
      result.qrCodeBase64 || 
      result.qr_code_base64 ||
      result.qrCode ||
      result.pix_url ||
      result.qrCodeText ||
      result.qr_code
    );
    
    console.log('[PixWebhookService] Verificação de dados PIX como fallback:', {
      hasPixData,
      pix_base64: !!result.pix_base64,
      qrCodeBase64: !!result.qrCodeBase64,
      pix_url: !!result.pix_url,
      qrCodeText: !!result.qrCodeText
    });
    
    if (hasPixData) {
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
      
      console.log('[PixWebhookService] Resposta PIX mapeada como fallback:', pixResponse);
      return pixResponse;
    }
    
    // Erro se não tem nem init_point nem dados PIX
    console.error('[PixWebhookService] ❌ ERRO: Webhook não retornou init_point nem dados PIX');
    throw new Error("Webhook não retornou método de pagamento válido");
    
  } catch (error: any) {
    console.error('[PixWebhookService] Erro completo:', error);
    
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
