/**
 * Registra no sistema EXA (edge function noticias-diarias-check) as manchetes de um vídeo publicado,
 * para a Sofia mandar o resumo ao CEO às 07:30 e 16:30. Nunca derruba a automação: em erro só registra no log.
 * .env: NOTICIAS_TOKEN (chave de registro)
 */
import "dotenv/config";
const URL_FUNCAO = "https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/noticias-diarias-check";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk";
const limpa = s => String(s || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

/** tipo: "brasil" | "foz" | "curiosidades"; itens: [{titulo, url?, cat?}] */
export async function registrarResumo(tipo, titulo, itens, log = console.log) {
  if (process.env.NOTICIAS_PUBLICAR === "0") { log("  [RESUMO] teste — manchetes não registradas."); return false; }
  // nuvem (GitHub): grava direto na tabela com a chave de serviço
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const K = process.env.SUPABASE_SERVICE_ROLE_KEY, U = (process.env.SUPABASE_URL || "https://aakenoljsycyrcrchgxj.supabase.co").replace(/\/+$/, "");
      const r = await fetch(`${U}/rest/v1/noticias_diarias`, { method: "POST", signal: AbortSignal.timeout(30000),
        headers: { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ tipo, titulo: String(titulo).slice(0, 120), itens: itens.slice(0, 10).map(i => ({ titulo: limpa(i.titulo).slice(0, 220), url: i.url || null, cat: i.cat ? limpa(i.cat).slice(0, 40) : null })) }) });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 150)}`);
      log(`  [RESUMO] ${itens.length} manchetes registradas para o resumo da Sofia.`); return true;
    } catch (e) { log(`  [RESUMO] AVISO: não registrei o resumo (${e.message}).`); return false; }
  }
  const token = process.env.NOTICIAS_TOKEN;
  if (!token) { log("  [RESUMO] NOTICIAS_TOKEN ausente no .env — resumo não registrado."); return false; }
  try {
    const r = await fetch(URL_FUNCAO, { method: "POST", signal: AbortSignal.timeout(30000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}` },
      body: JSON.stringify({ acao: "registrar", token, tipo, titulo,
        itens: itens.map(i => ({ titulo: limpa(i.titulo), url: i.url || null, cat: i.cat ? limpa(i.cat) : null })) }) });
    const t = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status} ${t.slice(0, 150)}`);
    log(`  [RESUMO] ${itens.length} manchetes registradas para o resumo da Sofia.`);
    return true;
  } catch (e) { log(`  [RESUMO] AVISO: não registrei o resumo (${e.message}).`); return false; }
}
