import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("ClickSign Webhook recebido:", JSON.stringify(payload, null, 2));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extrair dados do webhook
    const event = payload.event || payload.type;
    const envelope = payload.envelope || payload.data?.envelope;
    const document = payload.document || payload.data?.document;
    const signer = payload.signer || payload.data?.signer;

    const envelopeId = envelope?.key || envelope?.id;

    if (!envelopeId) {
      console.log("Webhook sem envelope_id, ignorando");
      return new Response(
        JSON.stringify({ status: "ignored", reason: "no envelope_id" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Evento: ${event}, Envelope: ${envelopeId}`);

    // Buscar contrato pelo envelope_id
    const { data: contrato, error: contratoError } = await supabase
      .from("contratos_legais")
      .select("*")
      .eq("clicksign_envelope_id", envelopeId)
      .single();

    if (contratoError || !contrato) {
      console.log("Contrato não encontrado para envelope:", envelopeId);
      return new Response(
        JSON.stringify({ status: "ignored", reason: "contract not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Contrato encontrado:", contrato.numero_contrato);

    // Processar evento
    let updateData: any = {};
    let logAcao = event;

    switch (event) {
      case "sign":
      case "signature":
        // Documento assinado - PROPAGAR PARA PEDIDO
        updateData = {
          status: "assinado",
          assinado_em: new Date().toISOString()
        };
        logAcao = "assinado";
        console.log("✅ Contrato assinado! Propagando para pedido...");
        
        // CRÍTICO: Atualizar status do PEDIDO para liberar upload
        if (contrato.proposta_id) {
          // Buscar pedido via proposta
          const { data: proposal } = await supabase
            .from("proposals")
            .select("converted_order_id")
            .eq("id", contrato.proposta_id)
            .single();
          
          if (proposal?.converted_order_id) {
            console.log("📦 Atualizando pedido:", proposal.converted_order_id);
            const { error: pedidoError } = await supabase
              .from("pedidos")
              .update({
                status: "aguardando_video",
                contrato_id: contrato.id,
                contrato_assinado_em: new Date().toISOString()
              })
              .eq("id", proposal.converted_order_id);
            
            if (pedidoError) {
              console.error("❌ Erro ao atualizar pedido:", pedidoError);
            } else {
              console.log("✅ Pedido atualizado para aguardando_video - UPLOAD LIBERADO!");
              
              // Notificar cliente que pode enviar vídeo
              try {
                await supabase.functions.invoke("notify-exa-alert", {
                  body: {
                    type: "upload_enabled",
                    title: "🎬 Upload Liberado!",
                    message: `Contrato ${contrato.numero_contrato} assinado. Cliente pode enviar vídeos.`,
                    priority: "high"
                  }
                });
              } catch (notifyErr) {
                console.warn("⚠️ Erro ao notificar (não crítico):", notifyErr);
              }
            }
          } else {
            console.warn("⚠️ Pedido não encontrado para proposta:", contrato.proposta_id);
          }
        } else {
          console.warn("⚠️ Contrato sem proposta_id vinculada");
        }
        break;

      case "auto_close":
      case "close":
        // Documento finalizado
        updateData = {
          status: "assinado",
          assinado_em: contrato.assinado_em || new Date().toISOString()
        };
        logAcao = "finalizado";
        console.log("Contrato finalizado!");
        break;

      case "document_closed":
        // Documento pronto para download
        const downloadUrl = document?.signed_file?.url || document?.download_url;
        if (downloadUrl) {
          updateData = {
            clicksign_download_url: downloadUrl
          };
        }
        logAcao = "documento_disponivel";
        console.log("Documento disponível para download:", downloadUrl);
        break;

      case "refusal":
        // Documento recusado
        updateData = {
          status: "recusado",
          recusado_em: new Date().toISOString()
        };
        logAcao = "recusado";
        console.log("Contrato recusado!");
        break;

      case "deadline":
        // Prazo expirado
        updateData = {
          status: "expirado",
          expirado_em: new Date().toISOString()
        };
        logAcao = "expirado";
        console.log("Contrato expirado!");
        break;

      case "cancel":
        // Documento cancelado
        updateData = {
          status: "cancelado",
          cancelado_em: new Date().toISOString()
        };
        logAcao = "cancelado";
        console.log("Contrato cancelado!");
        break;

      case "upload":
        logAcao = "documento_enviado";
        break;

      case "add_signer":
        logAcao = "signatario_adicionado";
        break;

      case "signature_started":
        updateData = {
          status: "visualizado",
          visualizado_em: new Date().toISOString()
        };
        logAcao = "assinatura_iniciada";
        console.log("Assinatura iniciada pelo cliente!");
        break;

      default:
        console.log("Evento não tratado:", event);
        logAcao = event;
    }

    // Atualizar contrato se houver dados
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("contratos_legais")
        .update(updateData)
        .eq("id", contrato.id);

      if (updateError) {
        console.error("Erro ao atualizar contrato:", updateError);
      } else {
        console.log("Contrato atualizado com sucesso");
      }
    }

    // Registrar log do evento
    await supabase.from("contratos_legais_logs").insert({
      contrato_id: contrato.id,
      acao: logAcao,
      detalhes: {
        event,
        envelope_id: envelopeId,
        signer: signer?.email || null,
        raw_payload: payload
      }
    });

    // Enviar EXA Alert para eventos importantes
    if (["assinado", "recusado", "expirado"].includes(logAcao)) {
      try {
        await supabase.functions.invoke("notify-exa-alert", {
          body: {
            type: logAcao === "assinado" ? "contract_signed" : "contract_" + logAcao,
            title: logAcao === "assinado" 
              ? `✅ Contrato Assinado: ${contrato.numero_contrato}`
              : `⚠️ Contrato ${logAcao}: ${contrato.numero_contrato}`,
            message: `Cliente: ${contrato.cliente_nome}\nValor: R$ ${contrato.valor_total?.toLocaleString('pt-BR')}`,
            priority: logAcao === "assinado" ? "normal" : "high"
          }
        });
      } catch (alertError) {
        console.error("Erro ao enviar EXA Alert:", alertError);
      }
    }

    return new Response(
      JSON.stringify({ status: "processed", event: logAcao }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro no webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
