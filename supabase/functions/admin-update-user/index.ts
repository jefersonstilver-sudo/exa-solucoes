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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { email, password, primeiro_nome, sobrenome, telefone, confirm_email } = await req.json();

    console.log(`[ADMIN-UPDATE-USER] Updating user: ${email}`);

    // Find the user by email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Usuário não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id;
    console.log(`[ADMIN-UPDATE-USER] Found user ID: ${userId}`);

    // Update auth user
    const updateData: any = {};
    
    if (password) {
      updateData.password = password;
    }
    
    if (confirm_email) {
      updateData.email_confirm = true;
    }

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
      console.error('[ADMIN-UPDATE-USER] Auth update error:', authError);
      return new Response(JSON.stringify({ success: false, error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update users table
    const usersUpdate: any = {};
    if (primeiro_nome) usersUpdate.primeiro_nome = primeiro_nome;
    if (sobrenome) usersUpdate.sobrenome = sobrenome;
    if (primeiro_nome && sobrenome) usersUpdate.nome = `${primeiro_nome} ${sobrenome}`;
    if (telefone) usersUpdate.telefone = telefone;

    if (Object.keys(usersUpdate).length > 0) {
      const { error: usersError } = await supabaseAdmin
        .from('users')
        .update(usersUpdate)
        .eq('id', userId);

      if (usersError) {
        console.error('[ADMIN-UPDATE-USER] Users table update error:', usersError);
      }
    }

    console.log(`[ADMIN-UPDATE-USER] ✅ User updated successfully: ${email}`);

    return new Response(JSON.stringify({ 
      success: true, 
      userId,
      message: `Usuário ${email} atualizado com sucesso. Email confirmado: ${confirm_email ? 'Sim' : 'Não'}, Senha alterada: ${password ? 'Sim' : 'Não'}`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN-UPDATE-USER] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
