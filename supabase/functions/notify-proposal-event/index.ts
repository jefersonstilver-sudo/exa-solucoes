import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProposalEventPayload {
  proposalId: string;
  eventType: 'proposal_sent' | 'proposal_viewing' | 'proposal_viewed_again' | 'proposal_accepted' | 'proposal_rejected' | 'proposal_paid' | 'proposal_expired' | 'proposal_expired_reminder';
  metadata?: {
    viewCount?: number;
    paymentMethod?: string;
    paymentAmount?: number;
    deviceType?: string;
    selectedPlan?: string;
    reminderCount?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { proposalId, eventType, metadata }: ProposalEventPayload = await req.json();

    console.log(`🔔 [NOTIFY-PROPOSAL] Event: ${eventType}, Proposal: ${proposalId}`);

    if (!proposalId || !eventType) {
      return new Response(JSON.stringify({ error: 'proposalId and eventType required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch proposal details with custom installments
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id, number, client_name, client_first_name, client_last_name, client_company_name, cash_total_value, fidel_monthly_value, duration_months, seller_name, created_by, payment_type, custom_installments, total_panels')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      console.error('❌ Proposal not found:', proposalError);
      return new Response(JSON.stringify({ error: 'Proposal not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch recipients for this proposal
    const { data: recipients, error: recipientsError } = await supabase
      .from('proposal_alert_recipients')
      .select('*')
      .eq('proposal_id', proposalId)
      .eq('active', true);

    if (recipientsError) {
      console.error('❌ Error fetching recipients:', recipientsError);
    }

    if (!recipients || recipients.length === 0) {
      console.log('📭 No active recipients for this proposal');
      return new Response(JSON.stringify({ success: true, message: 'No recipients configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build client display name - prioritize personal name
    const clientDisplayName = proposal.client_first_name && proposal.client_last_name 
      ? `${proposal.client_first_name} ${proposal.client_last_name}`
      : proposal.client_name || proposal.client_company_name || 'Cliente';
    
    let message = '';
    let emoji = '';

    // Helper to format currency
    const formatCurrency = (value: number) => `R$ ${value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // Build payment details string - Calculate total from monthly * months since fidel_total_value doesn't exist
    const fidelTotalCalculated = (proposal.fidel_monthly_value || 0) * (proposal.duration_months || 1);
    
    const buildPaymentDetails = () => {
      if (proposal.payment_type === 'custom' && Array.isArray(proposal.custom_installments) && proposal.custom_installments.length > 0) {
        const installments = proposal.custom_installments as Array<{ due_date: string; amount: number }>;
        const total = installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
        let details = `Tipo: *Personalizado*\nTotal: *${formatCurrency(total)}*\nParcelas: *${installments.length}x*\n`;
        installments.forEach((inst, idx) => {
          const date = new Date(inst.due_date).toLocaleDateString('pt-BR');
          details += `  ${idx + 1}ª: ${formatCurrency(inst.amount)} (${date})\n`;
        });
        return details;
      } else {
        return `Valor à Vista: *${formatCurrency(proposal.cash_total_value || 0)}*\nFidelidade: *${formatCurrency(proposal.fidel_monthly_value || 0)}/mês*\nTotal Fidelidade: *${formatCurrency(fidelTotalCalculated)}*`;
      }
    };

    switch (eventType) {
      case 'proposal_sent':
        emoji = '📤';
        message = `${emoji} Proposta *${proposal.number}* enviada!\n\n` +
          `👤 Cliente: *${clientDisplayName}*\n` +
          (proposal.client_company_name ? `🏢 Empresa: ${proposal.client_company_name}\n` : '') +
          `🏗️ Painéis: ${proposal.total_panels || 0}\n` +
          `📅 Período: ${proposal.duration_months} meses\n\n` +
          `💰 *VALORES:*\n${buildPaymentDetails()}\n\n` +
          `👨‍💼 Vendedor: ${proposal.seller_name || 'N/A'}`;
        break;
      case 'proposal_viewing':
        emoji = '👁️';
        message = `${emoji} *${clientDisplayName}* está visualizando a proposta *${proposal.number}* agora!`;
        break;
      case 'proposal_viewed_again':
        emoji = '👁️';
        const viewText = metadata?.viewCount ? `(${metadata.viewCount}ª vez)` : '';
        message = `${emoji} *${clientDisplayName}* visualizou a proposta *${proposal.number}* novamente ${viewText}`;
        break;
      case 'proposal_accepted':
        emoji = '✅';
        const planText = metadata?.selectedPlan === 'avista' ? 'À Vista' : 'Fidelidade';
        message = `${emoji} *PROPOSTA ACEITA!*\n\n` +
          `👤 Cliente: *${clientDisplayName}*\n` +
          (proposal.client_company_name ? `🏢 Empresa: ${proposal.client_company_name}\n` : '') +
          `📋 Proposta: ${proposal.number}\n` +
          `📅 Período: ${proposal.duration_months} meses\n` +
          `💳 Plano: ${planText}\n\n` +
          `💰 *VALORES:*\n${buildPaymentDetails()}`;
        break;
      case 'proposal_rejected':
        emoji = '❌';
        message = `${emoji} Proposta *${proposal.number}* foi *RECUSADA* pelo cliente *${clientDisplayName}*`;
        break;
      case 'proposal_paid':
        emoji = '💳';
        const paymentMethod = metadata?.paymentMethod || 'N/A';
        const amount = metadata?.paymentAmount?.toLocaleString('pt-BR') || proposal.fidel_monthly_value?.toLocaleString('pt-BR');
        message = `${emoji} *PAGAMENTO CONFIRMADO!*\n\n` +
          `👤 Cliente: *${clientDisplayName}*\n` +
          `📋 Proposta: ${proposal.number}\n` +
          `💵 Valor: R$ ${amount}\n` +
          `💳 Método: ${paymentMethod}`;
        break;
      case 'proposal_expired':
        emoji = '⏰';
        message = `${emoji} Proposta *${proposal.number}* para *${clientDisplayName}* EXPIROU`;
        break;
      case 'proposal_expired_reminder':
        emoji = '⏰🔔';
        const reminderCount = metadata?.reminderCount || 1;
        message = `${emoji} *LEMBRETE ${reminderCount}:* Proposta *${proposal.number}* EXPIRADA!\n\n` +
          `👤 Cliente: *${clientDisplayName}*\n` +
          (proposal.client_company_name ? `🏢 Empresa: ${proposal.client_company_name}\n` : '') +
          `🏗️ Painéis: ${proposal.total_panels || 0}\n\n` +
          `⚠️ *Ação necessária:* Envie nova proposta ou marque como resolvido!\n\n` +
          `👨‍💼 Vendedor: ${proposal.seller_name || 'N/A'}`;
        break;
      default:
        message = `📋 Atualização na proposta ${proposal.number}`;
    }

    console.log(`📤 Sending notification to ${recipients.length} recipients`);

    console.log(`📤 Sending notification via Evolution shim to ${recipients.length} recipients`);

    let notificationsSent = 0;
    for (const recipient of recipients) {
      if (recipient.receive_whatsapp && recipient.phone) {
        try {
          const { error: sendError } = await supabase.functions.invoke('zapi-send-message', {
            body: {
              agentKey: 'exa_alert',
              phone: recipient.phone,
              message,
              skipSplit: true,
            },
          });
          if (!sendError) {
            console.log(`✅ WhatsApp sent to ${recipient.name}`);
            notificationsSent++;
          } else {
            console.error(`❌ Failed to send WhatsApp to ${recipient.name}:`, sendError);
          }
        } catch (err) {
          console.error(`❌ Error sending to ${recipient.name}:`, err);
        }
      }
    }

    // Log the notification
    await supabase.from('proposal_logs').insert({
      proposal_id: proposalId,
      action: 'notification_sent',
      details: {
        event_type: eventType,
        recipients_count: recipients.length,
        notifications_sent: notificationsSent,
        metadata,
      }
    });

    console.log(`✅ Notifications complete: ${notificationsSent}/${recipients.length} sent`);

    return new Response(JSON.stringify({ 
      success: true, 
      notificationsSent,
      totalRecipients: recipients.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('💥 Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
