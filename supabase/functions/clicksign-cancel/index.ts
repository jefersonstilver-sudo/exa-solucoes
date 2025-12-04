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
    const { contrato_id, motivo } = await req.json();

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
      // Se não tem envelope, apenas atualizar status local
      await supabase
        .from("contratos_legais")
        .update({
          status: "cancelado",
          cancelado_em: new Date().toISOString()
        })
        .eq("id", contrato_id);

      return new Response(
        JSON.stringify({ success: true, message: "Contrato cancelado localmente" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Cancelando contrato no ClickSign:", contrato.numero_contrato);

    // Cancelar no ClickSign
    const cancelResponse = await fetch(
      `https://app.clicksign.com/api/v3/envelopes/${contrato.clicksign_envelope_id}/cancel`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${clicksignToken}`
        }
      }
    );

    if (!cancelResponse.ok) {
      const errorText = await cancelResponse.text();
      console.error("Erro ao cancelar no ClickSign:", errorText);
      // Mesmo com erro no ClickSign, atualizar local
    }

    // Atualizar status local
    await supabase
      .from("contratos_legais")
      .update({
        status: "cancelado",
        cancelado_em: new Date().toISOString()
      })
      .eq("id", contrato_id);

    // Registrar log
    await supabase.from("contratos_legais_logs").insert({
      contrato_id,
      acao: "cancelado",
      detalhes: { 
        envelope_id: contrato.clicksign_envelope_id,
        motivo: motivo || "Cancelado pelo admin"
      }
    });

    console.log("Contrato cancelado com sucesso!");

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
