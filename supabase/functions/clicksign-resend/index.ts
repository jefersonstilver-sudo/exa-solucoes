import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contrato_id } = await req.json();

    if (!contrato_id) {
      return new Response(
        JSON.stringify({ error: "contrato_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clicksignToken = Deno.env.get("CLICKSIGN_ACCESS_TOKEN");

    if (!clicksignToken) {
      return new Response(
        JSON.stringify({ error: "ClickSign não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar contrato
    const { data: contrato, error: contratoError } = await supabase
      .from("contratos_legais")
      .select("*")
      .eq("id", contrato_id)
      .single();

    if (contratoError || !contrato) {
      return new Response(
        JSON.stringify({ error: "Contrato não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!contrato.clicksign_envelope_id) {
      return new Response(
        JSON.stringify({ error: "Contrato não possui envelope no ClickSign" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Reenviando notificação para:", contrato.numero_contrato);

    // Reenviar notificação
    const notifyResponse = await fetch(
      `https://app.clicksign.com/api/v3/envelopes/${contrato.clicksign_envelope_id}/notifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${clicksignToken}`
        },
        body: JSON.stringify({
          notification: {
            message: `Lembrete: Você tem um contrato pendente de assinatura (${contrato.numero_contrato}) da EXA Mídia.`
          }
        })
      }
    );

    if (!notifyResponse.ok) {
      const errorText = await notifyResponse.text();
      console.error("Erro ao reenviar:", errorText);
      throw new Error(`Erro ClickSign: ${errorText}`);
    }

    // Registrar log
    await supabase.from("contratos_legais_logs").insert({
      contrato_id,
      acao: "notificacao_reenviada",
      detalhes: { envelope_id: contrato.clicksign_envelope_id }
    });

    console.log("Notificação reenviada com sucesso!");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
