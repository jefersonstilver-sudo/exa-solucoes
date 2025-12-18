import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContractEmailPayload {
  pedidoId: string;
  clientEmail: string;
  clientName: string;
  contratoId?: string;
  clicksignUrl?: string;
  orderSummary?: {
    valorTotal: number;
    planoMeses: number;
    totalPaineis: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: ContractEmailPayload = await req.json();
    const { pedidoId, clientEmail, clientName, contratoId, clicksignUrl, orderSummary } = payload;

    console.log('📧 [SEND-CONTRACT-EMAIL] Iniciando envio:', { pedidoId, clientEmail, clientName });

    if (!pedidoId || !clientEmail) {
      return new Response(JSON.stringify({ error: 'pedidoId e clientEmail são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get first name from full name
    const firstName = clientName?.split(' ')[0] || 'Cliente';

    // Format currency
    const formatCurrency = (value: number) => 
      `R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // Build professional minimal email HTML
    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu Contrato Está Pronto</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Logo -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center;">
              <img src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/public-assets/hexa-logo-dark.png" alt="Hexa Mídia" style="height: 40px; width: auto;" />
            </td>
          </tr>
          
          <!-- Title -->
          <tr>
            <td style="padding: 0 32px 16px 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111111; line-height: 1.3;">
                Seu contrato está pronto!
              </h1>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 0 32px 24px 32px; text-align: center;">
              <p style="margin: 0; font-size: 16px; color: #666666; line-height: 1.6;">
                Olá ${firstName}, seu contrato de publicidade está pronto para assinatura.
              </p>
            </td>
          </tr>
          
          <!-- Order Summary Box -->
          ${orderSummary ? `
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" style="width: 100%; background-color: #f9f9f9; border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #888888;">Pedido</p>
                    <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111111;">#${pedidoId.substring(0, 8).toUpperCase()}</p>
                    
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #888888;">Valor Total</p>
                    <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111111;">${formatCurrency(orderSummary.valorTotal)}</p>
                    
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #888888;">Período</p>
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111111;">${orderSummary.planoMeses} ${orderSummary.planoMeses === 1 ? 'mês' : 'meses'}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <a href="${clicksignUrl || `https://indexamidia.com.br/contrato/${contratoId}`}" 
                 style="display: block; background-color: #9C1E1E; color: #ffffff; text-align: center; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 600;">
                Assinar Contrato
              </a>
            </td>
          </tr>
          
          <!-- Footer note -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #999999; line-height: 1.5;">
                Este link é exclusivo e seguro. A assinatura é realizada via ClickSign, 
                plataforma de assinatura digital com validade jurídica.
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 0;" />
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #999999;">
                Dúvidas? Fale conosco
              </p>
              <p style="margin: 0; font-size: 13px; color: #666666;">
                comercial@indexamidia.com.br | (45) 99141-5856
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email via Resend
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY não configurada');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Serviço de e-mail não configurado' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Hexa Mídia <noreply@indexamidia.com.br>',
        to: clientEmail,
        subject: '📝 Seu Contrato Está Pronto para Assinatura',
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('❌ Erro ao enviar e-mail via Resend:', errorText);
      throw new Error(`Erro ao enviar e-mail: ${errorText}`);
    }

    const resendData = await resendResponse.json();
    console.log('✅ E-mail enviado com sucesso:', resendData);

    // Update pedido with contract email sent status
    await supabase
      .from('pedidos')
      .update({ 
        contrato_status: 'enviado',
        contrato_enviado_em: new Date().toISOString()
      })
      .eq('id', pedidoId);

    console.log('✅ Status do pedido atualizado para enviado');

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: resendData.id,
      message: 'E-mail do contrato enviado com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('💥 Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
