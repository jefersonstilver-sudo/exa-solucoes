import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  proposalId: string;
  clientEmail?: string;
  selectedPlan: 'avista' | 'fidelidade';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId, clientEmail, selectedPlan } = await req.json() as RequestBody;

    console.log('📧 Enviando email de ACEITAÇÃO imediata:', { proposalId, clientEmail, selectedPlan });

    if (!proposalId) {
      throw new Error('proposalId é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }
    const resend = new Resend(resendApiKey);

    // Fetch proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error(`Proposta não encontrada: ${proposalError?.message}`);
    }

    const emailToSend = clientEmail || proposal.client_email;
    if (!emailToSend) {
      console.log('⚠️ Nenhum email disponível, pulando envio');
      return new Response(
        JSON.stringify({ success: true, message: 'Sem email para enviar', skipped: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch seller info
    let sellerName = 'Equipe EXA';
    let sellerPhone = '(45) 99141-5856';
    
    if (proposal.created_by) {
      const { data: userData } = await supabase
        .from('users')
        .select('nome, telefone')
        .eq('id', proposal.created_by)
        .single();
      
      if (userData?.nome) sellerName = userData.nome;
      if (userData?.telefone) sellerPhone = userData.telefone;
    }

    // Calculate values
    const buildings = proposal.selected_buildings || [];
    const buildingIds = buildings.map((b: any) => b.building_id).filter(Boolean);
    let realTotalPanels = proposal.total_panels || 0;
    
    if (buildingIds.length > 0) {
      const { data: buildingsData } = await supabase
        .from('buildings')
        .select('id, quantidade_telas, numero_elevadores')
        .in('id', buildingIds);
      
      if (buildingsData) {
        realTotalPanels = buildingsData.reduce((sum, b) => sum + (b.quantidade_telas || b.numero_elevadores || 1), 0);
      }
    }

    // Plan discount
    const planDiscountMap: Record<number, number> = { 1: 0, 3: 20, 6: 30, 12: 37.5 };
    const planDiscount = planDiscountMap[proposal.duration_months] || 0;
    const pixDiscount = selectedPlan === 'avista' ? 10 : 0;

    // Format values
    const formatCurrency = (value: number) => 
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const planLabel = selectedPlan === 'avista' 
      ? `PIX à Vista (${planDiscount > 0 ? planDiscount + '% + ' : ''}10% OFF)`
      : `Fidelidade (${planDiscount}% OFF)`;

    const finalValue = selectedPlan === 'avista' 
      ? proposal.cash_total_value 
      : proposal.fidel_monthly_value * proposal.duration_months;

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #9C1E1E 0%, #7A1616 100%); padding: 40px 40px 30px; text-align: center;">
              <img src="https://examidia.com.br/logo-exa-branco.png" alt="EXA Mídia" style="height: 50px; margin-bottom: 20px;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">🎉 Parabéns!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 10px 0 0;">Sua proposta foi aceita com sucesso</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá <strong>${proposal.client_name}</strong>,
              </p>
              
              <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                Ficamos muito felizes em informar que você aceitou a proposta <strong>#${proposal.number}</strong>! 
                Agora é só aguardar os dados de pagamento que serão enviados em instantes.
              </p>
              
              <!-- Resumo Card -->
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                <h3 style="color: #333; font-size: 16px; margin: 0 0 16px; font-weight: 600;">📋 Resumo da Proposta</h3>
                
                <table width="100%" style="font-size: 14px;">
                  <tr>
                    <td style="color: #666; padding: 8px 0;">Proposta Nº</td>
                    <td style="color: #333; font-weight: 600; text-align: right;">#${proposal.number}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; padding: 8px 0;">Prédios</td>
                    <td style="color: #333; font-weight: 600; text-align: right;">${buildings.length} ${buildings.length === 1 ? 'prédio' : 'prédios'}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; padding: 8px 0;">Telas</td>
                    <td style="color: #333; font-weight: 600; text-align: right;">${realTotalPanels} ${realTotalPanels === 1 ? 'tela' : 'telas'}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; padding: 8px 0;">Duração</td>
                    <td style="color: #333; font-weight: 600; text-align: right;">${proposal.duration_months} ${proposal.duration_months === 1 ? 'mês' : 'meses'}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; padding: 8px 0;">Plano Escolhido</td>
                    <td style="color: #9C1E1E; font-weight: 600; text-align: right;">${planLabel}</td>
                  </tr>
                </table>
                
                <div style="border-top: 1px solid #dee2e6; margin-top: 16px; padding-top: 16px;">
                  <table width="100%">
                    <tr>
                      <td style="color: #333; font-size: 16px; font-weight: 600;">Valor Total</td>
                      <td style="color: #9C1E1E; font-size: 20px; font-weight: 700; text-align: right;">${formatCurrency(finalValue)}</td>
                    </tr>
                  </table>
                </div>
              </div>
              
              <!-- Next Steps -->
              <div style="background-color: #fff8e1; border-radius: 12px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #ffc107;">
                <h4 style="color: #856404; font-size: 14px; margin: 0 0 12px; font-weight: 600;">⏳ Próximos Passos</h4>
                <p style="color: #856404; font-size: 14px; line-height: 1.5; margin: 0;">
                  Em instantes você receberá outro e-mail com o <strong>QR Code PIX</strong> ou <strong>Boleto</strong> para pagamento. 
                  Fique de olho na sua caixa de entrada!
                </p>
              </div>
              
              <!-- Seller Contact -->
              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center;">
                <p style="color: #666; font-size: 14px; margin: 0 0 8px;">Dúvidas? Fale com seu consultor:</p>
                <p style="color: #333; font-size: 16px; font-weight: 600; margin: 0 0 4px;">${sellerName}</p>
                <a href="https://wa.me/55${sellerPhone.replace(/\D/g, '')}" style="color: #25D366; font-size: 14px; text-decoration: none; font-weight: 500;">
                  📱 ${sellerPhone}
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 30px 40px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} EXA Mídia. Todos os direitos reservados.
              </p>
              <p style="color: #666; font-size: 11px; margin: 10px 0 0;">
                Este e-mail foi enviado para ${emailToSend}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send email
    console.log('📤 Enviando e-mail de aceitação para:', emailToSend);
    
    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: 'EXA Mídia <comercial@examidia.com.br>',
      to: [emailToSend],
      subject: `🎉 Parabéns! Proposta #${proposal.number} Aceita - EXA Mídia`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('❌ Erro ao enviar e-mail:', emailError);
      throw emailError;
    }

    console.log('✅ E-mail de aceitação enviado:', emailResponse);

    // Log action
    await supabase.from('proposal_logs').insert({
      proposal_id: proposalId,
      action: 'email_aceitacao_enviado',
      details: {
        email: emailToSend,
        selected_plan: selectedPlan,
        resend_id: emailResponse?.id,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'E-mail de aceitação enviado',
        email: emailToSend,
        resendId: emailResponse?.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ Erro:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
