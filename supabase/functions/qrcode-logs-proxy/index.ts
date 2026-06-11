// Proxy para a API externa AWS de scans de QR Code.
// Aceita centenas de cliente_ids — particiona internamente em chunks para
// não estourar o limite de URL da API externa e dispara em paralelo com
// concorrência limitada. Deduplica resultados antes de devolver.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const BASE = 'http://18.228.252.149:8000/qrcode/logs';
const CHUNK_SIZE = 40;
const CONCURRENCY = 5;

interface ScanLog {
  cliente_id?: string;
  nome_cliente?: string;
  titulo?: string;
  link?: string;
  data_hora?: string;
}

async function fetchChunk(cids: string[], titulo?: string): Promise<ScanLog[]> {
  const url = new URL(`${BASE}/${cids.join(',')}`);
  if (titulo) url.searchParams.set('titulo', titulo);
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn('[qrcode-logs-proxy] chunk error', res.status, cids.length);
      return [];
    }
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('[qrcode-logs-proxy] chunk fetch failed', e);
    return [];
  }
}

async function fetchAll(cids: string[], titulo?: string): Promise<ScanLog[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < cids.length; i += CHUNK_SIZE) {
    chunks.push(cids.slice(i, i + CHUNK_SIZE));
  }

  const results: ScanLog[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < chunks.length) {
      const idx = cursor++;
      const chunk = chunks[idx];
      const data = await fetchChunk(chunk, titulo);
      results.push(...data);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, chunks.length) }, () => worker());
  await Promise.all(workers);

  // Deduplica por cliente_id + titulo + data_hora + link
  const seen = new Set<string>();
  const deduped: ScanLog[] = [];
  for (const s of results) {
    const k = `${s.cliente_id || ''}|${(s.titulo || '').toLowerCase().trim()}|${s.data_hora || ''}|${s.link || ''}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(s);
  }
  return deduped;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const clienteIds =
      url.searchParams.get('cliente_ids') || url.searchParams.get('cliente_id');
    const titulo = url.searchParams.get('titulo') || undefined;

    if (!clienteIds) {
      return new Response(JSON.stringify({ error: 'cliente_ids é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cids = Array.from(
      new Set(
        clienteIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    );

    if (cids.length === 0) {
      return new Response('[]', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Caminho rápido (1 chunk) — mantém comportamento idêntico ao original.
    if (cids.length <= CHUNK_SIZE) {
      const apiUrl = new URL(`${BASE}/${cids.join(',')}`);
      if (titulo) apiUrl.searchParams.set('titulo', titulo);
      console.log('[qrcode-logs-proxy] single GET', apiUrl.toString());
      const res = await fetch(apiUrl.toString());
      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[qrcode-logs-proxy] batched', cids.length, 'cids, titulo=', titulo || '(none)');
    const all = await fetchAll(cids, titulo);
    return new Response(JSON.stringify(all), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[qrcode-logs-proxy] error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
