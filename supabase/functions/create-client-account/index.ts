import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    const { email, password, primeiro_nome, sobrenome, telefone, role } = await req.json();

    console.log(`[CREATE-CLIENT] Creating account for: ${email}`);

    // Check if user already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingAuthUser) {
      console.log(`[CREATE-CLIENT] Auth user already exists: ${existingAuthUser.id}`);
      userId = existingAuthUser.id;

      // Update password and metadata
      await supabaseAdmin.auth.admin.updateUser(userId, {
        password,
        email_confirm: true,
        user_metadata: {
          primeiro_nome,
          sobrenome,
          nome: `${primeiro_nome} ${sobrenome}`,
          role: role || 'client'
        }
      });
    } else {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          primeiro_nome,
          sobrenome,
          nome: `${primeiro_nome} ${sobrenome}`,
          role: role || 'client'
        }
      });

      if (authError) {
        console.error('[CREATE-CLIENT] Auth error:', authError);
        return new Response(JSON.stringify({ success: false, error: authError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      userId = authData.user.id;
      console.log(`[CREATE-CLIENT] Auth user created with ID: ${userId}`);
    }

    // Check if user already exists in users table
    const { data: existingProfile } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabaseAdmin.from('users').update({
        email,
        nome: `${primeiro_nome} ${sobrenome}`,
        primeiro_nome,
        sobrenome,
        telefone,
        role: role || 'client'
      }).eq('id', userId);

      if (updateError) {
        console.error('[CREATE-CLIENT] Users update error:', updateError);
        return new Response(JSON.stringify({ success: false, error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      console.log(`[CREATE-CLIENT] ✅ Existing account updated for ${email}`);
    } else {
      // Insert into users table
      const { error: usersError } = await supabaseAdmin.from('users').insert({
        id: userId,
        email,
        nome: `${primeiro_nome} ${sobrenome}`,
        primeiro_nome,
        sobrenome,
        telefone,
        role: role || 'client'
      });

      if (usersError) {
        console.error('[CREATE-CLIENT] Users table error:', usersError);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return new Response(JSON.stringify({ success: false, error: usersError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      console.log(`[CREATE-CLIENT] ✅ Account created successfully for ${email}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      userId,
      message: `Conta criada/atualizada com sucesso para ${email}`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[CREATE-CLIENT] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
