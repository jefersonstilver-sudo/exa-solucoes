// EXA (04/11/2026) — QR rastreado dos vídeos que a EXA produz para anunciantes.
// GET ?c=SOHO3 → registra a leitura (código do vídeo) e redireciona para o destino do código:
// WhatsApp do anunciante com a mensagem pronta (citando o vídeo e a tela da EXA) ou outro link.
// Público (verify_jwt = false). Nunca falha para quem leu: se o banco cair, vai para o site da EXA.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SITE = "https://examidia.com.br";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

function destinoDe(l: { codigo: string; whatsapp: string | null; mensagem: string | null; destino_url: string | null }) {
  const num = (l.whatsapp || "").replace(/\D/g, "");
  if (num.length >= 10) {
    const texto = (l.mensagem || "Olá! Vi seu anúncio na tela da EXA e quero saber mais.").replaceAll("{codigo}", l.codigo);
    return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
  }
  const u = l.destino_url || "";
  return /^https:\/\//i.test(u) ? u : SITE;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const codigo = (url.searchParams.get("c") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  let destino = SITE;
  if (codigo.length >= 3) {
    try {
      const { data: l } = await sb.from("exa_qr_links")
        .select("codigo, whatsapp, mensagem, destino_url, ativo").eq("codigo", codigo).maybeSingle();
      if (l && l.ativo) {
        destino = destinoDe(l);
        if (req.method === "GET" && !url.searchParams.has("teste")) {
          const ua = (req.headers.get("user-agent") || "").slice(0, 200);
          // robôs de pré-visualização não contam como leitura
          const robo = /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord/i.test(ua);
          if (!robo) {
            const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
            const dispositivo = /iphone|ipad|ios/i.test(ua) ? "iphone" : /android/i.test(ua) ? "android" : "outro";
            await sb.from("exa_qr_leituras").insert({
              codigo, ua, dispositivo, ip_hash: ip ? await sha(ip + ":exa-qr") : null,
            });
          }
        }
      }
    } catch (e) {
      console.error("[exa-qr] falhou", e);
    }
  }
  return new Response(null, { status: 302, headers: { Location: destino, "Cache-Control": "no-store" } });
});
