/**
 * EXA · exa-tela — o "cérebro" das telas novas (comércio parceiro / hall), 31/10/2026.
 *
 * O aparelho (APK Android, Edge kiosk no Windows, Chromium no Linux ou qualquer navegador) abre
 * examidia.com.br/tela, pede um código (acao=iniciar) e fica perguntando o estado (acao=estado, ~60 s).
 * Quando a equipe digita o código no admin (tabela exa_telas, via RLS), o estado passa a trazer a
 * programação do local: os anúncios que valem AGORA (mesma agenda dos NUCs: override > data > recorrente,
 * fora de faixa o principal; 1 vídeo por pedido), os vídeos da casa (pedido do próprio comerciante),
 * câmeras do Portal da Cidade (contrato da EXA) e notícias do ExaSistema.
 *
 * O aparelho só tem um segredo aleatório (token); aqui guardamos o sha256. Nada de JWT no aparelho.
 * O mesmo pedido (estado) serve de batimento: grava último sinal, o que está tocando, erros e soma as
 * exibições (prova de exibição por pedido/vídeo/dia em exa_telas_exibicoes).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { agendaDoPedido, agoraBrasilia, slotAgora, ymd } from '../_shared/exa2-agenda.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const EXASISTEMA_URL = 'https://iwlscwsenzgyylopnwpu.supabase.co';
const CREDITO_CAMERAS = 'Portal da Cidade Foz';
const LOGICA = 'https://video02.logicahost.com.br/portaldacidade';
const CAMERAS_PADRAO: { chave: string; nome: string }[] = [
  { chave: 'fozpontedaamizadesentidoparaguai', nome: 'Ponte da Amizade · Sentido Paraguai' },
  { chave: 'fozpontedaamizadesentidobrasil', nome: 'Ponte da Amizade · Sentido Brasil' },
  { chave: 'fozsentidopontedaamizade01', nome: 'BR-277 · Sentido Ponte da Amizade' },
  { chave: 'fozaduanapontedaamizade', nome: 'BR-277 · Aduana da Ponte' },
  { chave: 'fozpontetancredoneves', nome: 'Ponte Tancredo Neves · Argentina' },
  { chave: 'fozpontedaintegracao', nome: 'Ponte da Integração · Paraguai' },
];
const NOME_CAMERA = new Map(CAMERAS_PADRAO.map((c) => [c.chave, c.nome]));
const STATUS_TOCANDO = ['ativo', 'video_aprovado', 'video_enviado'];
const RITMO_PADRAO = { casa_a_cada: 3, editorial_a_cada: 2, camera: true, noticias: true };

const sha256 = async (t: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map((b) => b.toString(16).padStart(2, '0')).join('');
const segredo = () => [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');
const codigo6 = () => String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
const limpa = (s: unknown, n = 300) => String(s ?? '').slice(0, n);

/** 16:9, 6:5 (área atual dos NUCs), vertical ou outro. */
function formatoDe(l?: number | null, a?: number | null, orient?: string | null): 'h169' | 'h65' | 'v' | 'q' {
  if (l && a) {
    const r = l / a;
    if (r < 0.85) return 'v';
    if (r >= 1.6) return 'h169';
    if (r >= 1.08) return 'h65';
    return 'q';
  }
  return orient === 'vertical' ? 'v' : 'h65';
}

// cache por instância (o aparelho pergunta a cada ~60 s; vários aparelhos no mesmo local dividem)
const memo = new Map<string, { t: number; v: any }>();
async function lembrar<T>(chave: string, ms: number, f: () => Promise<T>): Promise<T> {
  const m = memo.get(chave);
  if (m && Date.now() - m.t < ms) return m.v as T;
  const v = await f();
  memo.set(chave, { t: Date.now(), v });
  return v;
}

async function exaSistema(caminho: string) {
  const key = Deno.env.get('EXASISTEMA_ANON_KEY') || Deno.env.get('EXASISTEMA_SERVICE_KEY');
  if (!key) return [];
  const r = await fetch(`${EXASISTEMA_URL}/rest/v1/${caminho}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`exasistema ${r.status}`);
  return await r.json();
}

async function cameras() {
  return lembrar('cameras', 10 * 60000, async () => {
    const lista: { url: string; nome: string; credito: string; segundos: number }[] = [];
    const vistas = new Set<string>();
    const add = (url: string, nome?: string, seg?: number) => {
      if (!url || vistas.has(url) || !/\.m3u8(\?|$)/i.test(url)) return;
      vistas.add(url);
      const m = url.match(/\/([a-z0-9]+)\.stream\//i);
      lista.push({ url, nome: nome || (m && NOME_CAMERA.get(m[1])) || 'Ao vivo em Foz', credito: CREDITO_CAMERAS, segundos: Math.min(Math.max(Number(seg) || 14, 8), 30) });
    };
    try {
      const rows = await exaSistema('cameras?select=*');
      for (const r of rows || []) add(String(r.url || r.link || ''), r.nome || r.local || r.titulo, r.timing);
    } catch (e) { console.warn('[exa-tela] câmeras do ExaSistema indisponíveis', (e as Error).message); }
    for (const c of CAMERAS_PADRAO) add(`${LOGICA}/${c.chave}.stream/playlist.m3u8`, c.nome, 14);
    return lista;
  });
}

const S3_NOTICIAS = 'https://imagens-noticias.s3.sa-east-1.amazonaws.com';
const absoluto = (v: unknown) => {
  const s = String(v || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (/\.(jpe?g|png|webp|gif)$/i.test(s)) return `${S3_NOTICIAS}/${s.replace(/^\.?\/*/, '').split('/').map(encodeURIComponent).join('/')}`;
  return '';
};
async function noticias() {
  return lembrar('noticias', 5 * 60000, async () => {
    try {
      const rows: any[] = await exaSistema('noticias?select=*&order=created_at.desc&limit=40');
      const out = [];
      const vistos = new Set<string>();
      for (const r of rows || []) {
        const titulo = limpa(r.titulo || r.title || r.manchete, 220).trim();
        if (!titulo || vistos.has(titulo.toLowerCase())) continue;
        vistos.add(titulo.toLowerCase());
        const cat = limpa(r.categoria || r.category || '', 40);
        if (/culin|receita|gastronom/i.test(cat)) continue; // regra fixa: nada culinário nas notícias
        out.push({
          titulo,
          resumo: limpa(r.resumo || r.descricao || r.subtitulo || r.description || '', 260),
          categoria: cat,
          origem: limpa(r.origem || r.fonte || r.source || '', 60),
          imagem: absoluto(r.imagem_url || r.imagem || r.foto || r.image || r.thumbnail || r.thumb),
          link: /^https?:\/\//i.test(String(r.link || r.url || r.fonte_url || '')) ? String(r.link || r.url || r.fonte_url) : '',
          data: r.created_at || r.data || null,
        });
        if (out.length >= 20) break;
      }
      return out;
    } catch (e) {
      console.warn('[exa-tela] notícias indisponíveis', (e as Error).message);
      return [];
    }
  });
}

/** Anúncios que valem agora no local + vídeos da casa. */
async function programacaoDoLocal(admin: any, building: any) {
  return lembrar(`prog:${building.id}`, 55000, async () => {
    const hoje = ymd(agoraBrasilia());
    const { data: peds, error } = await admin
      .from('pedidos')
      .select('id, client_id, nome_pedido, status, data_inicio, data_fim, lista_predios')
      .in('status', STATUS_TOCANDO)
      .contains('lista_predios', [building.id]);
    if (error) throw error;
    const vigentes = (peds || []).filter((p: any) => (!p.data_inicio || String(p.data_inicio).slice(0, 10) <= hoje) && (!p.data_fim || String(p.data_fim).slice(0, 10) >= hoje));
    const casaId = building.pedido_casa_id ? String(building.pedido_casa_id) : '';
    if (casaId && !vigentes.some((p: any) => p.id === casaId)) {
      const { data: c } = await admin.from('pedidos').select('id, client_id, nome_pedido, status, data_inicio, data_fim').eq('id', casaId).maybeSingle();
      if (c) vigentes.push(c); // a casa toca mesmo sem o local na lista do pedido
    }
    const clientes = [...new Set(vigentes.map((p: any) => p.client_id).filter(Boolean))];
    const { data: us } = clientes.length ? await admin.from('users').select('id, nome, empresa_nome').in('id', clientes) : { data: [] };
    const nomeCli = new Map((us || []).map((u: any) => [u.id, u.empresa_nome || u.nome || '']));

    const anuncios: any[] = [];
    const casa: any[] = [];
    for (const p of vigentes) {
      const { slots, rules } = await agendaDoPedido(admin, p.id);
      const aprovados = slots.filter((s) => s.approved);
      if (!aprovados.length) continue;
      const ids = aprovados.map((s) => s.videoId);
      const { data: vids } = await admin.from('videos').select('id, url, nome, largura, altura, duracao, orientacao, trim_start_seconds, trim_end_seconds').in('id', ids);
      const vPor = new Map((vids || []).map((v: any) => [v.id, v]));
      const item = (slotId: string, videoId: string, tipo: string) => {
        const v: any = vPor.get(videoId);
        if (!v?.url) return null;
        return {
          id: slotId, tipo, pedido_id: p.id, video_id: v.id, url: v.url,
          titulo: String(v.nome || '').replace(/\.[^/.]+$/, ''),
          cliente: (p.id === casaId ? building.nome : '') || nomeCli.get(p.client_id) || p.nome_pedido || '',
          formato: formatoDe(v.largura, v.altura, v.orientacao),
          duracao: Number(v.duracao) || null,
          trim_inicio: Number(v.trim_start_seconds) || 0,
          trim_fim: Number(v.trim_end_seconds) || 0,
        };
      };
      if (p.id === casaId) {
        // vídeos do comerciante: todos os aprovados entram no rodízio da casa
        for (const s of aprovados) { const it = item(s.id, s.videoId, 'casa'); if (it) casa.push(it); }
        continue;
      }
      const agora = slotAgora(slots, rules, agoraBrasilia());
      if (!agora) continue;
      const atual = item(agora.slot.id, agora.slot.videoId, 'anuncio');
      if (!atual) continue;
      // versão 16:9 do mesmo anúncio: vídeo aprovado sem programação própria (não tira a vez de ninguém)
      if (atual.formato !== 'h169' && atual.formato !== 'v') {
        const semRegra = aprovados.filter((s) => s.id !== agora.slot.id && !rules.some((r) => r.slotId === s.id && r.is_active !== false));
        const alt = semRegra.map((s) => item(s.id, s.videoId, 'anuncio')).find((x) => x && x.formato === 'h169');
        if (alt) { (alt as any).versao_de = atual.id; anuncios.push(alt); continue; }
      }
      anuncios.push(atual);
    }
    return { anuncios, casa };
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, erro: 'use POST' }, 405);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  let b: any = {};
  try { b = await req.json(); } catch { return json({ ok: false, erro: 'corpo inválido' }, 400); }
  const acao = String(b.acao || '');
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;

  try {
    // ---------- aparelho novo: cria a tela e devolve o código ----------
    if (acao === 'iniciar') {
      const umaHora = new Date(Date.now() - 3600000).toISOString();
      if (ip) {
        const { count } = await admin.from('exa_telas').select('id', { count: 'exact', head: true }).eq('ip', ip).eq('status', 'aguardando').gte('criado_em', umaHora);
        if ((count || 0) >= 15) return json({ ok: false, erro: 'Muitos códigos pedidos desta rede. Tente em 1 hora.' }, 429);
      }
      const token = segredo();
      const token_hash = await sha256(token);
      for (let i = 0; i < 6; i++) {
        const codigo = codigo6();
        const { data, error } = await admin.from('exa_telas').insert({
          token_hash, codigo, codigo_expira: new Date(Date.now() + 24 * 3600000).toISOString(), status: 'aguardando',
          plataforma: limpa(b.plataforma, 20) || 'web', info: typeof b.info === 'object' && b.info ? b.info : {}, ip, versao_player: limpa(b.versao, 40),
          ultimo_sinal: new Date().toISOString(),
        }).select('id').single();
        if (!error && data) {
          if (Math.random() < 0.05) admin.rpc('exa_telas_limpar').then(() => {}, () => {});
          return json({ ok: true, tela_id: data.id, token, codigo });
        }
        if (!String(error?.message || '').includes('exa_telas_codigo_uk')) throw error;
      }
      throw new Error('não consegui gerar um código livre');
    }

    // ---------- batimento + programação ----------
    if (acao === 'estado') {
      const token = String(b.token || '');
      if (token.length < 32) return json({ ok: false, desconhecida: true, erro: 'sem token' }, 401);
      const { data: tela } = await admin.from('exa_telas').select('*').eq('token_hash', await sha256(token)).maybeSingle();
      if (!tela) return json({ ok: false, desconhecida: true, erro: 'tela não encontrada (apagada no admin?)' }, 404);

      const agora = new Date().toISOString();
      const patch: Record<string, unknown> = { ultimo_sinal: agora, ip };
      if (b.versao) patch.versao_player = limpa(b.versao, 40);
      if (b.plataforma) patch.plataforma = limpa(b.plataforma, 20);
      if (b.info && typeof b.info === 'object') patch.info = b.info;
      if (b.tocando && typeof b.tocando === 'object') patch.tocando = { ...b.tocando, em: agora };
      if (Array.isArray(b.erros)) patch.erros = b.erros.slice(-10).map((e: unknown) => limpa(e, 300));
      if (b.comando_ok && tela.comando && String(b.comando_ok) === String(tela.comando_em)) { patch.comando = null; patch.comando_em = null; }
      if (Array.isArray(b.exibicoes) && b.exibicoes.length && tela.status === 'ativa') {
        await admin.rpc('exa_telas_somar_exibicoes', { p_tela: tela.id, p_itens: b.exibicoes.slice(0, 200) });
      }
      if (Array.isArray(b.eventos) && b.eventos.length) {
        await admin.from('exa_telas_eventos').insert(b.eventos.slice(0, 20).map((e: any) => ({ tela_id: tela.id, tipo: limpa(e?.tipo, 40) || 'evento', dados: e?.dados ?? null })));
      }

      // aguardando pareamento (ou desfeito no admin): garante um código válido
      if (tela.status !== 'ativa' || !tela.building_id) {
        let codigo = tela.codigo;
        if (!codigo || !tela.codigo_expira || new Date(tela.codigo_expira).getTime() < Date.now() + 3600000) {
          for (let i = 0; i < 6; i++) {
            const c = codigo6();
            const { error } = await admin.from('exa_telas').update({ ...patch, status: 'aguardando', codigo: c, codigo_expira: new Date(Date.now() + 24 * 3600000).toISOString() }).eq('id', tela.id);
            if (!error) { codigo = c; break; }
          }
        } else await admin.from('exa_telas').update(patch).eq('id', tela.id);
        return json({ ok: true, pareada: false, codigo, tela_id: tela.id });
      }

      await admin.from('exa_telas').update(patch).eq('id', tela.id);
      const { data: building } = await admin.from('buildings')
        .select('id, nome, bairro, endereco, tipo_local, segmento_local, pedido_casa_id, telas_ritmo')
        .eq('id', tela.building_id).maybeSingle();
      if (!building) return json({ ok: true, pareada: false, codigo: null, erro: 'local apagado' });

      const ritmo = { ...RITMO_PADRAO, ...(building.telas_ritmo || {}), ...((tela.config || {}).ritmo || {}) };
      const [prog, cams, nots] = await Promise.all([
        programacaoDoLocal(admin, building).catch((e) => { console.error('[exa-tela] programação', e); return { anuncios: [], casa: [] }; }),
        ritmo.camera === false ? Promise.resolve([]) : cameras(),
        ritmo.noticias === false ? Promise.resolve([]) : noticias(),
      ]);
      const conteudo = { anuncios: prog.anuncios, casa: prog.casa, cameras: cams, noticias: nots };
      const versao = (await sha256(JSON.stringify({ l: tela.layout, c: tela.config, r: ritmo, n: tela.nome, a: prog.anuncios.map((x: any) => x.url), k: prog.casa.map((x: any) => x.url) }))).slice(0, 16);
      return json({
        ok: true, pareada: true, versao, servidor_agora: agora,
        tela: { id: tela.id, nome: tela.nome, layout: tela.layout, ambiente: tela.ambiente, config: tela.config || {} },
        local: { id: building.id, nome: building.nome, bairro: building.bairro, segmento: building.segmento_local, tipo: building.tipo_local },
        ritmo,
        comando: tela.comando ? { tipo: tela.comando, em: tela.comando_em } : null,
        ...conteudo,
      });
    }

    // ---------- diagnóstico da equipe (formato real das notícias/câmeras e prévia da programação) ----------
    if (acao === 'diag') {
      const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      const { data: u } = await admin.auth.getUser(jwt);
      if (!u?.user) return json({ ok: false, erro: 'entre como equipe' }, 401);
      const { data: papeis } = await admin.from('user_roles').select('role').eq('user_id', u.user.id);
      if (!(papeis || []).some((p: any) => ['super_admin', 'admin', 'diretora_operacoes', 'gestor_comercial'].includes(String(p.role)))) return json({ ok: false, erro: 'sem permissão' }, 403);
      const out: any = { ok: true };
      try { const n: any[] = await exaSistema('noticias?select=*&order=created_at.desc&limit=2'); out.noticias_colunas = Object.keys(n?.[0] || {}); out.noticias_exemplo = n; } catch (e) { out.noticias_erro = (e as Error).message; }
      try { out.cameras_bruto = await exaSistema('cameras?select=*'); } catch (e) { out.cameras_erro = (e as Error).message; }
      if (b.building_id) {
        const { data: building } = await admin.from('buildings').select('id, nome, bairro, tipo_local, segmento_local, pedido_casa_id, telas_ritmo').eq('id', b.building_id).maybeSingle();
        if (building) { memo.delete(`prog:${building.id}`); out.programacao = await programacaoDoLocal(admin, building); }
      }
      out.noticias = await noticias();
      out.cameras = await cameras();
      return json(out);
    }

    return json({ ok: false, erro: 'ação desconhecida' }, 400);
  } catch (e) {
    console.error('[exa-tela]', acao, e);
    return json({ ok: false, erro: (e as Error)?.message || String(e) }, 500);
  }
});
