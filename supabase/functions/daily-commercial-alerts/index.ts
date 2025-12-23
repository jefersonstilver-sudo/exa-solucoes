import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProposalRecipient {
  phone: string;
  name: string;
}

serve(async (req) => {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║ 📢 DAILY-COMMERCIAL-ALERTS - V2 (Z-API + Audit Logs)         ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for test mode
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON - that's okay for normal execution
    }

    const isTestMode = body.testMode === true;
    const testPhone = body.testPhone;
    const templateType = body.templateType || 'propostas';

    // ============ TEST MODE - USE Z-API ============
    if (isTestMode && testPhone) {
      console.log("🧪 MODO DE TESTE ATIVADO (Z-API)");
      console.log(`📱 Telefone: ${testPhone}`);
      console.log(`📝 Template: ${templateType}`);

      // Get Z-API agent config (use a default agent for alerts)
      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .select("*")
        .eq("whatsapp_provider", "zapi")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (agentError || !agent) {
        console.error("❌ Nenhum agente Z-API ativo encontrado");
        
        // Log error
        await supabase.from("exa_alerts_message_logs").insert({
          alert_key: "daily-commercial-alerts",
          event_type: "test_send",
          phone: testPhone,
          recipient_name: "Teste",
          provider: "zapi",
          status: "error",
          error_message: "Nenhum agente Z-API configurado",
          metadata: { templateType }
        });

        return new Response(
          JSON.stringify({ success: false, message: "Nenhum agente Z-API configurado" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const zapiConfig = agent.zapi_config;
      if (!zapiConfig?.instance_id || !zapiConfig?.token) {
        console.error("❌ Configuração Z-API inválida");
        
        await supabase.from("exa_alerts_message_logs").insert({
          alert_key: "daily-commercial-alerts",
          event_type: "test_send",
          phone: testPhone,
          recipient_name: "Teste",
          provider: "zapi",
          status: "error",
          error_message: "Configuração Z-API inválida",
          metadata: { templateType }
        });

        return new Response(
          JSON.stringify({ success: false, message: "Configuração Z-API inválida" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const zapiClientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
      if (!zapiClientToken) {
        console.error("❌ ZAPI_CLIENT_TOKEN não configurado");
        
        await supabase.from("exa_alerts_message_logs").insert({
          alert_key: "daily-commercial-alerts",
          event_type: "test_send",
          phone: testPhone,
          recipient_name: "Teste",
          provider: "zapi",
          status: "error",
          error_message: "ZAPI_CLIENT_TOKEN não configurado",
          metadata: { templateType }
        });

        return new Response(
          JSON.stringify({ success: false, message: "ZAPI_CLIENT_TOKEN não configurado" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch template from config
      const { data: config } = await supabase
        .from("commercial_alerts_config")
        .select("template_propostas, template_contratos")
        .single();

      if (!config) {
        return new Response(
          JSON.stringify({ success: false, message: "Configuração não encontrada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build test message
      const template = templateType === 'propostas' 
        ? config.template_propostas 
        : config.template_contratos;

      const testMessage = `🧪 *TESTE DE ALERTA EXA*\n\n${template || 'Template não configurado'}\n\n---\n✅ Este é um alerta de teste enviado via Z-API`;

      // Send via Z-API directly
      const sendUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
      
      try {
        const normalizedPhone = testPhone.replace(/\D/g, '');
        
        console.log(`📤 Enviando via Z-API para ${normalizedPhone}...`);
        
        const response = await fetch(sendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': zapiClientToken,
          },
          body: JSON.stringify({
            phone: normalizedPhone,
            message: testMessage
          })
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(`Z-API Error: ${response.status} - ${JSON.stringify(result)}`);
        }

        console.log("✅ Alerta de teste enviado com sucesso!", result);

        // Log success in audit table
        await supabase.from("exa_alerts_message_logs").insert({
          alert_key: "daily-commercial-alerts",
          event_type: "test_send",
          phone: normalizedPhone,
          recipient_name: "Teste Manual",
          provider: "zapi",
          status: "success",
          message_preview: testMessage.substring(0, 200),
          provider_message_id: result.messageId || null,
          metadata: { 
            templateType,
            zapiResponse: result
          }
        });

        // Also log in zapi_logs for compatibility
        await supabase.from("zapi_logs").insert({
          agent_key: agent.key,
          direction: "outbound",
          phone_number: normalizedPhone,
          message_text: testMessage,
          status: "sent",
          zapi_message_id: result.messageId || null,
          metadata: { test_alert: true, templateType }
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Alerta de teste enviado via Z-API!",
            messageId: result.messageId 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        console.error("❌ Erro ao enviar teste via Z-API:", err);
        
        // Log error in audit table
        await supabase.from("exa_alerts_message_logs").insert({
          alert_key: "daily-commercial-alerts",
          event_type: "test_send",
          phone: testPhone,
          recipient_name: "Teste Manual",
          provider: "zapi",
          status: "error",
          error_message: err.message,
          metadata: { templateType }
        });

        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ============ NORMAL EXECUTION ============
    // 1. Fetch commercial alert config
    const { data: config } = await supabase
      .from("commercial_alerts_config")
      .select("*")
      .eq("ativo", true)
      .single();

    if (!config) {
      console.log("⚠️ Alertas comerciais desativados ou não configurados");
      return new Response(
        JSON.stringify({ success: true, message: "Alertas desativados" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📋 Configuração carregada:", JSON.stringify(config, null, 2));

    // Get Z-API agent for sending
    const { data: zapiAgent } = await supabase
      .from("agents")
      .select("*")
      .eq("whatsapp_provider", "zapi")
      .eq("is_active", true)
      .limit(1)
      .single();

    const zapiConfig = zapiAgent?.zapi_config;
    const zapiClientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
    const canSendZapi = zapiConfig?.instance_id && zapiConfig?.token && zapiClientToken;

    const alertsSent: string[] = [];
    const errors: string[] = [];

    // Helper function to send message via Z-API
    const sendZapiMessage = async (phone: string, message: string, recipientName: string, eventType: string): Promise<boolean> => {
      if (!canSendZapi) {
        console.log("⚠️ Z-API não configurado, pulando envio");
        return false;
      }

      const normalizedPhone = phone.replace(/\D/g, '').replace(/^55/, '');
      const fullPhone = normalizedPhone.startsWith('55') ? normalizedPhone : '55' + normalizedPhone;

      try {
        const sendUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
        
        const response = await fetch(sendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': zapiClientToken!,
          },
          body: JSON.stringify({
            phone: fullPhone,
            message
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(`Z-API Error: ${response.status}`);
        }

        // Log success
        await supabase.from("exa_alerts_message_logs").insert({
          alert_key: "daily-commercial-alerts",
          event_type: eventType,
          phone: fullPhone,
          recipient_name: recipientName,
          provider: "zapi",
          status: "success",
          message_preview: message.substring(0, 200),
          provider_message_id: result.messageId || null,
          metadata: { zapiResponse: result }
        });

        return true;
      } catch (err: any) {
        console.error(`❌ Erro Z-API para ${recipientName}:`, err.message);
        
        await supabase.from("exa_alerts_message_logs").insert({
          alert_key: "daily-commercial-alerts",
          event_type: eventType,
          phone: fullPhone,
          recipient_name: recipientName,
          provider: "zapi",
          status: "error",
          error_message: err.message,
          metadata: {}
        });

        return false;
      }
    };

    // 2. Check pending proposals (>24h)
    if (config.alerta_propostas_pendentes) {
      console.log("🔍 Buscando propostas pendentes há mais de 24h...");
      
      const { data: pendingProposals } = await supabase
        .from("proposals")
        .select("id, number, client_name, client_company_name, created_at, created_by, seller_name, status")
        .in("status", ["enviada", "visualizada", "pendente"])
        .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (pendingProposals && pendingProposals.length > 0) {
        console.log(`📝 ${pendingProposals.length} propostas pendentes encontradas`);

        for (const proposal of pendingProposals) {
          const hoursPending = Math.floor((Date.now() - new Date(proposal.created_at).getTime()) / (1000 * 60 * 60));
          
          const recipients = await getProposalRecipients(supabase, proposal);
          
          if (recipients.length === 0) {
            console.log(`⚠️ Proposta ${proposal.number} sem destinatários configurados`);
            continue;
          }

          const message = config.template_propostas
            ? config.template_propostas
                .replace("{numero}", proposal.number)
                .replace("{cliente}", proposal.client_name)
                .replace("{empresa}", proposal.client_company_name || "N/A")
                .replace("{horas}", hoursPending.toString())
            : `🔔 *Lembrete de Proposta*\n\nA proposta *${proposal.number}* para *${proposal.client_name}*${proposal.client_company_name ? ` (${proposal.client_company_name})` : ''} está pendente há ${hoursPending} horas.\n\nAcesse o painel para acompanhar.`;

          for (const recipient of recipients) {
            const success = await sendZapiMessage(recipient.phone, message, recipient.name, "scheduled_send");
            if (success) {
              alertsSent.push(`Proposta ${proposal.number} → ${recipient.name}`);
              console.log(`✅ Alerta enviado para ${recipient.name} (${recipient.phone})`);
            } else {
              errors.push(`Proposta ${proposal.number} → ${recipient.name}: Falha no envio`);
            }
          }
        }
      } else {
        console.log("✅ Nenhuma proposta pendente há mais de 24h");
      }
    }

    // 3. Check unsigned contracts (>48h)
    if (config.alerta_contratos_pendentes) {
      console.log("🔍 Buscando contratos não assinados há mais de 48h...");
      
      const { data: pendingContracts } = await supabase
        .from("contratos_legais")
        .select("id, numero_contrato, cliente_nome, created_at, proposta_id, status")
        .in("status", ["rascunho", "pendente_assinatura", "enviado"])
        .lt("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

      if (pendingContracts && pendingContracts.length > 0) {
        console.log(`📄 ${pendingContracts.length} contratos pendentes encontrados`);

        for (const contract of pendingContracts) {
          const hoursPending = Math.floor((Date.now() - new Date(contract.created_at).getTime()) / (1000 * 60 * 60));
          
          let recipients: ProposalRecipient[] = [];
          if (contract.proposta_id) {
            const { data: proposal } = await supabase
              .from("proposals")
              .select("id, created_by, seller_name")
              .eq("id", contract.proposta_id)
              .single();
            
            if (proposal) {
              recipients = await getProposalRecipients(supabase, proposal);
            }
          }

          if (recipients.length === 0) {
            console.log(`⚠️ Contrato ${contract.numero_contrato} sem destinatários`);
            continue;
          }

          const message = config.template_contratos
            ? config.template_contratos
                .replace("{numero}", contract.numero_contrato)
                .replace("{cliente}", contract.cliente_nome)
                .replace("{horas}", hoursPending.toString())
            : `📄 *Lembrete de Contrato*\n\nO contrato *${contract.numero_contrato}* para *${contract.cliente_nome}* está aguardando assinatura há ${hoursPending} horas.\n\nAcompanhe no painel jurídico.`;

          for (const recipient of recipients) {
            const success = await sendZapiMessage(recipient.phone, message, recipient.name, "scheduled_send");
            if (success) {
              alertsSent.push(`Contrato ${contract.numero_contrato} → ${recipient.name}`);
              console.log(`✅ Alerta de contrato enviado para ${recipient.name}`);
            } else {
              errors.push(`Contrato ${contract.numero_contrato} → ${recipient.name}: Falha no envio`);
            }
          }
        }
      } else {
        console.log("✅ Nenhum contrato pendente há mais de 48h");
      }
    }

    // 4. Check expiring proposals (next 24h)
    if (config.alerta_propostas_expirando) {
      console.log("🔍 Buscando propostas prestes a expirar (próximas 24h)...");
      
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const { data: expiringProposals } = await supabase
        .from("proposals")
        .select("id, number, client_name, client_company_name, expires_at, created_by, seller_name")
        .in("status", ["enviada", "visualizada", "pendente"])
        .gte("expires_at", now.toISOString())
        .lte("expires_at", in24h.toISOString());

      if (expiringProposals && expiringProposals.length > 0) {
        console.log(`⏰ ${expiringProposals.length} propostas expirando em 24h`);

        for (const proposal of expiringProposals) {
          const hoursRemaining = Math.ceil((new Date(proposal.expires_at).getTime() - Date.now()) / (1000 * 60 * 60));
          const recipients = await getProposalRecipients(supabase, proposal);

          const message = `⚠️ *Proposta Expirando!*\n\nA proposta *${proposal.number}* para *${proposal.client_name}*${proposal.client_company_name ? ` (${proposal.client_company_name})` : ''} expira em *${hoursRemaining} horas*.\n\nEntre em contato com o cliente!`;

          for (const recipient of recipients) {
            const success = await sendZapiMessage(recipient.phone, message, recipient.name, "scheduled_send");
            if (success) {
              alertsSent.push(`Expirando ${proposal.number} → ${recipient.name}`);
            } else {
              errors.push(`Expirando ${proposal.number} → ${recipient.name}: Falha`);
            }
          }
        }
      }
    }

    // 5. Log execution
    await supabase.from("agent_logs").insert({
      agent_key: "daily-commercial-alerts",
      event_type: "execution",
      metadata: {
        alerts_sent: alertsSent.length,
        errors: errors.length,
        details: alertsSent,
        error_details: errors,
        config_used: config.id,
        provider: "zapi"
      }
    });

    console.log("========================================");
    console.log(`✅ EXECUÇÃO CONCLUÍDA`);
    console.log(`   Alertas enviados: ${alertsSent.length}`);
    console.log(`   Erros: ${errors.length}`);
    console.log("========================================");

    return new Response(
      JSON.stringify({
        success: true,
        alerts_sent: alertsSent.length,
        errors: errors.length,
        details: alertsSent,
        error_details: errors
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ ERRO:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Fetch specific recipients for a proposal
async function getProposalRecipients(supabase: any, proposal: any): Promise<ProposalRecipient[]> {
  const recipients: ProposalRecipient[] = [];

  // 1. Seller who created the proposal
  if (proposal.created_by) {
    const { data: seller } = await supabase
      .from("users")
      .select("nome, telefone")
      .eq("id", proposal.created_by)
      .single();

    if (seller?.telefone) {
      recipients.push({
        phone: seller.telefone,
        name: seller.nome || "Vendedor"
      });
    }
  }

  // 2. Extra recipients
  const { data: extraRecipients } = await supabase
    .from("proposal_alert_recipients")
    .select("name, phone, active, receive_whatsapp")
    .eq("proposal_id", proposal.id)
    .eq("active", true)
    .eq("receive_whatsapp", true);

  if (extraRecipients) {
    for (const r of extraRecipients) {
      if (r.phone && !recipients.some(existing => existing.phone === r.phone)) {
        recipients.push({
          phone: r.phone,
          name: r.name || "Destinatário"
        });
      }
    }
  }

  return recipients;
}
