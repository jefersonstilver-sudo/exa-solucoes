// EXA "Vendo as telas" (01/11/2026) — QR do vídeo diário da EXA.
// GET ?c=0111A  → registra a leitura do QR (código do vídeo) e abre o WhatsApp da Sofia
// com a mensagem já escrita, incluindo o código. A Sofia liga a conversa ao vídeo pelo código.
// Público (verify_jwt = false). Nunca falha para o morador: se o banco cair, redireciona mesmo assim.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SOFIA = "5545991415920";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const bruto = (url.searchParams.get("c") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const codigo = bruto.length >= 3 ? bruto : null;
  const texto = codigo
    ? `Oi Sofia! Vi a EXA no elevador e quero anunciar minha marca. (cód. ${codigo})`
    : "Oi Sofia! Vi a EXA no elevador e quero anunciar minha marca.";
  const destino = `https://wa.me/${SOFIA}?text=${encodeURIComponent(texto)}`;

  if (codigo && req.method === "GET") {
    try {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
      const ua = (req.headers.get("user-agent") || "").slice(0, 200);
      // robôs de pré-visualização (WhatsApp, Telegram, Facebook) não contam como leitura
      const robo = /bot|crawler|preview|facebookexternalhit|whatsapp|telegram|slack|discord/i.test(ua);
      if (!robo) {
        await sb.from("exa_autopromo_eventos").insert({
          codigo, tipo: "leitura_qr", origem: "qr",
          ip_hash: ip ? await sha(ip + ":exa-autopromo") : null,
          dados: { ua },
        });
      }
    } catch (e) {
      console.error("[exa-autopromo-qr] registro falhou", e);
    }
  }

  return new Response(null, { status: 302, headers: { Location: destino, "Cache-Control": "no-store" } });
});
