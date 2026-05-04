// Proxy de fotos do Notion (URLs assinadas expiram ~1h). Cache 24h.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const NOTION_VERSION = '2022-06-28';

const IMG_RE = /\.(jpe?g|png|webp|gif|avif|heic|heif)(\?|$)/i;

function isImageFile(f: any): boolean {
  const url = f.type === 'external' ? f.external?.url : f.file?.url;
  const name = f.name || '';
  return IMG_RE.test(name) || (url ? IMG_RE.test(url) : false);
}

function findImageFiles(props: any): any[] {
  for (const k of Object.keys(props || {})) {
    const p = props[k];
    if (p?.type === 'files' && (p.files || []).length > 0) {
      const imgs = p.files.filter(isImageFile);
      if (imgs.length > 0) return imgs;
    }
  }
  return [];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const TOKEN = Deno.env.get('NOTION_API_KEY');
  if (!TOKEN) return new Response('NOTION_API_KEY missing', { status: 500, headers: corsHeaders });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const idx = parseInt(url.searchParams.get('i') || '0', 10);
  if (!id) return new Response('missing id', { status: 400, headers: corsHeaders });

  try {
    const r = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Notion-Version': NOTION_VERSION },
    });
    if (!r.ok) return new Response('notion error', { status: 502, headers: corsHeaders });
    const page = await r.json();
    const imgs = findImageFiles(page.properties);
    const file = imgs[idx];
    if (!file) return new Response('no image', { status: 404, headers: corsHeaders });
    const fileUrl = file.type === 'external' ? file.external?.url : file.file?.url;
    if (!fileUrl) return new Response('no url', { status: 404, headers: corsHeaders });

    const fr = await fetch(fileUrl);
    if (!fr.ok) return new Response('fetch fail', { status: 502, headers: corsHeaders });
    const ct = fr.headers.get('content-type') || 'image/jpeg';
    const buf = await fr.arrayBuffer();
    return new Response(buf, {
      headers: { ...corsHeaders, 'Content-Type': ct, 'Cache-Control': 'public, max-age=86400, immutable' },
    });
  } catch (e) {
    return new Response('err: ' + String(e), { status: 500, headers: corsHeaders });
  }
});
