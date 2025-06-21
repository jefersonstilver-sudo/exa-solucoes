import { PixWebhookData, PixWebhookResponse } from '@/types/pixWebhook';

const PIX_WEBHOOK_URL = 'https://stilver.app.n8n.cloud/webhook-test/d8e707ae-093a-4e08-9069-8627eb9c1d19';

export const sendPixPaymentWebhook = async (data: PixWebhookData): Promise<PixWebhookResponse> => {
  const timestamp = new Date().toISOString();
  console.log("🎯 SISTEMA CORRIGIDO - Enviando dados para webhook N8N:", PIX_WEBHOOK_URL);
  console.log("⏰ TIMESTAMP:", timestamp);
  console.log("📊 Dados do PIX COMPLETOS:", JSON.stringify(data, null, 2));
  
  try {
    // Validar dados antes de enviar
    if (!data.cliente_id || !data.email || !data.nome) {
      console.error("❌ Dados obrigatórios faltando:", { 
        cliente_id: !!data.cliente_id, 
        email: !!data.email, 
        nome: !!data.nome 
      });
      throw new Error("Dados obrigatórios do cliente estão faltando");
    }

    if (!data.predios_selecionados || data.predios_selecionados.length === 0) {
      console.error("❌ Nenhum prédio selecionado");
      throw new Error("Nenhum prédio foi selecionado para a campanha");
    }

    // Dados completos com timestamp para rastreamento
    const webhookPayload = {
      ...data,
      timestamp,
      webhook_version: "2.0",
      source: "indexa-app"
    };

    console.log("🚀 ENVIANDO PAYLOAD COMPLETO PARA N8N:", JSON.stringify(webhookPayload, null, 2));

    const response = await fetch(PIX_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'IndexaApp/2.0',
        'X-Timestamp': timestamp
      },
      body: JSON.stringify(webhookPayload),
      // Adicionar timeout
      signal: AbortSignal.timeout(30000) // 30 segundos
    });
    
    console.log("📡 RESPOSTA DO N8N WEBHOOK:", {
      status: response.status,
      statusText: response.statusText,
      url: PIX_WEBHOOK_URL,
      headers: Object.fromEntries(response.headers.entries()),
      timestamp
    });
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error("❌ Erro HTTP do N8N webhook:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: PIX_WEBHOOK_URL
        });
      } catch (e) {
        console.error("❌ Erro ao ler resposta de erro do N8N:", e);
      }
      throw new Error(`N8N Webhook falhou: ${response.status} - ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }
    
    // Tentar fazer parse da resposta com tratamento de erro melhorado
    let result;
    const responseText = await response.text();
    console.log("📄 RESPOSTA BRUTA DO N8N:", responseText);
    
    if (!responseText || responseText.trim() === '') {
      console.error("❌ N8N retornou resposta vazia");
      throw new Error("N8N webhook retornou resposta vazia");
    }
    
    try {
      result = JSON.parse(responseText);
      console.log("✅ JSON DO N8N PARSEADO:", result);
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse do JSON do N8N:", parseError);
      console.error("❌ Resposta que causou erro:", responseText);
      
      // Se não é JSON, talvez seja um HTML de erro ou texto simples
      if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
        throw new Error("N8N retornou uma página HTML em vez de JSON. Verifique se o webhook está ativo.");
      }
      
      throw new Error(`Resposta do N8N não é um JSON válido: ${parseError.message}`);
    }
    
    // Verificar se tem dados PIX na resposta - MÚLTIPLOS FORMATOS
    const hasPixData = !!(
      result.pix_base64 || 
      result.qrCodeBase64 || 
      result.qr_code_base64 ||
      result.qrCode ||
      result.pix_url ||
      result.qrCodeText ||
      result.qr_code
    );
    
    console.log("🔍 VERIFICAÇÃO DE DADOS PIX DO N8N:", {
      hasPixData,
      availableFields: Object.keys(result),
      pix_base64: !!result.pix_base64,
      qrCodeBase64: !!result.qrCodeBase64,
      pix_url: !!result.pix_url,
      qrCodeText: !!result.qrCodeText,
      timestamp
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
        ...result
      };
      
      console.log("✅ DADOS PIX RECEBIDOS DO N8N:", pixResponse);
      return pixResponse;
    } else {
      console.error("❌ N8N não retornou dados PIX:", result);
      
      // Se o webhook retornou sucesso mas sem dados PIX
      if (result.success === false && result.error) {
        throw new Error(`Erro do N8N: ${result.error}`);
      }
      
      throw new Error("N8N não retornou dados PIX válidos. Campos esperados: pix_base64, pix_url");
    }
    
  } catch (error) {
    console.error("❌ ERRO COMPLETO NO N8N WEBHOOK:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      url: PIX_WEBHOOK_URL,
      timestamp
    });
    
    // Melhorar mensagens de erro para o usuário
    let userMessage = "Erro ao processar pagamento PIX";
    
    if (error.name === 'AbortError') {
      userMessage = "Timeout ao conectar com N8N. Tente novamente.";
    } else if (error.message.includes('fetch')) {
      userMessage = "Erro de conexão com N8N. Verifique sua internet.";
    } else if (error.message.includes('JSON')) {
      userMessage = "Erro na resposta do N8N. Tente novamente em alguns minutos.";
    } else if (error.message.includes('N8N')) {
      userMessage = error.message; // Usar mensagem específica do N8N
    }
    
    return {
      success: false,
      error: userMessage
    };
  }
};
