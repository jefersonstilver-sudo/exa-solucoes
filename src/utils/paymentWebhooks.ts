// SISTEMA RESTAURADO: Webhook N8N Real para PIX - VERSÃO CORRIGIDA
const PIX_WEBHOOK_URL = 'https://stilver.app.n8n.cloud/webhook/d8e707ae-093a-4e08-9069-8627eb9c1d19';

export interface PixWebhookData {
  cliente_id: string;
  pedido_id?: string; // 🔥 NOVO: ID do pedido criado
  transaction_id?: string; // 🔥 NOVO: ID único de rastreamento
  email: string;
  nome: string;
  plano_escolhido: string;
  periodo_meses: number;
  predios_selecionados: Array<{
    id: string;
    nome: string;
    painel_ids?: string[]; // 🔥 NOVO: IDs específicos dos painéis
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
  pedido_id?: string; // 🔥 NOVO: N8N deve retornar o pedido_id
  transaction_id?: string; // 🔥 NOVO: N8N deve retornar o transaction_id
  external_reference?: string; // 🔥 NOVO: Para MercadoPago
  message?: string;
  error?: string;
}

export const sendPixPaymentWebhook = async (data: PixWebhookData): Promise<PixWebhookResponse> => {
  console.log("🎯 SISTEMA CORRIGIDO - Enviando dados para webhook N8N:", PIX_WEBHOOK_URL);
  console.log("📊 Dados do PIX DETALHADOS:", JSON.stringify(data, null, 2));
  
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

    const response = await fetch(PIX_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'IndexaApp/1.0'
      },
      body: JSON.stringify(data),
      // Adicionar timeout
      signal: AbortSignal.timeout(30000) // 30 segundos
    });
    
    console.log("📡 SISTEMA CORRIGIDO - Resposta do webhook:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error("❌ Erro HTTP do webhook:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
      } catch (e) {
        console.error("❌ Erro ao ler resposta de erro:", e);
      }
      throw new Error(`Webhook falhou: ${response.status} - ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }
    
    // Tentar fazer parse da resposta com tratamento de erro melhorado
    let result;
    const responseText = await response.text();
    console.log("📄 SISTEMA CORRIGIDO - Texto bruto da resposta:", responseText);
    
    if (!responseText || responseText.trim() === '') {
      console.error("❌ Resposta vazia do webhook");
      throw new Error("Webhook retornou resposta vazia");
    }
    
    try {
      result = JSON.parse(responseText);
      console.log("✅ SISTEMA CORRIGIDO - JSON parseado com sucesso:", result);
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse do JSON:", parseError);
      console.error("❌ Resposta que causou erro:", responseText);
      
      // Se não é JSON, talvez seja um HTML de erro ou texto simples
      if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
        throw new Error("Webhook retornou uma página HTML em vez de JSON. Verifique a URL do webhook.");
      }
      
      throw new Error(`Resposta do webhook não é um JSON válido: ${parseError.message}`);
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
    
    console.log("🔍 SISTEMA CORRIGIDO - Verificação de dados PIX:", {
      hasPixData,
      availableFields: Object.keys(result),
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
        ...result
      };
      
      console.log("✅ SISTEMA CORRIGIDO - Dados PIX encontrados e formatados:", pixResponse);
      return pixResponse;
    } else {
      console.error("❌ SISTEMA CORRIGIDO - Resposta sem dados PIX:", result);
      
      // Se o webhook retornou sucesso mas sem dados PIX
      if (result.success === false && result.error) {
        throw new Error(`Erro do webhook: ${result.error}`);
      }
      
      throw new Error("Webhook não retornou dados PIX válidos. Campos esperados: pix_base64, pix_url");
    }
    
  } catch (error) {
    console.error("❌ SISTEMA CORRIGIDO - Erro completo no webhook:", {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Melhorar mensagens de erro para o usuário
    let userMessage = "Erro ao processar pagamento PIX";
    
    if (error.name === 'AbortError') {
      userMessage = "Timeout ao gerar PIX. Tente novamente.";
    } else if (error.message.includes('fetch')) {
      userMessage = "Erro de conexão ao gerar PIX. Verifique sua internet.";
    } else if (error.message.includes('JSON')) {
      userMessage = "Erro no servidor de pagamento. Tente novamente em alguns minutos.";
    } else if (error.message.includes('webhook')) {
      userMessage = error.message; // Usar mensagem específica do webhook
    }
    
    return {
      success: false,
      error: userMessage
    };
  }
};

export const getUserInfo = async (userId: string) => {
  try {
    console.log("👤 SISTEMA CORRIGIDO - Buscando dados do usuário:", userId);
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Buscar dados do usuário na tabela users
    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("❌ Erro ao buscar usuário na tabela users:", error);
    }
    
    // Buscar dados adicionais do auth se necessário
    let authUser = null;
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (!authError && authData.user) {
        authUser = authData.user;
      }
    } catch (authError) {
      console.error("❌ Erro ao buscar dados auth:", authError);
    }
    
    const email = user?.email || authUser?.email || '';
    const fullName = authUser?.user_metadata?.full_name || 
                     authUser?.user_metadata?.name || 
                     email.split('@')[0] || 
                     'Cliente';
    
    const userInfo = {
      email: email,
      nome: fullName
    };
    
    console.log("✅ SISTEMA CORRIGIDO - Dados do usuário encontrados:", userInfo);
    return userInfo;
    
  } catch (error) {
    console.error("❌ SISTEMA CORRIGIDO - Erro ao buscar informações do usuário:", error);
    return null;
  }
};
