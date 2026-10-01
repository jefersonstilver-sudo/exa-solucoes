import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.24.2';
import { internetAdmin } from '../_shared/internet-auth.ts';
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  try {
    const admin = await internetAdmin(req);
    if (!admin) return reply({ error: 'Unauthorized' }, 401);
    const parsed = z.object({ document_id: z.string().uuid() }).strict().safeParse(await req.json().catch(() => null));
    if (!parsed.success) return reply({ error: 'Invalid document' }, 400);
    const { data: doc, error } = await admin.db.from('internet_documents').select('storage_path').eq('id', parsed.data.document_id).maybeSingle();
    if (error || !doc) return reply({ error: 'Document unavailable' }, 404);
    const signed = await admin.db.storage.from('internet-invoices-private').createSignedUrl(doc.storage_path, 60);
    if (signed.error || !signed.data) return reply({ error: 'Document unavailable' }, 503);
    return reply({ url: signed.data.signedUrl, expires_in: 60 });
  } catch { return reply({ error: 'Service unavailable' }, 503); }
});
