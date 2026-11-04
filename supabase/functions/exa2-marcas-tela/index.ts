/**
 * EXA 2.0 — Marcas no ar num painel (faixa "Nesta tela" do rodapé do elevador, ui v34).
 *
 * Público, só leitura. Entrada: { tela: "<tela_id de 4 caracteres>", pedidos?: [id_pedido da playlist do NUC] }.
 * Devolve só os NOMES das marcas (o que já aparece na própria tela): pedidos vigentes que incluem o prédio,
 * cruzados com os pedidos que o NUC realmente tem na playlist (quando ele manda). Nada de valor, contato ou contrato.
 * Nome = nome do pedido (vários clientes ainda estão na conta interna) ou, sem ele, o nome fantasia da conta.
 * Ficam de fora: editoriais (Notícias, Curiosidades), pedidos internos/teste/mestre e nomes sem nome fantasia (MEI com CNPJ).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const STATUS_TOCANDO = ['ativo', 'video_aprovado', 'video_enviado'];
const EDITORIAIS = new Set([
  'c08f3154-e0dc-4c39-b8a2-721d8acdde7f', // Notícias Brasil
  '9cb8da99-ddb3-491c-b58c-63871eadc4cb', // Notícias Foz do Iguaçu
  '7a4dc868-0ecd-4969-a1ec-5589d399b7c4', // Curiosidades
]);
const FORA = /^(exa|indexa|linka[eê]|teste|test|not[ií]cias|curiosidades|conta comercial|vendo as telas|vendas telas|sala reuni)|exemplo/i;
/** Nome de vitrine (como a marca é conhecida) por pedido. Pedido novo sem entrada aqui usa o nome do pedido limpo. */
const VITRINE: [string, string][] = [
  ['3f4e727b', 'Del Fuego'], ['f9cdf973', 'Caliu Teniscamp'], ['b4b2f33a', 'Cine Cataratas'], ['20b6e44d', 'Kammer'],
  ['37515f33', 'Neo Hair'], ['9c1ec3a0', 'Lolita'], ['31226193', 'Oriente Elevadores'], ['5d480d4e', 'Wizard'],
  ['a2cc762f', 'Óticas Samir'], ['70a4c417', 'Oral Implant'], ['2c222b5f', 'Pet Clube'], ['922f8146', 'Astral'],
  ['7419ff78', 'Du Quintal'], ['38033c4d', 'Centro de Educação Cataratas'], ['13a64b90', 'Sushi Kamui'], ['c6a8de6f', 'Kilki Moda Feminina'],
];
/** Pedidos da própria EXA (autopromoção, exemplo, sala de reunião) e editoriais nunca entram. */
const INTERNOS = ['990880fd', '55570ca6', '08e0e99e', 'c08f3154', '9cb8da99', '7a4dc868'];

const resp = (b: unknown, cache = 600) => new Response(JSON.stringify(b), {
  headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${cache}` },
});

function limpar(n?: string | null) {
  let t = String(n || '').replace(/^\s*EXA\s*[-–—:]\s*/i, '').replace(/\s+(ltda|me|eireli|s\/?a|vertical|horizontal)\.?\s*$/i, '').replace(/\s+/g, ' ').trim();
  t = t.replace(/\s+(ltda|me|eireli)\.?\s*$/i, '').trim();
  if (!t || /^pedido\b/i.test(t)) return '';
  if (t === t.toUpperCase() || t === t.toLowerCase())
    t = t.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_m, a, b) => a + b.toUpperCase()).replace(/ (De|Da|Do|Dos|Das|E) /g, (x) => x.toLowerCase());
  return t;
}
const vitrine = (id: string) => VITRINE.find(([k]) => id.startsWith(k))?.[1] || '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    const body = await req.json().catch(() => ({}));
    const tela = String(body.tela || '').toLowerCase();
    if (!/^[0-9a-f]{4}$/.test(tela)) return resp({ ok: false, error: 'tela inválida' }, 60);
    const daPlaylist = new Set((Array.isArray(body.pedidos) ? body.pedidos : []).map(String).slice(0, 200));

    const { data: predios } = await db.from('buildings').select('id');
    const ids = (predios || []).map((b: any) => String(b.id)).filter((id) => id.toLowerCase().startsWith(tela));
    if (!ids.length) return resp({ ok: true, marcas: [] });

    const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); // dia em Brasília
    const { data: peds, error } = await db.from('pedidos')
      .select('id, client_id, nome_pedido, data_inicio, data_fim, lista_predios, is_master, is_test_order, created_at')
      .in('status', STATUS_TOCANDO)
      .overlaps('lista_predios', ids);
    if (error) throw error;
    const vigentes = (peds || []).filter((p: any) =>
      !p.is_test_order && !EDITORIAIS.has(String(p.id)) && !INTERNOS.some((k) => String(p.id).startsWith(k)) &&
      (!p.data_inicio || String(p.data_inicio).slice(0, 10) <= hoje) &&
      (!p.data_fim || String(p.data_fim).slice(0, 10) >= hoje) &&
      (!daPlaylist.size || daPlaylist.has(String(p.id))));

    const clientes = [...new Set(vigentes.map((p: any) => p.client_id).filter(Boolean))];
    const { data: us } = clientes.length ? await db.from('users').select('id, empresa_nome').in('id', clientes) : { data: [] };
    const fantasia = new Map((us || []).map((u: any) => [u.id, String(u.empresa_nome || '').trim()]));

    const vistos = new Set<string>();
    const marcas: string[] = [];
    vigentes.sort((a: any, b: any) => String(a.created_at).localeCompare(String(b.created_at)));
    for (const p of vigentes) {
      const nome = vitrine(String(p.id)) || limpar(p.nome_pedido) || limpar(fantasia.get(p.client_id)) || '';
      if (!nome || FORA.test(nome) || /^\d/.test(nome)) continue;
      const k = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      if (vistos.has(k)) continue;
      vistos.add(k);
      marcas.push(nome);
    }
    return resp({ ok: true, marcas });
  } catch (e) {
    console.error('[exa2-marcas-tela]', (e as Error).message);
    return resp({ ok: false, marcas: [] }, 60);
  }
});
