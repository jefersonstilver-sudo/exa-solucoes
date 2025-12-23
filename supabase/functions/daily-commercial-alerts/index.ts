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

interface PendingProposal {
  id: string;
  number: string;
  client_name: string;
  client_company_name: string | null;
  created_at: string;
  created_by: string | null;
  seller_name: string | null;
  hours_pending: number;
}

interface PendingContract {
  id: string;
  numero_contrato: string;
  cliente_nome: string;
  created_at: string;
  hours_pending: number;
}

serve(async (req) => {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║ 📢 DAILY-COMMERCIAL-ALERTS - INÍCIO                          ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const manychatApiKey = Deno.env.get("MANYCHAT_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar configurações de alertas comerciais
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

    const alertsSent: string[] = [];
    const errors: string[] = [];

    // 2. Buscar propostas pendentes há mais de 24h (se habilitado)
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
          
          // Buscar destinatários específicos da proposta
          const recipients = await getProposalRecipients(supabase, proposal);
          
          if (recipients.length === 0) {
            console.log(`⚠️ Proposta ${proposal.number} sem destinatários configurados`);
            continue;
          }

          // Construir mensagem
          const message = config.template_propostas
            ? config.template_propostas
                .replace("{numero}", proposal.number)
                .replace("{cliente}", proposal.client_name)
                .replace("{empresa}", proposal.client_company_name || "N/A")
                .replace("{horas}", hoursPending.toString())
            : `🔔 *Lembrete de Proposta*\n\nA proposta *${proposal.number}* para *${proposal.client_name}*${proposal.client_company_name ? ` (${proposal.client_company_name})` : ''} está pendente há ${hoursPending} horas.\n\nAcesse o painel para acompanhar.`;

          // Enviar para cada destinatário
          for (const recipient of recipients) {
            try {
              if (manychatApiKey) {
                await sendManyChatMessage(manychatApiKey, recipient.phone, message);
                alertsSent.push(`Proposta ${proposal.number} → ${recipient.name}`);
                console.log(`✅ Alerta enviado para ${recipient.name} (${recipient.phone})`);
              }
            } catch (err) {
              console.error(`❌ Erro ao enviar para ${recipient.name}:`, err);
              errors.push(`Proposta ${proposal.number} → ${recipient.name}: ${err}`);
            }
          }
        }
      } else {
        console.log("✅ Nenhuma proposta pendente há mais de 24h");
      }
    }

    // 3. Buscar contratos não assinados há mais de 48h (se habilitado)
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
          
          // Buscar destinatários da proposta original
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

          // Também notificar signatários do contrato
          const { data: signatarios } = await supabase
            .from("contrato_signatarios")
            .select("nome, email")
            .eq("contrato_id", contract.id);

          if (recipients.length === 0 && (!signatarios || signatarios.length === 0)) {
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
            try {
              if (manychatApiKey) {
                await sendManyChatMessage(manychatApiKey, recipient.phone, message);
                alertsSent.push(`Contrato ${contract.numero_contrato} → ${recipient.name}`);
                console.log(`✅ Alerta de contrato enviado para ${recipient.name}`);
              }
            } catch (err) {
              console.error(`❌ Erro ao enviar para ${recipient.name}:`, err);
              errors.push(`Contrato ${contract.numero_contrato} → ${recipient.name}: ${err}`);
            }
          }
        }
      } else {
        console.log("✅ Nenhum contrato pendente há mais de 48h");
      }
    }

    // 4. Propostas prestes a expirar (se habilitado)
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
            try {
              if (manychatApiKey) {
                await sendManyChatMessage(manychatApiKey, recipient.phone, message);
                alertsSent.push(`Expirando ${proposal.number} → ${recipient.name}`);
              }
            } catch (err) {
              errors.push(`Expirando ${proposal.number} → ${recipient.name}: ${err}`);
            }
          }
        }
      }
    }

    // 5. Log da execução
    await supabase.from("agent_logs").insert({
      agent_key: "daily-commercial-alerts",
      event_type: "execution",
      metadata: {
        alerts_sent: alertsSent.length,
        errors: errors.length,
        details: alertsSent,
        error_details: errors,
        config_used: config.id
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

// Buscar destinatários específicos de uma proposta
async function getProposalRecipients(supabase: any, proposal: any): Promise<ProposalRecipient[]> {
  const recipients: ProposalRecipient[] = [];

  // 1. Vendedor que criou a proposta (created_by)
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

  // 2. Destinatários extras (proposal_alert_recipients)
  const { data: extraRecipients } = await supabase
    .from("proposal_alert_recipients")
    .select("name, phone, active, receive_whatsapp")
    .eq("proposal_id", proposal.id)
    .eq("active", true)
    .eq("receive_whatsapp", true);

  if (extraRecipients) {
    for (const r of extraRecipients) {
      // Evitar duplicatas
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

// Enviar mensagem via ManyChat
async function sendManyChatMessage(apiKey: string, phone: string, message: string): Promise<void> {
  // Normalizar telefone
  let normalizedPhone = phone.replace(/\D/g, "");
  if (!normalizedPhone.startsWith("55")) {
    normalizedPhone = "55" + normalizedPhone;
  }

  const response = await fetch("https://api.manychat.com/fb/sending/sendContent", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      subscriber_id: normalizedPhone,
      data: {
        version: "v2",
        content: {
          type: "text",
          text: message
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ManyChat error: ${response.status} - ${errorText}`);
  }
}
