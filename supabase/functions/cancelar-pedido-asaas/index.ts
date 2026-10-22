// cancelar-pedido-asaas
// Antes de excluir um pedido, mapeia e cancela tudo o que ele tem no Asaas:
// autorizacao de Pix Automatico, assinatura e cobrancas pendentes/vencidas.
// Cobranca ja paga NUNCA e tocada (excluir cobranca no Asaas nao estorna; estorno e manual).
// Os IDs do Asaas vem sempre do banco (pedido, sofia_cobrancas), nunca do navegador.
//
// POST { modo: "mapear" | "cancelar", pedido_ids: string[], justificativa?: string }
//   mapear   -> so leitura: lista o que existe no Asaas para cada pedido
//   cancelar -> executa os cancelamentos e grava auditoria; ok=true so se nada falhou
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2.117.2/cors?target=deno';

const ASAAS = 'https://api.asaas.com/v3';
type J = Record<string, any>;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const safe = (v: unknown) => typeof v === 'string' && /^[A-Za-z0-9_-]{1,120}$/.test(v) ? v : null;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Status de cobranca no Asaas
const PAGO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'DUNNING_RECEIVED'];
const CANCELAVEL = ['PENDING', 'OVERDUE', 'AWAITING_RISK_ANALYSIS'];

async function asaas(method: 'GET' | 'DELETE' | 'POST', path: string, key: string): Promise<{ ok: boolean; status: number; data: J | null }> {
  try {
    const r = await fetch(ASAAS + path, { method, headers: { access_token: key, 'User-Agent': 'EXA-Midia/1.0' }, signal: AbortSignal.timeout(15000) });
    const t = await r.text();
    let d: J | null = null; try { d = t ? JSON.parse(t) : null; } catch { d = { raw: t.slice(0, 300) }; }
    return { ok: r.ok, status: r.status, data: d };
  } catch (e) {
    return { ok: false, status: 0, data: { erro: e instanceof Error ? e.message : String(e) } };
  }
}

interface Cobranca { id: string; status: string; valor: number | null; vencimento: string | null; pago_em: string | null; origem: string; removida: boolean }
interface Mapa {
  pedido_id: string; nome: string | null; erros_leitura: string[];
  assinatura: { id: string; status: string | null } | null;
  autorizacao_pix: { id: string; status: string | null; caminho: string | null } | null;
  cobrancas: Cobranca[];
}

// Pix Automatico: a conta pode usar o endereco novo (/pix/automatic/authorizations) ou o antigo (/pix/directAuthorizations).
const PIX_PATHS = ['/pix/automatic/authorizations/', '/pix/directAuthorizations/'];

async function mapear(db: any, key: string, pedidoId: string): Promise<Mapa> {
  const m: Mapa = { pedido_id: pedidoId, nome: null, erros_leitura: [], assinatura: null, autorizacao_pix: null, cobrancas: [] };
  const { data: p, error } = await db.from('pedidos').select('id,nome_pedido,asaas_subscription_id,asaas_authorization_id').eq('id', pedidoId).maybeSingle();
  if (error || !p) { m.erros_leitura.push('pedido nao encontrado'); return m; }
  m.nome = p.nome_pedido;
  const vistos = new Map<string, Cobranca>();
  const addPay = (x: J, origem: string) => {
    const id = safe(x?.id); if (!id || vistos.has(id)) return;
    vistos.set(id, { id, status: String(x.status || '?'), valor: typeof x.value === 'number' ? x.value : null, vencimento: x.dueDate || null, pago_em: x.paymentDate || x.clientPaymentDate || null, origem, removida: x.deleted === true });
  };

  // 1) assinatura
  const sub = safe(p.asaas_subscription_id);
  if (sub) {
    const r = await asaas('GET', `/subscriptions/${sub}`, key);
    m.assinatura = { id: sub, status: r.ok ? (r.data?.deleted ? 'DELETED' : String(r.data?.status || '?')) : (r.status === 404 ? 'NAO_ENCONTRADA' : null) };
    if (!r.ok && r.status !== 404) m.erros_leitura.push('assinatura ' + sub + ': HTTP ' + r.status);
    const lp = await asaas('GET', `/payments?subscription=${sub}&limit=100`, key);
    if (lp.ok) for (const x of lp.data?.data || []) addPay(x, 'assinatura');
    else if (lp.status !== 404) m.erros_leitura.push('cobrancas da assinatura: HTTP ' + lp.status);
  }

  // 2) autorizacao de Pix Automatico
  const aut = safe(p.asaas_authorization_id);
  if (aut) {
    let achou = false;
    for (const base of PIX_PATHS) {
      const r = await asaas('GET', base + aut, key);
      if (r.ok) { m.autorizacao_pix = { id: aut, status: String(r.data?.status || '?'), caminho: base }; achou = true; break; }
      if (r.status !== 404) m.erros_leitura.push('autorizacao pix ' + aut + ' (' + base + '): HTTP ' + r.status);
    }
    // nao achar a autorizacao em nenhum endereco NAO prova que ela foi cancelada: bloqueia a exclusao
    if (!achou) { m.autorizacao_pix = { id: aut, status: 'NAO_ENCONTRADA', caminho: null }; m.erros_leitura.push('autorizacao Pix Automatico ' + aut + ' nao encontrada no Asaas; confira manualmente antes de excluir'); }
  }

  // 3) cobrancas gravadas pela Sofia para este pedido
  const { data: sc } = await db.from('sofia_cobrancas').select('asaas_id,external_reference').eq('pedido_id', pedidoId);
  const refs = new Set<string>([pedidoId]);
  for (const c of sc || []) {
    if (c.external_reference) refs.add(String(c.external_reference));
    const id = safe(c.asaas_id); if (!id || vistos.has(id)) continue;
    const r = await asaas('GET', `/payments/${id}`, key);
    if (r.ok) addPay(r.data, 'sofia');
    else if (r.status !== 404) m.erros_leitura.push('cobranca ' + id + ': HTTP ' + r.status);
  }

  // 3b) cobranca do aceite da Sofia ligado ao pedido (o aceite tambem pode ser a referencia externa)
  const { data: acs } = await db.from('sofia_aceites').select('id,cobranca_id').eq('pedido_id', pedidoId);
  for (const a of acs || []) {
    refs.add(String(a.id));
    const id = safe(a.cobranca_id); if (!id || vistos.has(id)) continue;
    const r = await asaas('GET', `/payments/${id}`, key);
    if (r.ok) addPay(r.data, 'aceite');
    else if (r.status !== 404) m.erros_leitura.push('cobranca do aceite ' + id + ': HTTP ' + r.status);
  }

  // 4) cobrancas com a referencia externa do pedido
  for (const ref of refs) {
    if (!/^[A-Za-z0-9_:.-]{1,120}$/.test(ref)) continue;
    const r = await asaas('GET', `/payments?externalReference=${encodeURIComponent(ref)}&limit=100`, key);
    if (r.ok) for (const x of r.data?.data || []) addPay(x, 'referencia');
    else m.erros_leitura.push('busca por referencia: HTTP ' + r.status);
  }

  m.cobrancas = [...vistos.values()].sort((a, b) => String(a.vencimento).localeCompare(String(b.vencimento)));
  return m;
}

function resumo(m: Mapa) {
  const ativas = m.cobrancas.filter(c => !c.removida);
  return {
    pagas: ativas.filter(c => PAGO.includes(c.status)),
    a_cancelar: ativas.filter(c => CANCELAVEL.includes(c.status)),
    outras: ativas.filter(c => !PAGO.includes(c.status) && !CANCELAVEL.includes(c.status)),
    assinatura_ativa: !!m.assinatura && !['DELETED', 'INACTIVE', 'EXPIRED', 'NAO_ENCONTRADA'].includes(String(m.assinatura.status)),
    autorizacao_ativa: !!m.autorizacao_pix && !['CANCELLED', 'CANCELED', 'EXPIRED', 'REFUSED', 'NAO_ENCONTRADA'].includes(String(m.autorizacao_pix.status)),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const key = Deno.env.get('ASAAS_API_KEY'), url = Deno.env.get('SUPABASE_URL'), service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key || !url || !service) return json({ error: 'Servico indisponivel' }, 503);
  const db = createClient(url, service);

  // so administradores
  const bearer = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!bearer) return json({ error: 'Unauthorized' }, 401);
  const { data: { user }, error: ae } = await db.auth.getUser(bearer);
  if (ae || !user) return json({ error: 'Unauthorized' }, 401);
  const { data: roles } = await db.from('user_roles').select('role').eq('user_id', user.id).in('role', ['super_admin', 'admin', 'admin_financeiro']).limit(1);
  if (!roles?.length) return json({ error: 'Forbidden' }, 403);

  const body = await req.json().catch(() => null) as J | null;
  const modo = body?.modo;
  const ids: string[] = Array.isArray(body?.pedido_ids) ? body!.pedido_ids.filter((x: unknown) => typeof x === 'string' && UUID.test(x)) : [];
  if (!['mapear', 'cancelar'].includes(modo) || !ids.length || ids.length > 50) return json({ error: 'Parametros invalidos' }, 400);
  const justificativa = String(body?.justificativa || '').slice(0, 500);

  const pedidos: J[] = [];
  let tudoOk = true;
  for (const id of ids) {
    const m = await mapear(db, key, id);
    const r = resumo(m);
    const out: J = {
      pedido_id: id, nome: m.nome, erros_leitura: m.erros_leitura,
      assinatura: m.assinatura, autorizacao_pix: m.autorizacao_pix,
      pagas: r.pagas, a_cancelar: r.a_cancelar, outras: r.outras,
      tem_algo_no_asaas: !!(m.assinatura || m.autorizacao_pix || m.cobrancas.length),
    };
    if (modo === 'cancelar') {
      const acoes: J[] = [];
      const reg = (tipo: string, alvo: string, res: { ok: boolean; status: number; data: J | null }) => {
        const ok = res.ok || res.status === 404; // 404 = ja nao existe
        acoes.push({ tipo, alvo, ok, http: res.status, detalhe: ok ? null : JSON.stringify(res.data).slice(0, 300) });
        return ok;
      };
      // ordem: para a recorrencia primeiro, depois remove as cobrancas abertas
      if (r.autorizacao_ativa && m.autorizacao_pix) reg('autorizacao_pix', m.autorizacao_pix.id, await asaas('DELETE', (m.autorizacao_pix.caminho || PIX_PATHS[0]) + m.autorizacao_pix.id, key));
      if (r.assinatura_ativa && m.assinatura) reg('assinatura', m.assinatura.id, await asaas('DELETE', `/subscriptions/${m.assinatura.id}`, key));
      for (const c of r.a_cancelar) reg('cobranca', c.id, await asaas('DELETE', `/payments/${c.id}`, key));
      // confere: nada aberto pode sobrar
      const depois = resumo(await mapear(db, key, id));
      const sobrou = depois.a_cancelar.map(c => c.id);
      if (depois.autorizacao_ativa) sobrou.push('autorizacao ' + m.autorizacao_pix?.id);
      if (depois.assinatura_ativa) sobrou.push('assinatura ' + m.assinatura?.id);
      const ok = acoes.every(a => a.ok) && sobrou.length === 0 && m.erros_leitura.length === 0;
      if (!ok) tudoOk = false;
      out.acoes = acoes; out.sobrou_aberto = sobrou; out.ok = ok;
      if (r.a_cancelar.length) await db.from('sofia_cobrancas').update({ status: 'CANCELADA_EXCLUSAO_PEDIDO' }).eq('pedido_id', id).in('asaas_id', r.a_cancelar.map(c => c.id));
      await db.from('log_eventos_sistema').insert({
        tipo_evento: ok ? 'PEDIDO_ASAAS_CANCELADO' : 'PEDIDO_ASAAS_CANCELAMENTO_FALHOU',
        descricao: JSON.stringify({ pedido_id: id, nome: m.nome, por: user.email, justificativa, acoes, sobrou_aberto: sobrou, pagas_mantidas: r.pagas.map(c => ({ id: c.id, valor: c.valor, pago_em: c.pago_em })) }).slice(0, 8000),
      });
    } else if (m.erros_leitura.length) tudoOk = false;
    pedidos.push(out);
  }
  return json({ modo, ok: tudoOk, pedidos });
});
