
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
 * Gets user information from Supabase
 */
export const getUserInfo = async (userId: string): Promise<{email: string; nome: string} | null> => {
  try {
    // Query the 'users' table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error("[PIX Webhook] Erro ao buscar dados do usuário:", userError);
      return null;
    }

    return {
      email: userData?.email || '',
      nome: userData?.email?.split('@')[0] || 'Cliente'
    };
  } catch (error) {
    console.error("[PIX Webhook] Error fetching user info:", error);
    return null;
  }
};
