import { createClient } from 'npm:@supabase/supabase-js@2.49.4';

export async function authorizeOrderSync(req: Request) {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Service unavailable');
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return null;
  const db = createClient(url, key, { auth: { persistSession: false } });
  if (token === key) return { db, userId: null, key, url };
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return null;
  const { data: role, error: roleError } = await db.from('user_roles').select('id')
    .eq('user_id', user.id).in('role', ['super_admin', 'admin']).limit(1).maybeSingle();
  if (roleError || !role) return null;
  return { db, userId: user.id, key, url };
}