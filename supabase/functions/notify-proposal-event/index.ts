import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProposalEventPayload {
  proposalId: string;
  eventType: 'proposal_viewing' | 'proposal_viewed_again' | 'proposal_accepted' | 'proposal_rejected' | 'proposal_paid' | 'proposal_expired';
  metadata?: {
    viewCount?: number;
    paymentMethod?: string;
    paymentAmount?: number;
    deviceType?: string;
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

    // Fetch proposal details
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id, number, client_name, client_company_name, cash_total_value, fidel_monthly_value, duration_months, seller_name, created_by')
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

    // Build message based on event type
    const clientDisplayName = proposal.client_company_name || proposal.client_name;
    let message = '';
    let emoji = '';

    switch (eventType) {
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
        message = `${emoji} *PROPOSTA ACEITA!*\n\nCliente: ${clientDisplayName}\nProposta: ${proposal.number}\nValor: R$ ${proposal.fidel_monthly_value?.toLocaleString('pt-BR')}/mês`;
        break;
      case 'proposal_rejected':
        emoji = '❌';
        message = `${emoji} Proposta *${proposal.number}* foi RECUSADA pelo cliente ${clientDisplayName}`;
        break;
      case 'proposal_paid':
        emoji = '💳';
        const paymentMethod = metadata?.paymentMethod || 'N/A';
        const amount = metadata?.paymentAmount?.toLocaleString('pt-BR') || proposal.fidel_monthly_value?.toLocaleString('pt-BR');
        message = `${emoji} *PAGAMENTO CONFIRMADO!*\n\nCliente: ${clientDisplayName}\nProposta: ${proposal.number}\nValor: R$ ${amount}\nMétodo: ${paymentMethod}`;
        break;
      case 'proposal_expired':
        emoji = '⏰';
        message = `${emoji} Proposta *${proposal.number}* para ${clientDisplayName} EXPIROU`;
        break;
      default:
        message = `📋 Atualização na proposta ${proposal.number}`;
    }

    console.log(`📤 Sending notification to ${recipients.length} recipients`);

    // Send notifications via EXA Alerts
    const ZAPI_INSTANCE_ID = Deno.env.get('ZAPI_INSTANCE_ID');
    const ZAPI_TOKEN = Deno.env.get('ZAPI_TOKEN');
    const ZAPI_CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN');

    let notificationsSent = 0;

    for (const recipient of recipients) {
      if (recipient.receive_whatsapp && recipient.phone) {
        try {
          // Format phone number
          const cleanPhone = recipient.phone.replace(/\D/g, '');
          const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

          // Send via Z-API
          if (ZAPI_INSTANCE_ID && ZAPI_TOKEN) {
            const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
            
            const zapiResponse = await fetch(zapiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Client-Token': ZAPI_CLIENT_TOKEN || '',
              },
              body: JSON.stringify({
                phone: formattedPhone,
                message: message,
              }),
            });

            if (zapiResponse.ok) {
              console.log(`✅ WhatsApp sent to ${recipient.name} (${formattedPhone})`);
              notificationsSent++;
            } else {
              const errorText = await zapiResponse.text();
              console.error(`❌ Failed to send WhatsApp to ${recipient.name}:`, errorText);
            }
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
