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

  // There are legacy text and app_role overloads of has_role in this project.
  // Calling it through PostgREST is ambiguous (PGRST203), so authorize against
  // the canonical roles table with the server-only client instead.
  const { data: role, error: roleError } = await db
    .from('user_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('role', 'super_admin')
    .maybeSingle();
  if (roleError || !role) return null;
  return { db, user };
}
