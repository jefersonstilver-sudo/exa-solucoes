
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
 * Sends payment data to the PIX webhook
 */
export const sendPixPaymentWebhook = async (webhookData: PixWebhookData): Promise<boolean> => {
  try {
    // Fixed webhook URL from the user's input
    const webhookUrl = "https://stilver.app.n8n.cloud/webhook-test/d8e707ae-093a-4e08-9069-8627eb9c1d19";
    
    // Log before attempting to send the webhook
    console.log("[PIX Webhook] Enviando dados para webhook:", JSON.stringify(webhookData, null, 2));
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Iniciando chamada do webhook PIX`,
      { webhookUrl, paymentData: webhookData }
    );
    
    // Send data to webhook with improved error handling
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
      mode: 'no-cors' // Important for cross-origin webhook calls
    });

    // Log the webhook call success
    console.log("[PIX Webhook] Webhook chamado com sucesso");
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Webhook PIX chamado com sucesso`,
      { webhookData }
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
