// Helpers compartilhados para o sistema de impersonação Admin Master de Vídeo
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function requireAdminCaller(req: Request): Promise<{ userId: string; role: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Response(JSON.stringify({ error: 'Missing Authorization' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const supabase = getServiceClient();
  const token = authHeader.replace('Bearer ', '');
  const { data: userRes, error } = await supabase.auth.getUser(token);
  if (error || !userRes?.user) {
    throw new Response(JSON.stringify({ error: 'Invalid auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const userId = userRes.user.id;
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
  const roleList = (roles || []).map((r: any) => r.role);
  const allowed = roleList.find((r: string) => r === 'super_admin' || r === 'admin_master_video');
  if (!allowed) {
    throw new Response(JSON.stringify({ error: 'Forbidden — requires super_admin or admin_master_video' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  return { userId, role: allowed };
}

export async function requireValidSession(sessionId: string): Promise<{
  id: string; admin_user_id: string; target_user_id: string; target_pedido_id: string | null; expires_at: string;
}> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('admin_impersonation_sessions')
    .select('id, admin_user_id, target_user_id, target_pedido_id, expires_at, ended_at')
    .eq('id', sessionId)
    .maybeSingle();
  if (error || !data) {
    throw new Response(JSON.stringify({ error: 'Session not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  if (data.ended_at) {
    throw new Response(JSON.stringify({ error: 'Session ended' }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  if (new Date(data.expires_at).getTime() < Date.now()) {
    throw new Response(JSON.stringify({ error: 'Session expired' }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  return data as any;
}

export async function logAction(params: {
  session_id: string;
  admin_user_id: string;
  target_user_id: string;
  pedido_id?: string | null;
  action: string;
  entity_id?: string | null;
  payload?: any;
}) {
  const supabase = getServiceClient();
  await supabase.from('admin_impersonation_actions').insert({
    session_id: params.session_id,
    admin_user_id: params.admin_user_id,
    target_user_id: params.target_user_id,
    pedido_id: params.pedido_id ?? null,
    action: params.action,
    entity_id: params.entity_id ?? null,
    payload: params.payload ?? null,
  });
}
