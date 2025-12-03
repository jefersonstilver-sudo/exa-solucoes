import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";
import { createProposalAcceptedEmail } from "../_shared/email-templates/proposal-accepted.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentData {
  method: 'pix' | 'boleto';
  qrCode?: string;
  qrCodeBase64?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  dueDate?: string;
}

interface RequestBody {
  proposalId: string;
  clientEmail?: string;
  selectedPlan: 'avista' | 'fidelidade';
  paymentMethod?: 'pix' | 'boleto';
  paymentData?: PaymentData;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId, clientEmail, selectedPlan, paymentMethod, paymentData } = await req.json() as RequestBody;

    console.log('📧 Iniciando envio de email de proposta aceita:', { proposalId, clientEmail, selectedPlan, paymentMethod });

    if (!proposalId) {
      throw new Error('proposalId é obrigatório');
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Resend
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

    console.log('✅ Proposta encontrada:', proposal.number);

    // Determine email to use
    const emailToSend = clientEmail || proposal.client_email;
    
    if (!emailToSend) {
      throw new Error('Nenhum e-mail disponível para envio');
    }

    // If new email was provided, update proposal
    if (clientEmail && clientEmail !== proposal.client_email) {
      console.log('📝 Atualizando e-mail do cliente:', clientEmail);
      
      await supabase
        .from('proposals')
        .update({ client_email: clientEmail })
        .eq('id', proposalId);
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

    // Build email data
    const buildings = proposal.selected_buildings || [];
    
    const emailData: any = {
      clientName: proposal.client_name,
      clientEmail: emailToSend,
      clientCnpj: proposal.client_cnpj,
      proposalNumber: proposal.number,
      durationMonths: proposal.duration_months,
      fidelMonthlyValue: proposal.fidel_monthly_value,
      cashTotalValue: proposal.cash_total_value,
      discountPercent: proposal.discount_percent,
      totalPanels: proposal.total_panels,
      buildingsCount: buildings.length,
      selectedPlan: selectedPlan || 'avista',
      sellerName,
      sellerPhone,
    };

    // Add payment data if available
    if (paymentMethod && paymentData) {
      emailData.paymentMethod = paymentMethod;
      
      if (paymentMethod === 'pix') {
        emailData.pixData = {
          qrCodeBase64: paymentData.qrCodeBase64,
          qrCode: paymentData.qrCode,
        };
      } else if (paymentMethod === 'boleto') {
        emailData.boletoData = {
          boletoUrl: paymentData.boletoUrl,
          boletoBarcode: paymentData.boletoBarcode,
          dueDate: paymentData.dueDate,
        };
      }
    }

    // Generate email HTML
    const emailHtml = createProposalAcceptedEmail(emailData);

    // Send email
    console.log('📤 Enviando e-mail para:', emailToSend);
    
    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: 'EXA Mídia <comercial@examidia.com.br>',
      to: [emailToSend],
      subject: `🎉 Proposta ${proposal.number} Aceita - EXA Mídia`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('❌ Erro ao enviar e-mail:', emailError);
      throw emailError;
    }

    console.log('✅ E-mail enviado com sucesso:', emailResponse);

    // Log action
    await supabase.from('proposal_logs').insert({
      proposal_id: proposalId,
      action: 'email_confirmacao_enviado',
      details: {
        email: emailToSend,
        selected_plan: selectedPlan,
        payment_method: paymentMethod,
        resend_id: emailResponse?.id,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'E-mail de confirmação enviado',
        email: emailToSend,
        resendId: emailResponse?.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ Erro na função send-proposal-accepted-email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
