// Diagnóstico temporário — lista DBs visíveis ao token

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async () => {
  const TOKEN = Deno.env.get('NOTION_API_KEY')!;
  const r = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
    body: JSON.stringify({ filter: { property: 'object', value: 'database' }, page_size: 50 }),
  });
  const j = await r.json();
  const out = (j.results || []).map((d: any) => ({ id: d.id, title: (d.title || []).map((x: any) => x.plain_text).join('') }));
  return new Response(JSON.stringify({ token_prefix: TOKEN.slice(0, 12), count: out.length, dbs: out }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
