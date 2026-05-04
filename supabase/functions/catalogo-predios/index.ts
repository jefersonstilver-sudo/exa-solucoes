// Lista pública de prédios da Rede EXA (Ativo / Instalação / Interesse) via Notion.
// Sem leitura/escrita em tabelas internas. Cache 10min na CDN.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DATABASE_ID = Deno.env.get('NOTION_DATABASE_ID') || '1d6f9e03-8d81-813f-ad60-ff2fa347c3f5';
const NOTION_VERSION = '2022-06-28';
const STATUS_PERMITIDOS = new Set(['Ativo', 'Instalação', 'Instalaçao Internet', 'Instalação Internet', 'Interesse']);

function getProp(props: any, name: string): any {
  return props?.[name] ?? null;
}

function readText(p: any): string | null {
  if (!p) return null;
  const t = p.type;
  if (t === 'title' || t === 'rich_text') {
    return (p[t] || []).map((x: any) => x.plain_text).join('').trim() || null;
  }
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
  const s = readText(p);
  if (!s) return null;
  const n = parseInt(s.replace(/\D+/g, ''), 10);
  return isNaN(n) ? null : n;
}

function readFilesCount(p: any): number {
  if (!p || p.type !== 'files') return 0;
  return (p.files || []).length;
}

function findKey(props: any, candidates: string[]): string | null {
  const keys = Object.keys(props || {});
  for (const c of candidates) {
    const k = keys.find(k => k.toLowerCase() === c.toLowerCase());
    if (k) return k;
  }
  for (const c of candidates) {
    const k = keys.find(k => k.toLowerCase().includes(c.toLowerCase()));
    if (k) return k;
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const NOTION_API_KEY = Deno.env.get('NOTION_API_KEY');
  if (!NOTION_API_KEY) {
    return new Response(JSON.stringify({ error: 'NOTION_API_KEY ausente' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const all: any[] = [];
    let cursor: string | undefined = undefined;
    for (let i = 0; i < 10; i++) {
      const body: any = { page_size: 100 };
      if (cursor) body.start_cursor = cursor;
      const r = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
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
      const nomeKey = findKey(props, ['Nome', 'Name', 'Prédio', 'Predio']);
      const statusKey = findKey(props, ['Status']);
      const enderecoKey = findKey(props, ['Endereço', 'Endereco', 'Address']);
      const bairroKey = findKey(props, ['Bairro', 'Região', 'Regiao']);
      const unidadesKey = findKey(props, ['Unidades', 'Apartamentos']);
      const andaresKey = findKey(props, ['Andares']);
      const blocosKey = findKey(props, ['Blocos']);
      const publicoKey = findKey(props, ['Público', 'Publico', 'Pessoas']);
      const tipoKey = findKey(props, ['Tipo']);
      const fotosKey = findKey(props, ['Fotos', 'Imagens', 'Photos']);

      const nome = nomeKey ? readText(props[nomeKey]) : null;
      const status = statusKey ? readText(props[statusKey]) : null;
      if (!nome || !status) continue;
      if (!STATUS_PERMITIDOS.has(status)) continue;

      const unidades = unidadesKey ? readNumber(props[unidadesKey]) : null;
      const andares = andaresKey ? readNumber(props[andaresKey]) : null;
      const fotosCount = fotosKey ? readFilesCount(props[fotosKey]) : 0;

      let publico: number | null = publicoKey ? readNumber(props[publicoKey]) : null;
      if (!publico && unidades) publico = Math.round(unidades * 3.5);

      const statusNorm = status.startsWith('Instala') ? 'instalacao' : (status === 'Ativo' ? 'ativo' : 'interesse');
      counts[statusNorm as 'ativo'|'instalacao'|'interesse']++;
      counts.total++;

      predios.push({
        id: page.id,
        nome,
        status,
        statusGroup: statusNorm,
        endereco: enderecoKey ? readText(props[enderecoKey]) : null,
        bairro: bairroKey ? readText(props[bairroKey]) : null,
        unidades,
        andares,
        blocos: blocosKey ? readNumber(props[blocosKey]) : null,
        publico,
        tipo: tipoKey ? readText(props[tipoKey]) : null,
        fotosCount,
        fotoUrl: fotosCount > 0 ? `/functions/v1/catalogo-foto?id=${page.id}&i=0` : null,
      });
    }

    // Ordena: Ativo > Instalação > Interesse, depois por nome
    const order = { ativo: 0, instalacao: 1, interesse: 2 };
    predios.sort((a, b) => (order[a.statusGroup as keyof typeof order] - order[b.statusGroup as keyof typeof order]) || a.nome.localeCompare(b.nome, 'pt-BR'));

    return new Response(JSON.stringify({ counts, predios }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600, s-maxage=600' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
