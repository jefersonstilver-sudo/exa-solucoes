import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('⏰ [CHECK-EXPIRED-PROPOSALS] Starting hourly check...');

    // Buscar propostas expiradas que ainda estão em status pendente/enviada/visualizada
    const now = new Date().toISOString();
    const { data: expiredProposals, error: fetchError } = await supabase
      .from('proposals')
      .select(`
        id, 
        number, 
        client_name, 
        client_first_name,
        client_last_name,
        client_company_name,
        expires_at, 
        status,
        created_by,
        seller_name,
        duration_months,
        fidel_monthly_value,
        total_panels
      `)
      .in('status', ['pendente', 'enviada', 'visualizada', 'expirada'])
      .lt('expires_at', now);

    if (fetchError) {
      console.error('❌ Error fetching expired proposals:', fetchError);
      throw fetchError;
    }

    console.log(`📋 Found ${expiredProposals?.length || 0} expired proposals`);

    if (!expiredProposals || expiredProposals.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No expired proposals to process',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let remindersSent = 0;
    let statusUpdated = 0;

    for (const proposal of expiredProposals) {
      console.log(`🔍 Processing proposal ${proposal.number} (${proposal.id})`);

      // Atualizar status para expirada se ainda não estiver
      if (proposal.status !== 'expirada') {
        const { error: updateError } = await supabase
          .from('proposals')
          .update({ status: 'expirada' })
          .eq('id', proposal.id);

        if (updateError) {
          console.error(`❌ Error updating proposal ${proposal.number}:`, updateError);
        } else {
          statusUpdated++;
          console.log(`✅ Proposal ${proposal.number} marked as expired`);
        }
      }

      // Verificar configurações de notificação (se foi silenciado)
      const { data: notifSettings } = await supabase
        .from('proposal_notification_settings')
        .select('*')
        .eq('proposal_id', proposal.id)
        .maybeSingle();

      // Se já foi silenciado, pular
      if (notifSettings?.expire_reminders_muted) {
        console.log(`🔕 Proposal ${proposal.number} reminders are muted. Skipping.`);
        continue;
      }

      // Verificar última vez que enviou lembrete (não enviar mais de 1 por hora)
      if (notifSettings?.last_reminder_sent_at) {
        const lastSent = new Date(notifSettings.last_reminder_sent_at);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (lastSent > hourAgo) {
          console.log(`⏳ Proposal ${proposal.number} was reminded less than 1 hour ago. Skipping.`);
          continue;
        }
      }

      // Buscar destinatários para esta proposta
      const { data: recipients } = await supabase
        .from('proposal_alert_recipients')
        .select('*')
        .eq('proposal_id', proposal.id)
        .eq('active', true);

      if (!recipients || recipients.length === 0) {
        console.log(`📭 No recipients configured for proposal ${proposal.number}`);
        continue;
      }

      // Buscar config Z-API do agente exa_alert
      const { data: exaAlertAgent } = await supabase
        .from('agents')
        .select('zapi_config')
        .eq('key', 'exa_alert')
        .single();

      if (!exaAlertAgent?.zapi_config) {
        console.error('❌ EXA Alert agent Z-API config not found');
        continue;
      }

      const zapiConfig = exaAlertAgent.zapi_config as { instance_id?: string; token?: string };
      const ZAPI_INSTANCE_ID = zapiConfig.instance_id;
      const ZAPI_TOKEN = zapiConfig.token;
      const ZAPI_CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN');

      if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
        console.error('❌ Z-API credentials incomplete');
        continue;
      }

      const reminderCount = (notifSettings?.reminders_sent_count || 0) + 1;
      const clientDisplayName = proposal.client_first_name && proposal.client_last_name 
        ? `${proposal.client_first_name} ${proposal.client_last_name}`
        : proposal.client_name || proposal.client_company_name || 'Cliente';

      const expiresDate = new Date(proposal.expires_at!);
      const formattedExpireDate = expiresDate.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Mensagem do lembrete com botões interativos
      const message = `⏰🔔 *LEMBRETE ${reminderCount}:* Proposta *${proposal.number}* EXPIRADA!\n\n` +
        `👤 Cliente: *${clientDisplayName}*\n` +
        `🏗️ Painéis: ${proposal.total_panels || 0}\n` +
        `📅 Expirou em: ${formattedExpireDate}\n\n` +
        `⚠️ *Ação necessária:* Envie nova proposta ou marque como resolvido!\n\n` +
        `👨‍💼 Vendedor: ${proposal.seller_name || 'N/A'}`;

      // Enviar para cada destinatário com botões
      for (const recipient of recipients) {
        if (!recipient.receive_whatsapp || !recipient.phone) continue;

        try {
          const cleanPhone = recipient.phone.replace(/\D/g, '');
          const hasCountryCode = /^(55|595|54|598|56|1)/.test(cleanPhone);
          const formattedPhone = hasCountryCode ? cleanPhone : `55${cleanPhone}`;

          // Enviar mensagem com botões interativos via Z-API
          const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-button-list`;
          
          const buttonPayload = {
            phone: formattedPhone,
            message: message,
            buttonList: {
              buttons: [
                {
                  id: `proposal_mute_${proposal.id}_ja_enviei`,
                  label: '✅ Já enviei nova proposta'
                },
                {
                  id: `proposal_mute_${proposal.id}_descartado`,
                  label: '❌ Descartar cliente'
                }
              ]
            }
          };

          const zapiResponse = await fetch(zapiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Client-Token': ZAPI_CLIENT_TOKEN || '',
            },
            body: JSON.stringify(buttonPayload),
          });

          if (zapiResponse.ok) {
            console.log(`✅ Reminder ${reminderCount} sent to ${recipient.name} (${formattedPhone})`);
            remindersSent++;
          } else {
            // Se botões falharem, enviar mensagem simples
            const simpleUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
            const simpleResponse = await fetch(simpleUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Client-Token': ZAPI_CLIENT_TOKEN || '',
              },
              body: JSON.stringify({
                phone: formattedPhone,
                message: message + `\n\n📲 Responda:\n"JA ENVIEI" - para parar lembretes\n"DESCARTAR" - para descartar cliente`,
              }),
            });

            if (simpleResponse.ok) {
              console.log(`✅ Simple reminder sent to ${recipient.name}`);
              remindersSent++;
            } else {
              const errorText = await simpleResponse.text();
              console.error(`❌ Failed to send reminder to ${recipient.name}:`, errorText);
            }
          }
        } catch (sendError) {
          console.error(`❌ Error sending to ${recipient.name}:`, sendError);
        }
      }

      // Atualizar/inserir configurações de notificação
      const { error: upsertError } = await supabase
        .from('proposal_notification_settings')
        .upsert({
          proposal_id: proposal.id,
          reminders_sent_count: reminderCount,
          last_reminder_sent_at: new Date().toISOString(),
        }, {
          onConflict: 'proposal_id'
        });

      if (upsertError) {
        console.error(`❌ Error updating notification settings:`, upsertError);
      }

      // Log do lembrete
      await supabase.from('proposal_logs').insert({
        proposal_id: proposal.id,
        action: 'expire_reminder_sent',
        details: {
          reminder_count: reminderCount,
          recipients_count: recipients.length,
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log(`✅ [CHECK-EXPIRED-PROPOSALS] Complete. Reminders sent: ${remindersSent}, Status updated: ${statusUpdated}`);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: expiredProposals.length,
      remindersSent,
      statusUpdated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('💥 [CHECK-EXPIRED-PROPOSALS] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
