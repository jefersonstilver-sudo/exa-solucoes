
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
    // Send data to webhook
    const webhookUrl = "https://stilver.app.n8n.cloud/webhook-test/d8e707ae-093a-4e08-9069-8627eb9c1d19";
    
    console.log("Enviando dados para webhook:", webhookData);
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
      mode: 'no-cors' // Important for cross-origin webhook calls
    });

    // Log the webhook call
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Webhook chamado para pagamento PIX`,
      { webhookData }
    );
    
    return true;
  } catch (error) {
    console.error("Erro ao chamar webhook:", error);
    return false;
  }
};

/**
 * Gets user information from Supabase
 */
export const getUserInfo = async (userId: string): Promise<{email: string; nome: string} | null> => {
  try {
    // Fix: Query the 'users' table instead of 'clientes'
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error("Erro ao buscar dados do usuário:", userError);
      return null;
    }

    return {
      email: userData?.email || '',
      nome: userData?.email?.split('@')[0] || 'Cliente'
    };
  } catch (error) {
    console.error("Error fetching user info:", error);
    return null;
  }
};
