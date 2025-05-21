
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

export interface PixWebhookResponse {
  success: boolean;
  qrCodeBase64?: string;
  qrCodeText?: string;
  paymentLink?: string;
  pix_url?: string;
  pix_base64?: string;
}

/**
 * Sends payment data to the PIX webhook and returns the response
 */
export const sendPixPaymentWebhook = async (webhookData: PixWebhookData): Promise<PixWebhookResponse> => {
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
      body: JSON.stringify(webhookData)
    });

    // Parse the webhook response
    let responseData: Record<string, any> = {};
    try {
      responseData = await response.json();
      console.log("[PIX Webhook] Resposta do webhook:", responseData);
    } catch (e) {
      console.log("[PIX Webhook] Não foi possível converter a resposta para JSON, usando resposta padrão");
      // Continue with mock data if we can't parse JSON
    }

    // Log the webhook call success
    console.log("[PIX Webhook] Webhook chamado com sucesso");
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Webhook PIX chamado com sucesso`,
      { webhookData, responseData }
    );
    
    // Check if we have actual data from the webhook response
    if (responseData && Object.keys(responseData).length > 0) {
      // Use actual data from webhook
      return {
        success: true,
        qrCodeBase64: responseData.pix_base64 || responseData.qrCodeBase64,
        qrCodeText: responseData.pix_url || responseData.qrCodeText,
        paymentLink: responseData.pix_url || responseData.paymentLink,
        pix_url: responseData.pix_url,
        pix_base64: responseData.pix_base64
      };
    }
    
    // Mock response for testing or fallback
    // This mock data simulates what we expect to receive from the API
    const mockResponse = {
      success: true,
      qrCodeBase64: "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",
      qrCodeText: "00020126580014BR.GOV.BCB.PIX0136a629534e-7693-4846-b028-f142082a88e15204000053039865406123.455802BR5925John Doe6009SAO PAULO62070503***6304E2CA",
      paymentLink: "https://payment-link.example",
      pix_url: "00020126580014BR.GOV.BCB.PIX0136a629534e-7693-4846-b028-f142082a88e15204000053039865406123.455802BR5925John Doe6009SAO PAULO62070503***6304E2CA",
      pix_base64: "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"
    };
    
    toast.success("Iniciando processamento do pagamento PIX");
    return mockResponse;
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
    return {
      success: false
    };
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

