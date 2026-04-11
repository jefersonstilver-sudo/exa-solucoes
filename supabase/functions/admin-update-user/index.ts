import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ✅ VERIFICAÇÃO DE AUTENTICAÇÃO — obrigatória antes de qualquer operação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar identidade do chamador com cliente normal (respeita RLS)
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: callerUser }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ success: false, error: 'Token inválido ou expirado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se o chamador é admin ou super_admin
    const { data: callerProfile, error: profileError } = await callerClient
      .from('users')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (profileError || !callerProfile) {
      return new Response(JSON.stringify({ success: false, error: 'Perfil não encontrado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const allowedRoles = ['admin', 'super_admin'];
    if (!allowedRoles.includes(callerProfile.role)) {
      return new Response(JSON.stringify({ success: false, error: 'Permissão negada' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ Chamador verificado — agora usa client admin para operar
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await req.json();
    const { email, user_id, password, primeiro_nome, sobrenome, telefone, confirm_email, check_only } = body;

    // Encontrar usuário alvo
    let user = null;

    if (user_id) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(user_id);
      user = data?.user || null;
    } else if (email) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Email ou user_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Modo check_only — apenas verificar status
    if (check_only) {
      return new Response(JSON.stringify({
        success: true,
        user_exists: !!user,
        email_confirmed: user?.email_confirmed_at != null,
        user_id: user?.id || null,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id;

    // Atualizar auth do usuário alvo
    const updateData: any = {};
    if (password) updateData.password = password;
    if (confirm_email) updateData.email_confirm = true;
    if (primeiro_nome || sobrenome) {
      updateData.user_metadata = {
        ...user.user_metadata,
        primeiro_nome,
        sobrenome,
        nome: `${primeiro_nome} ${sobrenome}`
      };
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
    if (authError) {
      return new Response(JSON.stringify({ success: false, error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Atualizar tabela users
    const usersUpdate: any = {};
    if (primeiro_nome) usersUpdate.primeiro_nome = primeiro_nome;
    if (sobrenome) usersUpdate.sobrenome = sobrenome;
    if (primeiro_nome && sobrenome) usersUpdate.nome = `${primeiro_nome} ${sobrenome}`;
    if (telefone) usersUpdate.telefone = telefone;

    if (Object.keys(usersUpdate).length > 0) {
      await supabaseAdmin.from('users').update(usersUpdate).eq('id', userId);
    }

    return new Response(JSON.stringify({
      success: true,
      userId,
      message: `Usuário atualizado com sucesso.`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
