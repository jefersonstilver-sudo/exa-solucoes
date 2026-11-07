/**
 * Cotações dos parceiros de câmbio para o quadro "Câmbio hoje" das telas (07/11/2026).
 *  - K2 Câmbio (Foz): https://k2cambio.com.br/ — valores no HTML (Dólar, Euro em R$; Peso e Guarani por R$ 1). O site não tem hora:
 *    guardamos quando os valores mudaram (mudou_em) e quando conferimos (consultado_em).
 *  - Fortuna Cambios, tabela "Caixa Aux. Jebai": https://www.fortunacambios.com.py/pt/ — JSON `cotizacionesJebai` no HTML
 *    + "Última atualização" da própria página (atualizado_site).
 * Público e só leitura (são preços publicados nos sites). Cache de 5 min na memória + tabela cambio_parceiros.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const UA = 'Mozilla/5.0 (EXA Midia; quadro de cambio dos parceiros)';
let cache: { em: number; corpo: string } | null = null;

const num = (s: string) => Number(String(s).replace(/\./g, '').replace(',', '.'));

async function lerK2() {
  const r = await fetch('https://k2cambio.com.br/', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error('K2 HTTP ' + r.status);
  const t = (await r.text()).replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const pega = (nome: string, sim: string) => {
    const i = t.indexOf(nome);
    if (i < 0) throw new Error('K2 sem ' + nome);
    const re = new RegExp(sim.replace('$', '\\$') + '\\s*([\\d.]+(?:,\\d+)?)', 'g');
    re.lastIndex = i;
    const a = re.exec(t), b = re.exec(t);
    if (!a || !b || b.index - i > 120) throw new Error('K2 valores de ' + nome);
    const v = { compra: num(a[1]), venda: num(b[1]) };
    if (!(v.compra > 0) || !(v.venda > 0)) throw new Error('K2 valor inválido em ' + nome);
    return v;
  };
  return { dolar: pega('DÓLAR', 'R$'), euro: pega('EURO', 'R$'), peso: pega('PESO ARG', 'P$'), guarani: pega('GUARANI', 'G$') };
}

async function lerFortunaJebai() {
  const r = await fetch('https://www.fortunacambios.com.py/pt/', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error('Fortuna HTTP ' + r.status);
  const h = await r.text();
  const m = h.match(/const\s+cotizacionesJebai\s*=\s*(\[[\s\S]*?\]);/);
  if (!m) throw new Error('Fortuna sem cotizacionesJebai');
  const lista = JSON.parse(m[1]) as any[];
  const porNome = (n: string) => {
    const x = lista.find((y) => String(y.NOMBRE).trim().toLowerCase() === n.toLowerCase());
    if (!x) throw new Error('Fortuna sem ' + n);
    const v = { compra: Number(x.COMPRA), venda: Number(x.VENTA) };
    if (!(v.compra > 0) || !(v.venda > 0)) throw new Error('Fortuna valor inválido em ' + n);
    return v;
  };
  const u = h.match(/Caixa Aux\.\s*Jebai\s*<\/h2>\s*<p[^>]*update-status[^>]*>\s*[^<]*?(\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2}\s*[AP]M)/i);
  return {
    valores: { dolar: porNome('Dólar'), real: porNome('Real'), euro: porNome('Euro'), peso: porNome('Peso Arg.'), dolarReal: porNome('Dólar x Real'), euroDolar: porNome('Euro x Dólar') },
    atualizado_site: u ? u[1].replace(/\s+/g, ' ') : null,
  };
}

async function guardar(id: string, valores: unknown, atualizado_site: string | null) {
  const agora = new Date().toISOString();
  const { data: antes } = await admin.from('cambio_parceiros').select('valores, mudou_em').eq('id', id).maybeSingle();
  const mudou = !antes || JSON.stringify(antes.valores) !== JSON.stringify(valores);
  const linha = { id, valores, atualizado_site, consultado_em: agora, mudou_em: mudou ? agora : antes!.mudou_em, erro: null };
  await admin.from('cambio_parceiros').upsert(linha);
  return linha;
}

async function montar() {
  const saida: Record<string, unknown> = {};
  const fontes: [string, () => Promise<{ valores: unknown; atualizado_site: string | null }>][] = [
    ['k2', async () => ({ valores: await lerK2(), atualizado_site: null })],
    ['fortuna_jebai', lerFortunaJebai],
  ];
  for (const [id, ler] of fontes) {
    try {
      const v = await ler();
      saida[id] = await guardar(id, v.valores, v.atualizado_site);
    } catch (e) {
      // site fora do ar ou mudou o layout: devolve o último valor guardado e marca o erro (a tela mostra a hora do último que deu certo)
      const msg = String((e as Error)?.message || e).slice(0, 200);
      console.error('[cambio-parceiros]', id, msg);
      await admin.from('cambio_parceiros').update({ erro: msg }).eq('id', id);
      const { data } = await admin.from('cambio_parceiros').select('*').eq('id', id).maybeSingle();
      saida[id] = data ? { ...data, erro: msg } : { id, erro: msg };
    }
  }
  return saida;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    if (!cache || Date.now() - cache.em > 5 * 60 * 1000) cache = { em: Date.now(), corpo: JSON.stringify(await montar()) };
    return new Response(cache.corpo, { headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' } });
  } catch (e) {
    return new Response(JSON.stringify({ erro: String((e as Error)?.message || e) }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
