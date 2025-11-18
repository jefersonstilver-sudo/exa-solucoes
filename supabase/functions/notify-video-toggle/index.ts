// deno-lint-ignore-file no-explicit-any
// notify-video-toggle edge function
// Forwards video toggle actions to the external n8n webhook with proper CORS

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Webhook URLs based on "ativo"
const WEBHOOK_URL_TRUE = 'https://stilver.app.n8n.cloud/webhook/ATIVAR/DESATIVAR';
const WEBHOOK_URL_FALSE = 'https://stilver.app.n8n.cloud/webhook/DESATIVANDO_VIDEO_FALSE';
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Aceitar chamadas de edge functions internas OU de usuários autenticados
    const authHeader = req.headers.get('Authorization');
    let isAuthenticated = false;
    let user: any = null;
    let isAdmin = false;

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.49.4');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Se houver header de autenticação, validar JWT
    if (authHeader) {
      console.log('🔐 [WEBHOOK] Autenticação via JWT detectada');
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authUser) {
        console.error('❌ [WEBHOOK] Auth error:', authError);
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      user = authUser;
      isAuthenticated = true;

      // Check if user has permission (admin or owns the buildings being toggled)
      const { data: userRole } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      isAdmin = userRole && ['admin', 'super_admin'].includes(userRole.role);
      console.log('✅ [WEBHOOK] Usuário autenticado:', user.id, 'Admin:', isAdmin);
    } else {
      // Se não houver header de auth, assumir que é chamada interna (de outra edge function)
      console.log('🔓 [WEBHOOK] Chamada interna (sem autenticação) - permitida');
      isAuthenticated = true; // Permitir edge functions internas
      isAdmin = true; // Edge functions internas têm privilégios de admin
    }

    const body = await req.json().catch(() => ({}));
    const actions = Array.isArray(body?.actions) ? body.actions : [];

    console.log(`🔔 [WEBHOOK] Received ${actions.length} actions:`, actions);

    if (!actions.length) {
      console.log('❌ [WEBHOOK] No actions provided');
      return new Response(
        JSON.stringify({ ok: false, message: 'No actions provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Validate building ownership for non-admins (apenas se houver usuário autenticado via JWT)
    if (!isAdmin && user) {
      const buildingIds = actions
        .map((a: any) => a?.predio_id ?? a?.predioId ?? a?.building_id)
        .filter(Boolean);

      if (buildingIds.length > 0) {
        const { data: userOrders } = await supabase
          .from('pedidos')
          .select('lista_predios')
          .eq('client_id', user.id);

        const userBuildingIds = new Set(
          userOrders?.flatMap((o: any) => o.lista_predios || []) || []
        );

        const unauthorized = buildingIds.some((id: string) => !userBuildingIds.has(id));
        if (unauthorized) {
          console.error('❌ [WEBHOOK] Forbidden: user does not own all buildings');
          return new Response(
            JSON.stringify({ ok: false, message: 'Acesso negado - você não possui todos os prédios especificados' }),
            { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }
    }

    // Execute all POSTs in parallel with single-target routing per status
    const results = await Promise.allSettled(
      actions.flatMap((a: any, idx: number) => {
        const payload = {
          titulo: a?.titulo ?? '',
          ativo: Boolean(a?.ativo),
          predio_id: a?.predio_id ?? a?.predioId ?? a?.building_id ?? null,
          slot: a?.slot ?? null,
        };
        
        if (payload.ativo) {
          // ativo=true → enviar SOMENTE para ATIVAR/DESATIVAR
          console.log(`📤 [WEBHOOK][${idx + 1}] ativo=true → ATIVAR/DESATIVAR:`, payload);
          return [
            fetch(WEBHOOK_URL_TRUE, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          ];
        } else {
          // ativo=false → enviar SOMENTE para DESATIVANDO_VIDEO_FALSE
          console.log(`📤 [WEBHOOK][${idx + 1}] ativo=false → DESATIVANDO_VIDEO_FALSE:`, payload);
          return [
            fetch(WEBHOOK_URL_FALSE, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          ];
        }
      })
    );

    const summarized = results.map((r, idx) => {
      if (r.status === 'fulfilled') {
        return { index: idx, ok: r.value.ok, status: r.value.status };
      }
      return { index: idx, ok: false, error: String(r.reason) };
    });

    const successCount = summarized.filter((r) => r.ok).length;
    const failureCount = summarized.length - successCount;

    console.log(`✅ [WEBHOOK] Completed: ${successCount} success, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ ok: true, successCount, failureCount, results: summarized }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message ?? String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
