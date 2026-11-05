/**
 * Pede à Sofia o resumo das notícias AGORA (WhatsApp do CEO): status de Brasil, Foz e Curiosidades
 * + todas as manchetes registradas hoje. Chamado no fim de toda rodada (07h, 16h, botão manual, verificador),
 * além dos horários fixos 07:30 e 16:30 do servidor. Nunca derruba a automação.
 * Uso: node enviar-resumo.mjs
 */
import { appendFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const URL_FUNCAO = "https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/noticias-diarias-check";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk";

function log(msg) {
  const line = `[${new Date().toLocaleString("pt-BR")}] [RESUMO-SOFIA] ${msg}`;
  console.log(line);
  try { appendFileSync(join(__dirname, "daily-dooh.log"), line + "\n", "utf-8"); } catch {}
}

export async function enviarResumoSofia() {
  // antes das 16h confere a rodada da manhã (os 3 do dia); a partir das 16h confere a rodada da tarde
  const turno = new Date().getHours() >= 16 ? "tarde" : "manha";
  try {
    const r = await fetch(URL_FUNCAO, { method: "POST", signal: AbortSignal.timeout(60000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}` }, body: JSON.stringify({ turno }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.ok === false) throw new Error(`HTTP ${r.status} ${j.erro || ""}`);
    log(`Resumo (${turno}) enviado ao CEO pela Sofia — ${j.pendentes ? j.pendentes + " pendente(s)" : "tudo no ar"}.`);
    return true;
  } catch (e) { log(`AVISO: não consegui pedir o resumo à Sofia (${e.message}).`); return false; }
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("enviar-resumo.mjs")) enviarResumoSofia();
