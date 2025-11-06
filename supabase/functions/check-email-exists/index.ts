import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  console.log('🔍 [CHECK-EMAIL] Requisição recebida:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    // Validação e sanitização de input
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Email é obrigatório e deve ser uma string',
        exists: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Sanitizar email: remover espaços, converter para minúsculas
    const sanitizedEmail = email.trim().toLowerCase();
    
    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return new Response(JSON.stringify({ 
        error: 'Formato de email inválido',
        exists: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Validação de comprimento
    if (sanitizedEmail.length < 5 || sanitizedEmail.length > 255) {
      return new Response(JSON.stringify({ 
        error: 'Email deve ter entre 5 e 255 caracteres',
        exists: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log('📧 [CHECK-EMAIL] Verificando email:', sanitizedEmail);

    // Inicializar cliente Supabase com service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar se email existe na tabela auth.users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ [CHECK-EMAIL] Erro ao listar usuários:', usersError);
      throw usersError;
    }

    const userExists = users?.some(user => user.email?.toLowerCase() === sanitizedEmail);
    
    if (userExists) {
      console.log('⚠️ [CHECK-EMAIL] Email já cadastrado:', sanitizedEmail);
      
      // Buscar informações adicionais do usuário (sem dados sensíveis)
      const user = users.find(u => u.email?.toLowerCase() === sanitizedEmail);
      const isConfirmed = user?.email_confirmed_at !== null;
      
      return new Response(JSON.stringify({ 
        exists: true,
        is_confirmed: isConfirmed,
        message: isConfirmed 
          ? 'Este email já está cadastrado e confirmado. Faça login para acessar sua conta.'
          : 'Este email já está cadastrado mas não foi confirmado. Verifique seu email ou solicite um novo link de confirmação.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log('✅ [CHECK-EMAIL] Email disponível:', sanitizedEmail);

    return new Response(JSON.stringify({ 
      exists: false,
      message: 'Email disponível para cadastro'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('💥 [CHECK-EMAIL] Erro:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Erro ao verificar email',
      message: error.message,
      exists: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
