const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const clienteIds = url.searchParams.get('cliente_ids') || url.searchParams.get('cliente_id');
    const titulo = url.searchParams.get('titulo');

    if (!clienteIds) {
      return new Response(JSON.stringify({ error: 'cliente_ids é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiUrl = new URL(`http://18.228.252.149:8000/qrcode/logs/${clienteIds}`);
    if (titulo) apiUrl.searchParams.set('titulo', titulo);

    console.log('[qrcode-logs-proxy] GET', apiUrl.toString());
    const res = await fetch(apiUrl.toString());
    const text = await res.text();
    console.log('[qrcode-logs-proxy] status', res.status, 'len', text.length);

    return new Response(text, {
      status: res.status,
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
