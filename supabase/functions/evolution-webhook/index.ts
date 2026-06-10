// Webhook inbound da Evolution API - foco em respostas aos alertas EXA (painel offline).
// Aceita o formato `messages.upsert` da Evolution e também um modo `?action=setup`
// para registrar este endpoint como webhook na instância de notificações.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function extractPhone(remoteJid?: string, fallback?: string) {
  const src = remoteJid || fallback || "";
  return String(src).replace("@s.whatsapp.net", "").replace("@g.us", "").replace(/\D/g, "");
}

function extractText(message: any): string {
  if (!message) return "";
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.buttonsResponseMessage?.selectedDisplayText ||
    message.templateButtonReplyMessage?.selectedDisplayText ||
    message.listResponseMessage?.title ||
    ""
  ).toString().trim();
}

async function sendReply(supabase: any, phone: string, message: string) {
  try {
    await supabase.functions.invoke("zapi-send-message", {
      body: { agentKey: "exa_alert", phone, message, skipSplit: true },
    });
  } catch (e) {
    console.error("[EVO-WEBHOOK] sendReply error:", (e as Error).message);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // ============== SETUP: registra este endpoint como webhook na instância ==============
  if (action === "setup") {
    const evoUrl = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
    const evoKey = Deno.env.get("EVOLUTION_API_KEY") || "";
    if (!evoUrl || !evoKey) return json(500, { error: "EVOLUTION_API_URL/KEY missing" });

    const { data: inst } = await supabase
      .from("evolution_instances")
      .select("instance_name")
      .eq("is_notifications", true)
      .maybeSingle();
    if (!inst?.instance_name) return json(404, { error: "no notifications instance" });

    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/evolution-webhook`;
    const payload = {
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: ["MESSAGES_UPSERT"],
      },
    };

    const results: any[] = [];
    for (const path of [`/webhook/set/${inst.instance_name}`, `/webhook/${inst.instance_name}`]) {
      try {
        const r = await fetch(`${evoUrl}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: evoKey },
          body: JSON.stringify(payload),
        });
        const text = await r.text();
        results.push({ path, status: r.status, body: text.slice(0, 400) });
        if (r.ok) break;
      } catch (e) {
        results.push({ path, error: (e as Error).message });
      }
    }
    return json(200, { ok: true, instance: inst.instance_name, webhookUrl, results });
  }

  if (req.method !== "POST") return json(405, { error: "method not allowed" });

  try {
    const payload = await req.json();
    console.log("[EVO-WEBHOOK] 📥", JSON.stringify(payload).slice(0, 800));

    const event = payload.event || payload.type || "";
    const data = payload.data || payload;

    // Apenas mensagens inbound
    if (event && !String(event).toLowerCase().includes("messages.upsert") && !String(event).toLowerCase().includes("messages_upsert")) {
      return json(200, { skipped: true, reason: "event_not_messages_upsert", event });
    }

    const key = data.key || {};
    const fromMe = key.fromMe === true || data.fromMe === true;
    if (fromMe) return json(200, { skipped: true, reason: "fromMe" });

    const phone = extractPhone(key.remoteJid, data.sender || payload.sender);
    if (!phone) return json(200, { skipped: true, reason: "no_phone" });

    const text = extractText(data.message);
    if (!text) return json(200, { skipped: true, reason: "no_text" });

    const trimmed = text.trim();
    const upper = trimmed.toUpperCase();
    const senderName = data.pushName || payload.pushName || "Desconhecido";

    console.log("[EVO-WEBHOOK] ▶ from", phone, "text:", trimmed.slice(0, 60));

    // =============== ROUTE 1: respostas a alertas de painel offline (1/2/3) ===============
    const isMenu13 = /^[123]$/.test(trimmed);
    if (isMenu13) {
      const tail = phone.slice(-8);

      // Localiza alerta mais recente cujo destinatario inclui esse telefone
      const { data: recentAlerts } = await supabase
        .from("panel_offline_alerts_history")
        .select("id, painel_id, destinatarios_notificados, alert_number, incident_id, incident_number, created_at, tipo")
        .order("created_at", { ascending: false })
        .limit(40);

      let matched: any = null;
      for (const a of recentAlerts || []) {
        const recipients: string[] = (a.destinatarios_notificados as any) || [];
        for (const r of recipients) {
          const rc = String(r || "").replace(/\D/g, "");
          if (rc && (rc.endsWith(tail) || tail.endsWith(rc.slice(-8)))) {
            matched = a;
            break;
          }
        }
        if (matched) break;
      }

      if (matched && matched.painel_id) {
        const deviceId = matched.painel_id as string;

      const deviceId = matched.painel_id as string;
      const { data: device } = await supabase
        .from("devices")
        .select("id, name, metadata")
        .eq("id", deviceId)
        .single();

      const deviceName = device?.name || "Painel";
      const metadata = (device?.metadata as any) || {};

      // Mapeia opção -> ação
      const optionMap: Record<string, { label: string; emoji: string; action: "verify" | "pause_3h" | "pause_indefinite" }> = {
        "1": { label: "Já estou verificando", emoji: "🔧", action: "verify" },
        "2": { label: "Visualizei", emoji: "👁️", action: "pause_3h" },
        "3": { label: "Interromper Notificações", emoji: "🛑", action: "pause_indefinite" },
      };
      const chosen = optionMap[trimmed];

      // Aplica pausa se necessário
      if (chosen.action === "pause_3h" || chosen.action === "pause_indefinite") {
        const pausedUntil = chosen.action === "pause_indefinite"
          ? "indefinite"
          : new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

        await supabase
          .from("devices")
          .update({
            metadata: {
              ...metadata,
              notifications_paused_until: pausedUntil,
              paused_by: phone,
              paused_by_name: senderName,
              paused_at: new Date().toISOString(),
            },
          })
          .eq("id", deviceId);
      }

      // Resolve UUID do botão correspondente para FK
      const { data: btnRow } = await supabase
        .from("panel_offline_alert_buttons")
        .select("id, label")
        .ilike("label", `%${chosen.label}%`)
        .maybeSingle();

      // Registra confirmação
      await supabase.from("panel_offline_alert_confirmations").insert({
        alert_history_id: matched.id,
        device_id: deviceId,
        device_name: deviceName,
        recipient_phone: phone,
        recipient_name: senderName,
        button_id: btnRow?.id || null,
        button_label: `${chosen.emoji} ${chosen.label}`,
        raw_webhook: payload,
        alert_number: matched.alert_number || null,
        incident_id: matched.incident_id || null,
        incident_number: matched.incident_number || null,
      });

      // Mensagem de confirmação
      const nowBr = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      let ack = "";
      if (chosen.action === "verify") {
        ack =
          `✅ *Confirmação registrada*\n\n` +
          `👤 ${senderName}\n` +
          `📍 ${deviceName}\n` +
          `🔧 Já estou verificando\n` +
          `⏰ ${nowBr}`;
      } else if (chosen.action === "pause_3h") {
        ack =
          `👁️ *Visualizei registrado*\n\n` +
          `📍 ${deviceName}\n` +
          `⏸️ Notificações pausadas por *3 horas*\n` +
          `⏰ ${nowBr}`;
      } else {
        ack =
          `🛑 *Notificações interrompidas*\n\n` +
          `📍 ${deviceName}\n` +
          `✅ Você não receberá mais alertas deste painel enquanto ele estiver offline.\n` +
          `🔔 Os alertas voltam automaticamente quando o painel ficar online novamente.\n` +
          `⏰ ${nowBr}`;
      }
      await sendReply(supabase, phone, ack);

      return json(200, {
        handled: true,
        processed: "panel_alert_text_response",
        option: trimmed,
        device_id: deviceId,
      });
    }

    // =============== ROUTE 2: respostas a tarefas (1/2/3/SIM/NAO/datas) ===============
    try {
      const { data: taskRes } = await supabase.functions.invoke("task-follow-up-response", {
        });

        return json(200, {
          handled: true,
          processed: "panel_alert_text_response",
          option: trimmed,
          device_id: deviceId,
        });
      }
      if (taskRes?.handled) {
        return json(200, { handled: true, processed: "task_followup", result: taskRes });
      }
    } catch (e) {
      console.warn("[EVO-WEBHOOK] task-follow-up-response failed:", (e as Error).message);
    }

    // =============== ROUTE 3: task ack textual (confirmação manual) ===============
    if (trimmed === "✅ Confirmar recebimento" || upper.includes("CONFIRMAR RECEBIMENTO")) {
      const { data: receipt } = await supabase
        .from("task_read_receipts")
        .select("id, task_id, contact_phone")
        .ilike("contact_phone", `%${phone.slice(-8)}%`)
        .eq("status", "sent")
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (receipt) {
        await supabase
          .from("task_read_receipts")
          .update({ read_at: new Date().toISOString(), status: "read" })
          .eq("id", receipt.id);
        await sendReply(supabase, phone, "✅ Recebimento confirmado.");
        return json(200, { handled: true, processed: "task_ack_text" });
      }
    }

    return json(200, { handled: false, reason: "no_route_matched" });
  } catch (err) {
    console.error("[EVO-WEBHOOK] error:", (err as Error).message);
    return json(500, { error: (err as Error).message });
  }
});
