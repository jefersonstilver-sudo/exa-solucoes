// Lista pública de prédios da Rede EXA (Ativo / Instalação / Interesse) via Notion.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DATABASE_ID = '1d6f9e03-8d81-813f-ad60-ff2fa347c3f5';
const NOTION_VERSION = '2022-06-28';
const STATUS_PERMITIDOS = new Set(['Ativo', 'Instalação', 'Instalaçao Internet', 'Instalação Internet', 'Interesse']);

function readPlain(p: any): string | null {
  if (!p) return null;
  const t = p.type;
  if (t === 'title' || t === 'rich_text') return ((p[t] || []).map((x: any) => x.plain_text).join('') || '').trim() || null;
  if (t === 'select') return p.select?.name ?? null;
  if (t === 'status') return p.status?.name ?? null;
  if (t === 'phone_number') return p.phone_number ?? null;
  if (t === 'email') return p.email ?? null;
  if (t === 'url') return p.url ?? null;
  if (t === 'number') return p.number != null ? String(p.number) : null;
  if (t === 'multi_select') return (p.multi_select || []).map((x: any) => x.name).join(', ') || null;
  return null;
}
function readNumber(p: any): number | null {
  if (!p) return null;
  if (p.type === 'number') return p.number ?? null;
  const s = readPlain(p); if (!s) return null;
  const n = parseInt(s.replace(/\D+/g, ''), 10); return isNaN(n) ? null : n;
}
function findKey(props: any, candidates: string[]): string | null {
  const keys = Object.keys(props || {});
  for (const c of candidates) { const k = keys.find(k => k.toLowerCase() === c.toLowerCase()); if (k) return k; }
  for (const c of candidates) { const k = keys.find(k => k.toLowerCase().includes(c.toLowerCase())); if (k) return k; }
  return null;
}
function findTitleKey(props: any): string | null {
  for (const k of Object.keys(props || {})) if (props[k]?.type === 'title') return k;
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const TOKEN = Deno.env.get('NOTION_API_KEY');
  if (!TOKEN) return new Response(JSON.stringify({ error: 'NOTION_API_KEY ausente' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const all: any[] = [];
    let cursor: string | undefined;
    for (let i = 0; i < 10; i++) {
      const body: any = { page_size: 100 };
      if (cursor) body.start_cursor = cursor;
      const r = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const txt = await r.text();
        return new Response(JSON.stringify({ error: 'Notion API error', status: r.status, body: txt }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const j = await r.json();
      all.push(...(j.results || []));
      if (!j.has_more) break;
      cursor = j.next_cursor;
    }

    const predios: any[] = [];
    const counts = { ativo: 0, instalacao: 0, interesse: 0, total: 0 };

    for (const page of all) {
      const props = page.properties || {};
      const titleKey = findTitleKey(props);
      const nome = titleKey ? readPlain(props[titleKey]) : null;
      const status = readPlain(props['Status']) || readPlain(props[findKey(props, ['Status']) || '']);
      if (!nome || !status) continue;
      if (!STATUS_PERMITIDOS.has(status)) continue;

      const enderecoKey = findKey(props, ['Endereço', 'Endereco', 'Address']);
      const bairroKey = findKey(props, ['Bairro']);
      const unidadesKey = findKey(props, ['Apartamentos', 'Unidades']);
      const andaresKey = findKey(props, ['Andares']);
      const blocosKey = findKey(props, ['Blocos']);
      const tipoKey = findKey(props, ['Tipo']);
      const fotosKey = findKey(props, ['Fotos', 'Imagens']);
      const airbnbKey = findKey(props, ['Airbnb', 'Tem Airbnb', 'Aibnb']);
      let temAirbnb = false;
      if (airbnbKey && props[airbnbKey]) {
        const ap = props[airbnbKey];
        if (ap.type === 'checkbox') temAirbnb = !!ap.checkbox;
        else {
          const v = (readPlain(ap) || '').toLowerCase();
          temAirbnb = v === 'sim' || v === 'true' || v === 'yes' || v === '1' || v.includes('airbnb');
        }
      }

      const unidades = unidadesKey ? readNumber(props[unidadesKey]) : null;
      const andares = andaresKey ? readNumber(props[andaresKey]) : null;
      const imgRe = /\.(jpe?g|png|webp|gif|avif|heic|heif)(\?|$)/i;
      let fotosCount = 0;
      if (fotosKey && props[fotosKey]?.type === 'files') {
        for (const f of (props[fotosKey].files || [])) {
          const url = f.type === 'external' ? f.external?.url : f.file?.url;
          const name = f.name || '';
          if (imgRe.test(name) || (url && imgRe.test(url))) fotosCount++;
        }
      }
      const publico = unidades ? Math.round(unidades * 3.5) : null;

      const statusGroup = status.startsWith('Instala') ? 'instalacao' : (status === 'Ativo' ? 'ativo' : 'interesse');
      counts[statusGroup as 'ativo'|'instalacao'|'interesse']++;
      counts.total++;

      predios.push({
        id: page.id,
        nome,
        status,
        statusGroup,
        endereco: enderecoKey ? readPlain(props[enderecoKey]) : null,
        bairro: bairroKey ? readPlain(props[bairroKey]) : null,
        unidades, andares,
        blocos: blocosKey ? readNumber(props[blocosKey]) : null,
        publico,
        tipo: tipoKey ? readPlain(props[tipoKey]) : null,
        fotosCount,
        fotoUrl: fotosCount > 0 ? `https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/catalogo-foto?id=${page.id}&i=0` : null,
        temAirbnb,
      });
    }

    const order: any = { ativo: 0, instalacao: 1, interesse: 2 };
    predios.sort((a, b) => (order[a.statusGroup] - order[b.statusGroup]) || a.nome.localeCompare(b.nome, 'pt-BR'));

    return new Response(JSON.stringify({ counts, predios }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600, s-maxage=600' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

