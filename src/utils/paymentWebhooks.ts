
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

export interface PixWebhookData {
  cliente_id: string;
  email: string;
  nome: string;
  plano_escolhido: string;
  predios_selecionados: Array<{id: string, nome: string}>;
  valor_total: string;
  periodo_exibicao: string | {
    inicio?: string;
    fim?: string;
  };
}

/**
 * Sends payment data to the PIX webhook as URL parameters instead of JSON body
 */
export const sendPixPaymentWebhook = async (webhookData: PixWebhookData): Promise<boolean> => {
  try {
    // Fixed webhook URL from the user's input
    const baseWebhookUrl = "https://stilver.app.n8n.cloud/webhook-test/d8e707ae-093a-4e08-9069-8627eb9c1d19";
    
    // Log before attempting to send the webhook
    console.log("[PIX Webhook] Preparando dados para webhook como parâmetros:", webhookData);
    
    // Create URL with parameters
    const url = new URL(baseWebhookUrl);
    
    // Add simple parameters
    url.searchParams.append('cliente_id', webhookData.cliente_id);
    url.searchParams.append('email', webhookData.email);
    url.searchParams.append('nome', webhookData.nome);
    url.searchParams.append('plano_escolhido', webhookData.plano_escolhido);
    url.searchParams.append('valor_total', webhookData.valor_total);
    
    // Handle complex parameters - predios_selecionados
    // For arrays, we'll add each item as a separate parameter with index
    webhookData.predios_selecionados.forEach((predio, index) => {
      url.searchParams.append(`predio_id_${index}`, predio.id);
      url.searchParams.append(`predio_nome_${index}`, predio.nome);
    });
    
    // Handle periodo_exibicao
    if (typeof webhookData.periodo_exibicao === 'string') {
      url.searchParams.append('periodo_exibicao', webhookData.periodo_exibicao);
    } else {
      if (webhookData.periodo_exibicao.inicio) {
        url.searchParams.append('periodo_inicio', webhookData.periodo_exibicao.inicio);
      }
      if (webhookData.periodo_exibicao.fim) {
        url.searchParams.append('periodo_fim', webhookData.periodo_exibicao.fim);
      }
    }
    
    // Log the constructed URL
    console.log("[PIX Webhook] URL do webhook com parâmetros:", url.toString());
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Iniciando chamada do webhook PIX com parâmetros`,
      { webhookUrl: url.toString() }
    );
    
    // Send GET request with parameters in URL
    const response = await fetch(url, {
      method: 'GET', // Changed to GET since we're using URL parameters
      mode: 'no-cors' // Important for cross-origin webhook calls
    });

    // Log the webhook call success
    console.log("[PIX Webhook] Webhook chamado com sucesso");
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Webhook PIX chamado com sucesso`,
      { url: url.toString() }
    );
    
    toast.success("Iniciando processamento do pagamento PIX");
    return true;
  } catch (error) {
    // Enhanced error logging
    console.error("[PIX Webhook] Erro ao chamar webhook:", error);
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_ERROR,
      LogLevel.ERROR,
      `Erro ao chamar webhook PIX: ${error}`,
      { error: String(error) }
    );
    
    toast.error("Erro ao processar pagamento PIX. Tente novamente.");
    return false;
  }
};

/**
 * Gets user information directly from provided client ID and email
 * Rather than querying the database, we use the data we already have
 */
export const getUserInfo = async (userId: string, userEmail?: string): Promise<{email: string; nome: string} | null> => {
  try {
    if (!userId) {
      console.error("[PIX Webhook] ID de usuário não fornecido");
      return null;
    }
    
    // Use the provided email or get it from the session
    let email = userEmail || "";
    
    // If we don't have an email yet, try to get it from the auth session as a fallback
    if (!email) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.email) {
        email = data.session.user.email;
      }
    }
    
    if (!email) {
      console.error("[PIX Webhook] Email não disponível para o usuário");
      return null;
    }
    
    // Extract a name from the email (before the @ symbol)
    // or use "Cliente" as a fallback
    const nome = email.split('@')[0] || 'Cliente';
    
    return {
      email,
      nome
    };
  } catch (error) {
    console.error("[PIX Webhook] Erro ao obter informações do usuário:", error);
    return null;
  }
};
