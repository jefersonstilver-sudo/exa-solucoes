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

interface CustomInstallment {
  installment: number;
  due_date: string;
  amount: number;
}

interface RequestBody {
  proposalId: string;
  clientEmail?: string;
  selectedPlan: 'avista' | 'fidelidade' | 'custom';
  paymentMethod?: 'pix' | 'boleto';
  paymentData?: PaymentData;
  // Custom payment fields
  isCustomPayment?: boolean;
  customInstallments?: CustomInstallment[];
  currentInstallment?: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      proposalId, 
      clientEmail, 
      selectedPlan, 
      paymentMethod, 
      paymentData,
      isCustomPayment,
      customInstallments,
      currentInstallment
    } = await req.json() as RequestBody;

    console.log('📧 Iniciando envio de email de proposta aceita:', { 
      proposalId, 
      clientEmail, 
      selectedPlan, 
      paymentMethod,
      isCustomPayment,
      customInstallmentsCount: customInstallments?.length,
      currentInstallment
    });

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
      .select('*, cc_emails')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error(`Proposta não encontrada: ${proposalError?.message}`);
    }
    
    // Get CC emails
    const ccEmails: string[] = proposal.cc_emails || [];

    console.log('✅ Proposta encontrada:', proposal.number);
    console.log('📊 Dados da proposta:', {
      payment_type: proposal.payment_type,
      custom_installments: proposal.custom_installments,
      fidel_monthly_value: proposal.fidel_monthly_value,
      cash_total_value: proposal.cash_total_value
    });

    // Determine if custom payment
    const isCustom = isCustomPayment || proposal.payment_type === 'custom';
    const installments: CustomInstallment[] = customInstallments || proposal.custom_installments || [];

    console.log('💳 Tipo de pagamento detectado:', isCustom ? 'PERSONALIZADO' : 'PADRÃO');
    if (isCustom) {
      console.log('📝 Parcelas personalizadas:', installments);
    }

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

    // Build buildings data
    const buildings = proposal.selected_buildings || [];
    const buildingIds = buildings.map((b: any) => b.building_id).filter(Boolean);
    
    // Fetch CURRENT building data to calculate real prices
    let fullMonthlyPrice = 0;
    let realTotalPanels = proposal.total_panels || 0;
    
    if (buildingIds.length > 0) {
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('id, preco_base, quantidade_telas, numero_elevadores')
        .in('id', buildingIds);
      
      if (!buildingsError && buildingsData) {
        // Calculate full monthly price (sum of all preco_base)
        fullMonthlyPrice = buildingsData.reduce((sum, b) => sum + (b.preco_base || 0), 0);
        
        // Calculate real total panels
        realTotalPanels = buildingsData.reduce((sum, b) => sum + (b.quantidade_telas || b.numero_elevadores || 1), 0);
        
        console.log('📊 Dados atuais dos prédios:', {
          buildingsCount: buildingsData.length,
          fullMonthlyPrice,
          realTotalPanels
        });
      }
    }
    
    // Calculate full total price based on payment type
    let fullTotalPrice: number;
    let planDiscountPercent: number;
    let pixDiscountPercent: number;

    if (isCustom && installments.length > 0) {
      // CUSTOM PAYMENT: fullTotalPrice = sum of all installments (NOT building prices)
      fullTotalPrice = installments.reduce((sum, inst) => sum + Number(inst.amount), 0);
      planDiscountPercent = 0; // No automatic plan discount for custom
      pixDiscountPercent = 0; // No automatic PIX discount for custom
      
      console.log('💰 Cálculo PERSONALIZADO:', {
        fullTotalPrice,
        installments: installments.map(i => `${i.installment}: ${i.amount}`)
      });
    } else {
      // STANDARD PAYMENT: fullTotalPrice based on building prices
      fullTotalPrice = fullMonthlyPrice * proposal.duration_months;
      
      // Calculate plan discount based on duration
      const planDiscountMap: Record<number, number> = { 1: 0, 3: 20, 6: 30, 12: 37.5 };
      planDiscountPercent = planDiscountMap[proposal.duration_months] || 0;
      
      // Calculate PIX discount (10% if à vista)
      pixDiscountPercent = selectedPlan === 'avista' ? 10 : 0;

      console.log('💰 Cálculo PADRÃO:', {
        fullMonthlyPrice,
        fullTotalPrice,
        planDiscountPercent,
        pixDiscountPercent,
        durationMonths: proposal.duration_months
      });
    }

    // Build email data
    const emailData: any = {
      clientName: proposal.client_name,
      clientEmail: emailToSend,
      clientCnpj: proposal.client_cnpj,
      proposalNumber: proposal.number,
      durationMonths: proposal.duration_months,
      fidelMonthlyValue: proposal.fidel_monthly_value,
      cashTotalValue: proposal.cash_total_value,
      discountPercent: proposal.discount_percent,
      totalPanels: realTotalPanels,
      buildingsCount: buildings.length,
      selectedPlan: isCustom ? 'custom' : (selectedPlan || 'avista'),
      sellerName,
      sellerPhone,
      // Discount breakdown data
      fullMonthlyPrice,
      fullTotalPrice,
      planDiscountPercent,
      pixDiscountPercent,
      // Custom payment data
      paymentType: isCustom ? 'custom' : 'standard',
      customInstallments: isCustom ? installments : undefined,
      currentInstallment: isCustom ? (currentInstallment || 1) : undefined,
    };

    console.log('📧 Dados do email construídos:', {
      selectedPlan: emailData.selectedPlan,
      paymentType: emailData.paymentType,
      customInstallmentsCount: emailData.customInstallments?.length,
      fullTotalPrice: emailData.fullTotalPrice
    });

    // Add payment data if available
    if (paymentMethod && paymentData) {
      emailData.paymentMethod = paymentMethod;
      
      console.log('💳 Dados de pagamento recebidos:', {
        method: paymentMethod,
        hasQrCodeBase64: !!paymentData.qrCodeBase64,
        hasQrCode: !!paymentData.qrCode,
        hasBoletoUrl: !!paymentData.boletoUrl
      });
      
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
    console.log('📤 CC emails:', ccEmails.length > 0 ? ccEmails : 'Nenhum');
    
    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: 'EXA Mídia <comercial@examidia.com.br>',
      to: [emailToSend],
      cc: ccEmails.length > 0 ? ccEmails : undefined,
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
        selected_plan: isCustom ? 'custom' : selectedPlan,
        payment_method: paymentMethod,
        payment_type: isCustom ? 'custom' : 'standard',
        custom_installments: isCustom ? installments : undefined,
        resend_id: emailResponse?.id,
        discount_breakdown: {
          fullMonthlyPrice,
          fullTotalPrice,
          planDiscountPercent,
          pixDiscountPercent
        },
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
