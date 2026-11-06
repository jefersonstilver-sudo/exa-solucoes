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
// Câmeras IP AO VIVO da rede local (06/11/2026, teste Tapo C510W): o PC ao lado da câmera converte e serve o vídeo
// só na rede local (mediamtx, nada gravado); o app da TV (CameraLocal.kt, APK 1.0.13+) busca https://lan.exa.local/<ip>/<porta>/...
// na própria rede. Não entram na lista padrão nem no cameras_lista: só na tela que tiver o endereço em config.cameras.ids.
// predios = únicos prédios cujas telas podem receber a câmera (trava dupla além da escolha de câmeras)
const CAMERAS_LOCAIS: { url: string; nome: string; credito: string; predios: string[] }[] = [
  { url: 'https://lan.exa.local/192.168.1.28/8888/tapo/index.m3u8', nome: 'Câmera EXA · ao vivo', credito: 'EXA Mídia', predios: ['969f12ca-32da-4e3d-8afd-6d9a89b9d30b'] }, // LOCAL DE TESTE NOVO
];
const STATUS_TOCANDO = ['ativo', 'video_aprovado', 'video_enviado'];
const RITMO_PADRAO = { casa_a_cada: 3, editorial_a_cada: 2, camera: true, noticias: true, noticias_foz: true, noticias_brasil: true };

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
const relatos = new Map<string, number>(); // relato_app: no máximo 1 por aparelho por minuto
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

/**
 * Câmeras escolhidas para esta tela (config.cameras = { ids: [url…], segundos }): só as escolhidas, na ordem escolhida,
 * e o tempo de cada uma. Uma só = câmera fixa, sem trocar. Nada escolhido (ou nenhuma ainda existe) = todas.
 */
/**
 * 06/11/2026: o PRÉDIO manda na configuração das telas (buildings.telas_config: cameras, avisos, layout_v, layout_h)
 * e cada tela pode ter exceção (exa_telas.config.cameras / .avisos / .layout_proprio). Orientação e giro são sempre da tela.
 * Notícias e clima já vinham assim (buildings.telas_ritmo + config.ritmo da tela).
 */
function configEfetiva(tela: any, building: any) {
  const p = (building?.telas_config || {}) as any;
  const t = (tela?.config || {}) as any;
  const proprio: string[] = [];
  const cameras = t.cameras !== undefined ? (proprio.push('cameras'), t.cameras) : p.cameras;
  const avisos = t.avisos !== undefined ? (proprio.push('avisos'), t.avisos) : p.avisos;
  const vertical = t.orientacao === 'vertical' || /^(V\d|R)$/.test(String(tela?.layout || ''));
  const doPredio = vertical ? p.layout_v : p.layout_h;
  const layout = t.layout_proprio || !doPredio ? (t.layout_proprio && proprio.push('layout'), tela?.layout) : doPredio;
  if (t.ritmo && Object.keys(t.ritmo).length) proprio.push('ritmo');
  return { cameras, avisos: avisos !== false, layout, proprio };
}

function camerasDaTela(cams: any[], cfg: any, predioId = '') {
  const ids: string[] = Array.isArray(cfg?.ids) ? cfg.ids.map(String) : [];
  const locais = CAMERAS_LOCAIS.filter((c) => predioId && c.predios.includes(predioId)).map((c) => ({ url: c.url, nome: c.nome, credito: c.credito, segundos: 14 }));
  const todas = [...cams, ...locais];
  let out = ids.length ? ids.map((u) => todas.find((c) => c.url === u)).filter(Boolean) : cams;
  // 06/11/2026: segue a escolha fielmente — câmeras escolhidas que não estão disponíveis não viram "todas"
  // (a TV horizontal mostrava todas as da ponte quando só a câmera de teste estava escolhida)
  if (!ids.length && !out.length) out = cams;
  const seg = Number(cfg?.segundos);
  return seg ? out.map((c: any) => ({ ...c, segundos: Math.min(Math.max(seg, 5), 600) })) : out;
}

// imagem da notícia: a do ExaSistema é só o nome do arquivo (bucket privado), então pega o og:image da matéria
const ogImagem = new Map<string, { t: number; u: string }>();
async function imagemDaMateria(link: string) {
  if (!/^https?:\/\//i.test(link)) return '';
  const m = ogImagem.get(link);
  if (m && Date.now() - m.t < 6 * 3600000) return m.u;
  let u = '';
  try {
    const r = await fetch(link, { headers: { 'User-Agent': 'Mozilla/5.0 (EXA Tela)' }, signal: AbortSignal.timeout(6000) });
    const html = (await r.text()).slice(0, 200000);
    const g = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (g && /^https?:\/\//i.test(g[1])) u = g[1].replace(/&amp;/g, '&');
  } catch { /* sem imagem */ }
  ogImagem.set(link, { t: Date.now(), u });
  return u;
}
const ORIGEM: Record<string, string> = { portal_cidade: 'Portal da Cidade Foz', jovempan: 'Jovem Pan', cnn: 'CNN Brasil', g1: 'g1', agencia_brasil: 'Agência Brasil' };

/** Notícias do Brasil: Agência Brasil (EBC), que permite reproduzir citando a fonte. Usada quando o ExaSistema não traz nacionais. */
async function noticiasAgenciaBrasil(): Promise<any[]> {
  return lembrar('agencia-brasil', 15 * 60000, async () => {
    try {
      const r = await fetch('https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml', { signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'Mozilla/5.0 (EXA Midia)' } });
      if (!r.ok) return [];
      const xml = await r.text();
      const tira = (t: string) => t.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]+>/g, '').trim();
      const tag = (bloco: string, nome: string) => { const m = bloco.match(new RegExp(`<${nome}[^>]*>([\\s\\S]*?)</${nome}>`)); return m ? tira(m[1]) : ''; };
      const out: any[] = [];
      for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const titulo = tag(m[1], 'title');
        const link = tag(m[1], 'link');
        if (!titulo || !/^https?:\/\//.test(link) || /^hoje é dia/i.test(titulo)) continue;
        const imagem = tag(m[1], 'imagem-destaque');
        out.push({ titulo, link, imagem: /^https?:\/\//.test(imagem) ? imagem : '', categoria: 'Brasil', _fonte: 'agencia_brasil', origem: 'Agência Brasil' });
        if (out.length >= 15) break;
      }
      return out;
    } catch (e) {
      console.warn('[exa-tela] Agência Brasil indisponível', (e as Error).message);
      return [];
    }
  });
}

async function noticias() {
  return lembrar('noticias', 10 * 60000, async () => {
    try {
      // ExaSistema: uma linha por tipo, com valor = { portal_cidade: [{titulo, link, imagem, categoria}], jovempan: [...] }
      const rows: any[] = await exaSistema('noticias?select=*&order=atualizado_em.desc&limit=10');
      const brutas: any[] = [];
      for (const r of rows || []) {
        const v = r.valor && typeof r.valor === 'object' ? r.valor : null;
        if (v && !Array.isArray(v)) {
          for (const [fonte, lista] of Object.entries(v)) if (Array.isArray(lista)) lista.forEach((n: any) => brutas.push({ ...n, _fonte: fonte, _em: r.atualizado_em }));
        } else if (Array.isArray(v)) v.forEach((n: any) => brutas.push({ ...n, _fonte: r.tipo, _em: r.atualizado_em }));
        else if (r.titulo) brutas.push({ ...r, _em: r.atualizado_em || r.created_at });
      }
      // poucas nacionais no ExaSistema (a lista da Jovem Pan às vezes vem vazia): completa com a Agência Brasil
      const nacionais = brutas.filter((n) => !/portal|cidade|foz/i.test(String(n._fonte || ''))).length;
      if (nacionais < 5) brutas.push(...(await noticiasAgenciaBrasil()));
      const out: any[] = [];
      const vistos = new Set<string>();
      const porEscopo: Record<string, number> = { foz: 0, brasil: 0 };
      for (const n of brutas) {
        const titulo = limpa(n.titulo || n.title || n.manchete, 220).trim();
        if (!titulo || vistos.has(titulo.toLowerCase())) continue;
        vistos.add(titulo.toLowerCase());
        const cat = limpa(n.categoria || n.category || '', 40);
        if (/culin|receita|gastronom/i.test(cat)) continue; // regra fixa: nada culinário nas notícias
        const link = /^https?:\/\//i.test(String(n.link || n.url || '')) ? String(n.link || n.url) : '';
        // Foz = portal da cidade; Brasil = Jovem Pan e outras nacionais (até 15 de cada, para uma não esconder a outra)
        const fonte = String(n._fonte || n.origem || n.fonte || '').toLowerCase();
        const escopo = /portal|cidade|foz/.test(fonte) || !fonte ? 'foz' : 'brasil';
        if (porEscopo[escopo] >= 15) continue;
        porEscopo[escopo]++;
        out.push({
          escopo,
          titulo,
          resumo: limpa(n.resumo || n.descricao || n.subtitulo || '', 260),
          categoria: cat,
          origem: ORIGEM[String(n._fonte || '')] || limpa(n.origem || n.fonte || n._fonte || '', 60),
          imagem: /^https?:\/\//i.test(String(n.imagem || '')) ? String(n.imagem) : '',
          link,
          data: n.data || n.publicado_em || null, // atualizado_em é da lista, não da matéria
        });
        if (out.length >= 30) break;
      }
      await Promise.all(out.map(async (n) => { if (!n.imagem && n.link) n.imagem = await imagemDaMateria(n.link); }));
      return out;
    } catch (e) {
      console.warn('[exa-tela] notícias indisponíveis', (e as Error).message);
      return [];
    }
  });
}

/** Nome que aparece no "A seguir": o do pedido (vários clientes ainda estão na conta interna), em Título se vier todo maiúsculo. */
function nomeDoPedido(n?: string | null) {
  const t = String(n || '').trim();
  if (!t || /^pedido\b/i.test(t)) return '';
  if (t === t.toUpperCase()) return t.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_m, a, b) => a + b.toUpperCase()).replace(/\b(De|Da|Do|Dos|Das|E)\b/g, (x) => x.toLowerCase());
  return t;
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
          cliente: (p.id === casaId ? building.nome : '') || nomeDoPedido(p.nome_pedido) || nomeCli.get(p.client_id) || '',
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

// ---------------------------------------------------------------- portal do restaurante e alertas
const LAYOUTS_OK = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'L1', 'L2', 'L3', 'L4', 'V1', 'V2', 'V3', 'V4', 'R']);

/** Orientação da TV (fica em exa_telas.config): horizontal, ou vertical com o giro da imagem (TV box só manda imagem deitada). */
function orientacaoDoCorpo(b: any, cfg: Record<string, any>) {
  const out = { ...cfg };
  if (b.orientacao === 'horizontal' || b.orientacao === 'vertical') out.orientacao = b.orientacao;
  if (b.giro !== undefined && [0, 90, 270].includes(Number(b.giro))) out.giro = Number(b.giro);
  return out;
}

// ---------- réplica do elevador (TV vertical num prédio): o MESMO updates.json que o NUC do prédio lê no ExaSistema ----------
const DIAS_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
/** A mesma escolha do NUC ao montar a PlaylistPronta: 1 vídeo por pedido, dentro das datas; o agendado para agora substitui o master. */
function playlistAgora(lista: any[]): any[] {
  const agora = new Date(Date.now() - 3 * 3600000);
  const hhmm = agora.toISOString().slice(11, 16), dia = DIAS_SEMANA[agora.getUTCDay()];
  const local = (t: unknown) => { const v = String(t || '').replace(' ', 'T'); const d = new Date(v.replace(/(Z|[+-]\d{2}:?\d{2})$/, '') + 'Z'); return isNaN(+d) ? null : d; };
  const valido = (it: any) => {
    if (!it?.video || it.status === 'deleted') return false;
    const ini = local(it.data_ini), fim = local(it.data_fim);
    return !(ini && agora < ini) && !(fim && agora > fim);
  };
  const temProg = (it: any) => Object.values(it.programacao || {}).some((x: any) => Array.isArray(x) && x.length);
  const naHora = (it: any) => ((it.programacao || {})[dia] || []).some((f: any) => String(f.inicio || '00:00') <= hhmm && hhmm <= String(f.fim || '23:59'));
  const porPedido = new Map<string, any[]>();
  for (const it of lista.filter(valido)) { const k = String(it.id_pedido || it.video); porPedido.set(k, [...(porPedido.get(k) || []), it]); }
  const out: any[] = [];
  for (const itens of porPedido.values()) {
    const e = itens.find((it) => temProg(it) && naHora(it)) || itens.find((it) => it.master === true || it.master === 'true') || itens.find((it) => !temProg(it));
    if (e) out.push(e);
  }
  return out;
}
const clienteIdDoPredio = (buildingId: string) => buildingId.replace(/-/g, '').substring(0, 4);
async function updatesDoPredio(buildingId: string) {
  return lembrar(`upd:${buildingId}`, 15000, async () => {
    const rows: any[] = await exaSistema(`updates_clientes?cliente_id=eq.${encodeURIComponent(clienteIdDoPredio(buildingId))}&select=json_data`);
    return rows?.[0]?.json_data || null;
  });
}
const CAMPOS_CLIENTE = 'id, nome, layout, config, status, ultimo_sinal, offline_desde, tocando, erros, plataforma, info, versao_player, saude, building_id, pareada_em, comando';
const FUSO = 'America/Sao_Paulo';
const hm = (iso?: string | null) => (iso ? new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : '—');
const minDesde = (iso?: string | null) => (iso ? Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)) : 0);

async function usuario(req: Request, admin: any) {
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return null;
  const { data } = await admin.auth.getUser(jwt);
  return data?.user || null;
}

/** Locais comércio cujo pedido "da casa" é deste cliente, com o limite de telas do pedido. */
async function locaisDoCliente(admin: any, uid: string) {
  const { data: peds } = await admin.from('pedidos').select('id, telas_comercio, nome_pedido').eq('client_id', uid);
  const porId = new Map((peds || []).map((p: any) => [p.id, p]));
  if (!porId.size) return [];
  const { data: bs } = await admin.from('buildings').select('id, nome, bairro, segmento_local, pedido_casa_id').in('pedido_casa_id', [...porId.keys()]);
  return (bs || []).map((x: any) => ({ id: x.id, nome: x.nome, bairro: x.bairro, segmento: x.segmento_local, pedido_id: x.pedido_casa_id, limite: Number((porId.get(x.pedido_casa_id) as any)?.telas_comercio) || 0 }));
}

async function telaDoCliente(admin: any, uid: string, telaId: string) {
  const locais = await locaisDoCliente(admin, uid);
  const { data: t } = await admin.from('exa_telas').select('*').eq('id', telaId).maybeSingle();
  if (!t || !locais.some((l: any) => l.id === t.building_id)) return null;
  return t;
}

const soDigitos = (t?: string | null) => {
  let d = String(t || '').replace(/\D/g, '');
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return d.length >= 12 ? d : '';
};
async function whatsapp(phone: string, message: string) {
  if (!phone) return { ok: false, erro: 'sem telefone' };
  try {
    const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/zapi-send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ agentKey: 'sofia', phone, message }),
      signal: AbortSignal.timeout(20000),
    });
    return { ok: r.ok, status: r.status };
  } catch (e) { return { ok: false, erro: (e as Error).message }; }
}
const descreverAparelho = (t: any) => {
  const p = String(t.plataforma || '');
  const nome = p.startsWith('android') ? 'Android' : p.startsWith('windows') ? 'Windows' : p.startsWith('linux') ? 'Linux' : 'Navegador';
  const tela = t.info?.tela ? ` · ${String(t.info.tela).split('@')[0]}` : '';
  const rede = t.saude?.conexao ? ` · rede ${t.saude.conexao}${t.saude.rtt ? ` (${t.saude.rtt} ms)` : ''}` : '';
  return `${nome}${tela}${rede}`;
};
/** Horário de alerta da tela (padrão 08:00–22:00). Só avisa se a queda aconteceu dentro do horário e for das últimas 3 h:
 * TV desligada à noite no fechamento não vira alerta na manhã seguinte. */
const dentroDoHorario = (cfg: any, quando: Date = new Date()) => {
  const a = cfg?.alertas || {};
  if (a.ativo === false) return false;
  const ini = String(a.inicio || '08:00'), fim = String(a.fim || '22:00');
  const h = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit', hour12: false }).format(quando);
  return ini <= fim ? h >= ini && h < fim : h >= ini || h < fim;
};
const deveAvisar = (t: any) => dentroDoHorario(t.config) && !!t.ultimo_sinal && dentroDoHorario(t.config, new Date(t.ultimo_sinal)) && minDesde(t.ultimo_sinal) < 180;

/** A cada 5 min: tela ativa sem sinal há 10 min → avisa restaurante e EXA; quando volta → avisa que voltou. */
async function vigiar(admin: any) {
  const { data: telas } = await admin.from('exa_telas').select('*').eq('status', 'ativa').not('building_id', 'is', null);
  const lista = telas || [];
  if (!lista.length) return { telas: 0 };
  const bIds = [...new Set(lista.map((t: any) => t.building_id))];
  const { data: bs } = await admin.from('buildings').select('id, nome, pedido_casa_id').in('id', bIds);
  const bPor = new Map((bs || []).map((x: any) => [x.id, x]));
  const pIds = [...new Set((bs || []).map((x: any) => x.pedido_casa_id).filter(Boolean))];
  const { data: ps } = pIds.length ? await admin.from('pedidos').select('id, client_id').in('id', pIds) : { data: [] };
  const cIds = [...new Set((ps || []).map((p: any) => p.client_id).filter(Boolean))];
  const { data: us } = cIds.length ? await admin.from('users').select('id, telefone, nome, empresa_nome').in('id', cIds) : { data: [] };
  const donoPorPedido = new Map((ps || []).map((p: any) => [p.id, (us || []).find((u: any) => u.id === p.client_id)]));
  const { data: dirs } = await admin.from('exa_alerts_directors').select('telefone, departamento').eq('ativo', true);
  const exa = [...new Set<string>((dirs || []).filter((d: any) => /ceo|opera/i.test(String(d.departamento || ''))).map((d: any) => soDigitos(d.telefone)).filter(Boolean))];
  const out: any[] = [];
  for (const t of lista) {
    const b: any = bPor.get(t.building_id) || {};
    const dono: any = b.pedido_casa_id ? donoPorPedido.get(b.pedido_casa_id) : null;
    const foneDono = soDigitos(dono?.telefone);
    const nome = t.nome || 'Tela';
    const offline = minDesde(t.ultimo_sinal) >= 10;
    if (offline && !t.alerta_offline_em) {
      if (!t.offline_desde) await admin.from('exa_telas').update({ offline_desde: t.ultimo_sinal }).eq('id', t.id);
      if (!deveAvisar(t)) { out.push({ tela: nome, offline: true, fora_do_horario: true }); continue; }
      const avisos = (t.erros || []).slice(-2).map((e: string) => `• ${e}`).join('\n');
      const corpo = `Sem sinal desde ${hm(t.ultimo_sinal)} (${minDesde(t.ultimo_sinal)} min).\nÚltimo que tocou: ${t.tocando?.cliente || t.tocando?.titulo || '—'}\nAparelho: ${descreverAparelho(t)}${avisos ? `\nÚltimos avisos:\n${avisos}` : ''}`;
      const envios = [];
      if (foneDono) envios.push(await whatsapp(foneDono, `⚠️ *Sua tela EXA está sem sinal*\n${nome} · ${b.nome || ''}\n${corpo}\n\nConfira se a TV está ligada, no app EXA Tela e com internet. Se desligaram a TV de propósito, pode ignorar.`));
      for (const f of exa) envios.push(await whatsapp(f, `⚠️ *Tela de comércio sem sinal*\n${nome} · ${b.nome || ''}${dono ? ` (${dono.empresa_nome || dono.nome || ''})` : ''}\n${corpo}${foneDono ? '' : '\n(o restaurante não tem telefone cadastrado — não foi avisado)'}`));
      await admin.from('exa_telas').update({ alerta_offline_em: new Date().toISOString(), offline_desde: t.offline_desde || t.ultimo_sinal }).eq('id', t.id);
      await admin.from('exa_telas_eventos').insert({ tela_id: t.id, tipo: 'offline', dados: { desde: t.ultimo_sinal, envios } });
      out.push({ tela: nome, offline: true, avisou: envios.length });
    } else if (!offline && (t.alerta_offline_em || t.offline_desde)) {
      const ficou = minDesde(t.offline_desde || t.alerta_offline_em);
      if (t.alerta_offline_em) {
        const msg = `✅ *Tela voltou* — ${nome} · ${b.nome || ''}\nFicou ${ficou} min sem sinal (desde ${hm(t.offline_desde)}).`;
        if (foneDono) await whatsapp(foneDono, msg);
        for (const f of exa) await whatsapp(f, msg);
        await admin.from('exa_telas_eventos').insert({ tela_id: t.id, tipo: 'online', dados: { ficou_min: ficou } });
      }
      await admin.from('exa_telas').update({ alerta_offline_em: null, offline_desde: null }).eq('id', t.id);
      out.push({ tela: nome, voltou: true, ficou_min: ficou });
    }
  }
  return { telas: lista.length, mudancas: out };
}

/** Comando pendente da tela. "gravar:30" vira um envio assinado para o bucket privado telas-gravacoes. */
async function comandoDaTela(admin: any, tela: any) {
  const tipo = String(tela.comando || '');
  if (!tipo.startsWith('gravar')) return { tipo, em: tela.comando_em };
  const seg = Math.max(5, Math.min(60, Number(tipo.split(':')[1]) || 30));
  const caminho = `${tela.id}/${String(tela.comando_em || Date.now()).replace(/[^0-9A-Za-z]/g, '').slice(0, 20)}.mp4`;
  const { data, error } = await admin.storage.from('telas-gravacoes').createSignedUploadUrl(caminho, { upsert: true });
  if (error || !data?.signedUrl) { console.error('[exa-tela] gravação', error); return { tipo: 'gravar', em: tela.comando_em, seg, caminho }; }
  return { tipo: 'gravar', em: tela.comando_em, seg, caminho, url: data.signedUrl };
}

async function ehEquipe(admin: any, req: Request): Promise<boolean> {
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: u } = await admin.auth.getUser(jwt);
  if (!u?.user) return false;
  const { data: papeis } = await admin.from('user_roles').select('role').eq('user_id', u.user.id);
  return (papeis || []).some((p: any) => ['super_admin', 'admin', 'diretora_operacoes', 'gestor_comercial'].includes(String(p.role)));
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

    // ---------- o app Android não conseguiu abrir o player: relato do aparelho (data errada, navegador antigo...) ----------
    if (acao === 'relato_app') {
      const chave = `relato:${ip || 'sem-ip'}:${limpa(b.id_aparelho, 40)}`;
      const ultimo = relatos.get(chave) || 0;
      if (Date.now() - ultimo < 60000) return json({ ok: true, ignorado: true });
      relatos.set(chave, Date.now());
      if (relatos.size > 500) relatos.clear();
      const dados = {
        ip,
        id_aparelho: limpa(b.id_aparelho, 40),
        tipo: limpa(b.tipo, 20),
        problema: limpa(b.problema, 600),
        erros_js: Array.isArray(b.erros_js) ? b.erros_js.slice(-6).map((e: unknown) => limpa(e, 300)) : [],
        info: {} as Record<string, unknown>,
      };
      const infoTxt = JSON.stringify(typeof b.info === 'object' && b.info ? b.info : {});
      dados.info = infoTxt.length <= 4000 ? JSON.parse(infoTxt) : { resumo: infoTxt.slice(0, 4000) };
      // se o aparelho já foi pareado antes (mesmo id), liga o relato à tela
      let tela_id: string | null = null;
      if (dados.id_aparelho) {
        const { data: t } = await admin.from('exa_telas').select('id').eq('info->>id_aparelho', dados.id_aparelho).order('ultimo_sinal', { ascending: false }).limit(1).maybeSingle();
        tela_id = t?.id || null;
      }
      await admin.from('exa_telas_eventos').insert({ tela_id, tipo: 'relato_app', dados });
      return json({ ok: true });
    }

    // ---------- câmeras disponíveis (para escolher no admin e na área do cliente; são transmissões públicas) ----------
    if (acao === 'cameras_lista') {
      const cs: any[] = await cameras();
      // câmera IP local (ao vivo, só na rede da TV): só entra na lista da tela autorizada
      // pelo prédio (building_id) ou pela tela (tela_id -> prédio dela)
      let pid = String(b.building_id || '');
      if (!pid && b.tela_id) { const { data: tt } = await admin.from('exa_telas').select('building_id').eq('id', String(b.tela_id)).maybeSingle(); pid = tt?.building_id || ''; }
      const locais = CAMERAS_LOCAIS.filter((c) => pid && c.predios.includes(pid)).map((c) => ({ url: c.url, nome: c.nome, credito: c.credito, local: true }));
      return json({ ok: true, cameras: [...locais, ...cs.map((c) => ({ url: c.url, nome: c.nome, credito: c.credito }))] });
    }

    // ---------- quantas notícias de Foz e do Brasil chegam do ExaSistema (dados públicos, para conferência) ----------
    if (acao === 'noticias_resumo') {
      const ns: any[] = await noticias();
      const conta = (e: string) => ns.filter((n) => (n.escopo === 'brasil') === (e === 'brasil'));
      return json({ ok: true, foz: conta('foz').length, brasil: conta('brasil').length, origens: [...new Set(ns.map((n) => n.origem))], exemplos: ns.slice(0, 6).map((n) => `${n.escopo} · ${n.titulo}`) });
    }

    // ---------- réplica do elevador para a TV do prédio (o painel-web/sw.js chama com o token da tela) ----------
    if (acao === 'replica') {
      const token = String(b.token || '');
      if (token.length < 32) return json({ ok: false, erro: 'sem token' }, 401);
      const { data: tela } = await admin.from('exa_telas').select('id, building_id, status, config').eq('token_hash', await sha256(token)).maybeSingle();
      if (!tela || tela.status !== 'ativa' || !tela.building_id) return json({ ok: false, erro: 'tela não conectada' }, 403);
      const arq = String(b.arq || 'updates');
      if (arq === 'noticias') {
        const ns = await noticias();
        return json({ ok: true, linhas: ns.map((n: any) => ({ titulo: n.titulo, link: n.link, categoria: n.categoria, origem: n.origem })) });
      }
      if (arq === 'cameras') {
        // 03/11/2026: a réplica (TV vertical em prédio) passa a respeitar as câmeras escolhidas para a TV
        // (antes tocava a lista padrão da tela dos NUCs, com Argentina e Ponte da Integração, mesmo com uma câmera fixa)
        const { data: bCfg } = await admin.from('buildings').select('id, telas_config').eq('id', tela.building_id).maybeSingle();
        const cfgC = configEfetiva(tela, bCfg).cameras;
        const escolhidas = Array.isArray(cfgC?.ids) && cfgC.ids.length > 0;
        const cs = camerasDaTela(await cameras(), cfgC, tela.building_id);
        return json({ ok: true, escolhidas, lives: cs.map((c: any) => ({ url: c.url, nome: c.nome, timing: c.segundos })) });
      }
      if (arq === 'clima') {
        const r = await fetch('http://18.228.252.149:8000/api/clima', { signal: AbortSignal.timeout(12000) });
        return new Response(await r.text(), { status: r.status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'max-age=300' } });
      }
      const { data: predio } = await admin.from('buildings').select('nome, telas_config').eq('id', tela.building_id).maybeSingle();
      const j = await updatesDoPredio(tela.building_id);
      if (!j) return json({ ok: false, erro: 'A tela desse prédio ainda não tem programação.' }, 404);
      if (arq === 'arquivo') {
        // imagens, PDFs e avisos do Nando do próprio prédio (o S3 não libera o navegador; vídeo vai direto)
        const caminho = String(b.caminho || '');
        if (!/^(CondominiumNotices|Propagandas|Banners|News|qrcodes)\/[^/]+$/.test(caminho) || caminho.includes('..')) return json({ ok: false }, 400);
        const pasta = String(j.pasta_s3 || '').replace(/^\/+|\/+$/g, '');
        const r = await fetch(`https://telas-clientes.s3.sa-east-1.amazonaws.com/${pasta}/${caminho.split('/').map(encodeURIComponent).join('/')}`, { signal: AbortSignal.timeout(20000) });
        const ext = (caminho.split('.').pop() || '').toLowerCase();
        const tipo = ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', pdf: 'application/pdf', json: 'application/json', svg: 'image/svg+xml' } as Record<string, string>)[ext] || 'application/octet-stream';
        return new Response(r.body, { status: r.status, headers: { ...cors, 'Content-Type': tipo, 'Cache-Control': 'max-age=3600' } });
      }
      const upd = { ...j };
      if (!Array.isArray(upd.PlaylistPronta) || !upd.PlaylistPronta.length) upd.PlaylistPronta = playlistAgora(upd.Propagandas || []);
      // 06/11/2026: o título "Avisos do <prédio>" usa o nome do prédio no admin da EXA (o ScreenName do ExaSistema
      // ficava com o nome antigo, ex.: Rio Negro virou "Local de teste"); nomes em CAIXA ALTA viram "Local De Teste"
      if (predio?.nome) {
        const n = String(predio.nome).trim();
        upd.ScreenName = n === n.toUpperCase() ? n.toLowerCase().replace(/(^|\s)\S/g, (x) => x.toUpperCase()) : n;
      }
      // tela com config.avisos = false não mostra os avisos do prédio (não apaga nada: só esta TV deixa de exibir)
      if (!configEfetiva(tela, predio).avisos) upd.CondominiumNotices = [];
      return json({ ok: true, predio: predio?.nome || '', updates: upd, avisos: Array.isArray(upd.CondominiumNotices) ? upd.CondominiumNotices.length : 0 });
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
      if (b.saude && typeof b.saude === 'object') {
        patch.saude = { ...b.saude, em: agora };
        // histórico da saúde (fluidez, CPU, temperatura, memória) a cada ~5 min, para o gráfico do admin
        if (new Date().getUTCMinutes() % 5 === 0 && tela.status === 'ativa') {
          await admin.from('exa_telas_eventos').insert({ tela_id: tela.id, tipo: 'saude', dados: { fluidez: (b.saude as any).fluidez ?? null, aparelho: (b.saude as any).aparelho ?? null, memoria_mb: (b.saude as any).memoria_mb ?? null, mbps: (b.saude as any).mbps ?? null, tocando: (b.tocando as any)?.titulo ?? null } });
        }
      }
      if (b.comando_ok && tela.comando && String(b.comando_ok) === String(tela.comando_em)) { patch.comando = null; patch.comando_em = null; }
      // posição escolhida à mão na própria TV (APK 1.0.9+): vira a configuração (deitada = horizontal; em pé = vertical + giro)
      let posicaoOk = false;
      if (b.posicao && [0, 90, 270].includes(Number((b.posicao as any).giro))) {
        const g = Number((b.posicao as any).giro);
        const cfg: Record<string, any> = { ...((tela.config as any) || {}) };
        const vertLayout = /^(V\d|R)$/.test(String(tela.layout || ''));
        if (g === 0) { cfg.orientacao = 'horizontal'; if (vertLayout) patch.layout = 'H6'; }
        else { cfg.orientacao = 'vertical'; cfg.giro = g; if (!vertLayout) patch.layout = 'R'; }
        patch.config = cfg;
        tela.config = cfg;
        if (patch.layout) tela.layout = patch.layout;
        posicaoOk = true;
      }
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
        return json({ ok: true, pareada: false, codigo, tela_id: tela.id, posicao_ok: posicaoOk || undefined });
      }

      await admin.from('exa_telas').update(patch).eq('id', tela.id);
      const { data: building } = await admin.from('buildings')
        .select('id, nome, bairro, endereco, tipo_local, segmento_local, pedido_casa_id, telas_ritmo, telas_config')
        .eq('id', tela.building_id).maybeSingle();
      if (!building) return json({ ok: true, pareada: false, codigo: null, erro: 'local apagado' });
      const efetiva = configEfetiva(tela, building);
      tela.layout = efetiva.layout;
      tela.config = { ...((tela.config as any) || {}), cameras: efetiva.cameras, avisos: efetiva.avisos };

      const ritmo = { ...RITMO_PADRAO, ...(building.telas_ritmo || {}), ...((tela.config || {}).ritmo || {}) };
      const [prog, cams, nots] = await Promise.all([
        programacaoDoLocal(admin, building).catch((e) => { console.error('[exa-tela] programação', e); return { anuncios: [], casa: [] }; }),
        ritmo.camera === false ? Promise.resolve([]) : cameras().then((cs: any[]) => camerasDaTela(cs, efetiva.cameras, building.id)),
        ritmo.noticias === false ? Promise.resolve([]) : noticias().then((ns: any[]) => {
          // o local escolhe Foz, Brasil ou as duas (intercaladas)
          const foz = ritmo.noticias_foz === false ? [] : ns.filter((n) => n.escopo !== 'brasil');
          const br = ritmo.noticias_brasil === false ? [] : ns.filter((n) => n.escopo === 'brasil');
          const out: any[] = [];
          for (let i = 0; i < Math.max(foz.length, br.length); i++) { if (foz[i]) out.push(foz[i]); if (br[i]) out.push(br[i]); }
          return out;
        }),
      ]);
      // prédio: quantos avisos do síndico há na programação do NUC (a TV horizontal intercala os avisos)
      let avisos = 0;
      if (building.tipo_local !== 'comercio' && efetiva.avisos) {
        try { const j = await updatesDoPredio(building.id); avisos = Array.isArray(j?.CondominiumNotices) ? j.CondominiumNotices.length : 0; } catch { /* sem ExaSistema: sem avisos */ }
      }
      const conteudo = { anuncios: prog.anuncios, casa: prog.casa, cameras: cams, noticias: nots, avisos };
      const versao = (await sha256(JSON.stringify({ l: tela.layout, c: tela.config, r: ritmo, n: tela.nome, a: prog.anuncios.map((x: any) => x.url), k: prog.casa.map((x: any) => x.url), av: avisos }))).slice(0, 16);
      return json({
        ok: true, pareada: true, versao, servidor_agora: agora, posicao_ok: posicaoOk || undefined,
        tela: { id: tela.id, nome: tela.nome, layout: tela.layout, ambiente: tela.ambiente, config: tela.config || {} },
        local: { id: building.id, nome: building.nome, bairro: building.bairro, segmento: building.segmento_local, tipo: building.tipo_local === 'comercio' ? 'comercio' : 'predio' },
        ritmo,
        comando: tela.comando ? await comandoDaTela(admin, tela) : null,
        ...conteudo,
      });
    }

    // ---------- equipe: gravações da tela e histórico da saúde ----------
    if (acao === 'gravacoes') {
      if (!(await ehEquipe(admin, req))) return json({ ok: false, erro: 'sem permissão' }, 403);
      const id = String(b.tela_id || '');
      const { data: evs } = await admin.from('exa_telas_eventos').select('criado_em, tipo, dados').eq('tela_id', id)
        .in('tipo', ['gravacao', 'gravacao_inicio']).order('criado_em', { ascending: false }).limit(20);
      const lista: any[] = [];
      for (const e of evs || []) {
        const d: any = e.dados || {};
        let url: string | null = null;
        if (e.tipo === 'gravacao' && d.ok && d.caminho) {
          const { data } = await admin.storage.from('telas-gravacoes').createSignedUrl(String(d.caminho), 3600);
          url = data?.signedUrl || null;
        }
        lista.push({ em: e.criado_em, tipo: e.tipo, ...d, url });
      }
      const { data: hist } = await admin.from('exa_telas_eventos').select('criado_em, dados').eq('tela_id', id).eq('tipo', 'saude')
        .gte('criado_em', new Date(Date.now() - 24 * 3600000).toISOString()).order('criado_em', { ascending: true }).limit(400);
      return json({ ok: true, gravacoes: lista, saude: hist || [] });
    }

    // ---------- diagnóstico da equipe (formato real das notícias/câmeras e prévia da programação) ----------
    if (acao === 'diag') {
      const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      const { data: u } = await admin.auth.getUser(jwt);
      if (!u?.user) return json({ ok: false, erro: 'entre como equipe' }, 401);
      const { data: papeis } = await admin.from('user_roles').select('role').eq('user_id', u.user.id);
      if (!(papeis || []).some((p: any) => ['super_admin', 'admin', 'diretora_operacoes', 'gestor_comercial'].includes(String(p.role)))) return json({ ok: false, erro: 'sem permissão' }, 403);
      const out: any = { ok: true };
      try { const n: any[] = await exaSistema('noticias?select=*&order=atualizado_em.desc&limit=2'); out.noticias_colunas = Object.keys(n?.[0] || {}); out.noticias_exemplo = n; } catch (e) { out.noticias_erro = (e as Error).message; }
      try { out.cameras_bruto = await exaSistema('cameras?select=*'); } catch (e) { out.cameras_erro = (e as Error).message; }
      if (b.building_id) {
        const { data: building } = await admin.from('buildings').select('id, nome, bairro, tipo_local, segmento_local, pedido_casa_id, telas_ritmo').eq('id', b.building_id).maybeSingle();
        if (building) { memo.delete(`prog:${building.id}`); out.programacao = await programacaoDoLocal(admin, building); }
      }
      out.noticias = await noticias();
      out.cameras = await cameras();
      return json(out);
    }

    // ---------- versões leves para TV box: lista dos vídeos que as TVs dos prédios tocam (workflow tv-versoes, service role) ----------
    if (acao === 'tv_lista') {
      const chave = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      if (!chave || (req.headers.get('authorization') || '') !== `Bearer ${chave}`) return json({ ok: false, erro: 'sem permissão' }, 403);
      const { data: ts } = await admin.from('exa_telas').select('building_id').eq('status', 'ativa').not('building_id', 'is', null);
      const predios = [...new Set((ts || []).map((t: any) => t.building_id))];
      const itens: { pasta: string; video: string }[] = [];
      const visto = new Set<string>();
      for (const id of predios) {
        try {
          const j = await updatesDoPredio(id as string);
          if (!j) continue;
          const pasta = String(j.pasta_s3 || '').replace(/^\/+|\/+$/g, '');
          for (const it of [...(j.Propagandas || []), ...(j.PlaylistPronta || [])]) {
            const v = String(it?.video || '');
            if (!v || !/\.(mp4|mov|m4v|webm)$/i.test(v) || v.includes('..')) continue;
            const k = `${pasta}/${v}`;
            if (visto.has(k)) continue;
            visto.add(k); itens.push({ pasta, video: v });
          }
        } catch { /* prédio sem programação */ }
      }
      return json({ ok: true, itens });
    }

    // ---------- vigia (cron a cada 5 min, token interno) ----------
    if (acao === 'vigia') {
      const { data: cfg } = await admin.from('exa2_config').select('valor').eq('chave', 'cron_token').maybeSingle();
      if (!cfg?.valor || req.headers.get('x-exa2-cron') !== cfg.valor) return json({ ok: false, erro: 'sem permissão' }, 403);
      return json({ ok: true, ...(await vigiar(admin)) });
    }

    // ---------- portal do restaurante (área do cliente) ----------
    if (acao.startsWith('cliente_')) {
      const u = await usuario(req, admin);
      if (!u) return json({ ok: false, erro: 'Entre na sua conta.' }, 401);

      if (acao === 'cliente_listar') {
        const locais = await locaisDoCliente(admin, u.id);
        if (!locais.length) return json({ ok: true, locais: [], telas: [] });
        const { data: telas } = await admin.from('exa_telas').select(CAMPOS_CLIENTE).in('building_id', locais.map((l: any) => l.id)).order('pareada_em', { ascending: true });
        const ids = (telas || []).map((t: any) => t.id);
        const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO }).format(new Date());
        const { data: ex } = ids.length ? await admin.from('exa_telas_exibicoes').select('tela_id, tipo, vezes').in('tela_id', ids).eq('dia', hoje) : { data: [] };
        const { data: ev } = ids.length ? await admin.from('exa_telas_eventos').select('tela_id, tipo').in('tela_id', ids).eq('tipo', 'offline').gte('criado_em', new Date(Date.now() - 7 * 864e5).toISOString()) : { data: [] };
        const exib = new Map<string, number>(); (ex || []).forEach((r: any) => { if (r.tipo === 'anuncio' || r.tipo === 'casa') exib.set(r.tela_id, (exib.get(r.tela_id) || 0) + r.vezes); });
        const quedas = new Map<string, number>(); (ev || []).forEach((r: any) => quedas.set(r.tela_id, (quedas.get(r.tela_id) || 0) + 1));
        return json({
          ok: true, locais,
          telas: (telas || []).map((t: any) => ({ ...t, info: { tela: t.info?.tela || null }, exibicoes_hoje: exib.get(t.id) || 0, quedas_7d: quedas.get(t.id) || 0 })),
        });
      }

      if (acao === 'cliente_parear') {
        const locais = await locaisDoCliente(admin, u.id);
        const local = locais.find((l: any) => l.id === String(b.building_id || '')) || (locais.length === 1 ? locais[0] : null);
        if (!local) return json({ ok: false, erro: 'Escolha o local da tela.' }, 400);
        const { count } = await admin.from('exa_telas').select('id', { count: 'exact', head: true }).eq('building_id', local.id).eq('status', 'ativa');
        if ((count || 0) >= local.limite) return json({ ok: false, erro: local.limite ? `Seu plano permite ${local.limite} ${local.limite === 1 ? 'tela' : 'telas'}. Para conectar mais, fale com a Sofia.` : 'Seu plano ainda não inclui telas próprias. Fale com a Sofia.' }, 403);
        const codigo = String(b.codigo || '').replace(/\D/g, '');
        if (codigo.length !== 6) return json({ ok: false, erro: 'O código tem 6 números.' }, 400);
        const { data: t } = await admin.from('exa_telas').select('id, plataforma, info').eq('codigo', codigo).eq('status', 'aguardando').maybeSingle();
        if (!t) return json({ ok: false, erro: 'Não achei esse código. Confira o número na TV.' }, 404);
        const layout = LAYOUTS_OK.has(String(b.layout)) ? String(b.layout) : 'H6';
        const { data: atual } = await admin.from('exa_telas').select('config').eq('id', t.id).maybeSingle();
        const { error } = await admin.from('exa_telas').update({
          config: orientacaoDoCorpo(b, atual?.config || {}),
          nome: limpa(b.nome, 60) || `${local.nome} · TV ${(count || 0) + 1}`, building_id: local.id, ambiente: 'comercio', layout,
          status: 'ativa', codigo: null, codigo_expira: null, pareada_em: new Date().toISOString(), pareada_por: u.id, conectada_por: 'cliente',
        }).eq('id', t.id).eq('status', 'aguardando');
        if (error) throw error;
        await admin.from('exa_telas_eventos').insert({ tela_id: t.id, tipo: 'conectada', dados: { por: 'cliente', usuario: u.id } });
        return json({ ok: true, tela_id: t.id });
      }

      const t = await telaDoCliente(admin, u.id, String(b.tela_id || ''));
      if (!t) return json({ ok: false, erro: 'Tela não encontrada na sua conta.' }, 404);

      if (acao === 'cliente_atualizar') {
        const patch: Record<string, unknown> = {};
        if (typeof b.nome === 'string') patch.nome = limpa(b.nome, 60) || null;
        if (b.layout !== undefined) { if (!LAYOUTS_OK.has(String(b.layout))) return json({ ok: false, erro: 'layout inválido' }, 400); patch.layout = String(b.layout); }
        const cfg = { ...(t.config || {}) };
        if (typeof b.camera === 'boolean' || typeof b.noticias === 'boolean' || typeof b.noticias_foz === 'boolean' || typeof b.noticias_brasil === 'boolean') {
          cfg.ritmo = { ...(cfg.ritmo || {}) };
          if (typeof b.camera === 'boolean') cfg.ritmo.camera = b.camera;
          if (typeof b.noticias === 'boolean') cfg.ritmo.noticias = b.noticias;
          if (typeof b.noticias_foz === 'boolean') cfg.ritmo.noticias_foz = b.noticias_foz;
          if (typeof b.noticias_brasil === 'boolean') cfg.ritmo.noticias_brasil = b.noticias_brasil;
          // as duas desligadas = sem notícias; alguma ligada = notícias ligadas
          if (typeof b.noticias_foz === 'boolean' || typeof b.noticias_brasil === 'boolean') cfg.ritmo.noticias = cfg.ritmo.noticias_foz !== false || cfg.ritmo.noticias_brasil !== false;
          patch.config = cfg;
        }
        if (b.cameras && typeof b.cameras === 'object') {
          const validas = new Set((await cameras()).map((c: any) => c.url));
          const ids = (Array.isArray(b.cameras.ids) ? b.cameras.ids : []).map(String).filter((u: string) => validas.has(u)).slice(0, 20);
          const seg = Number(b.cameras.segundos);
          cfg.cameras = { ids, segundos: seg ? Math.min(Math.max(Math.round(seg), 5), 600) : null };
          patch.config = cfg;
        }
        if (b.orientacao !== undefined || b.giro !== undefined) {
          Object.assign(cfg, orientacaoDoCorpo(b, cfg));
          patch.config = cfg;
        }
        if (b.alertas && typeof b.alertas === 'object') {
          cfg.alertas = { ativo: b.alertas.ativo !== false, inicio: /^\d\d:\d\d$/.test(b.alertas.inicio) ? b.alertas.inicio : '08:00', fim: /^\d\d:\d\d$/.test(b.alertas.fim) ? b.alertas.fim : '22:00' };
          patch.config = cfg;
        }
        if (!Object.keys(patch).length) return json({ ok: true });
        const { error } = await admin.from('exa_telas').update(patch).eq('id', t.id);
        if (error) throw error;
        return json({ ok: true });
      }
      if (acao === 'cliente_comando') {
        const c = String(b.comando || '');
        if (!['recarregar', 'limpar_cache', 'reiniciar_app'].includes(c)) return json({ ok: false, erro: 'comando inválido' }, 400);
        await admin.from('exa_telas').update({ comando: c, comando_em: new Date().toISOString() }).eq('id', t.id);
        return json({ ok: true });
      }
      if (acao === 'cliente_desconectar') {
        await admin.from('exa_telas').update({ status: 'aguardando', building_id: null, codigo: null, codigo_expira: null, alerta_offline_em: null, offline_desde: null }).eq('id', t.id);
        await admin.from('exa_telas_eventos').insert({ tela_id: t.id, tipo: 'desconectada', dados: { por: 'cliente', usuario: u.id } });
        return json({ ok: true });
      }
    }

    return json({ ok: false, erro: 'ação desconhecida' }, 400);
  } catch (e) {
    console.error('[exa-tela]', acao, e);
    return json({ ok: false, erro: (e as Error)?.message || String(e) }, 500);
  }
});
