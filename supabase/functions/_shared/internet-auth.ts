import { createClient } from 'npm:@supabase/supabase-js@2.49.4';

export function internetDb() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Service unavailable');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function internetAdmin(req: Request) {
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return null;
  const db = internetDb();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return null;
  const { data: allowed, error: roleError } = await db.rpc('has_role', { _user_id: user.id, _role: 'super_admin' });
  if (roleError || !allowed) return null;
  return { db, user };
}
