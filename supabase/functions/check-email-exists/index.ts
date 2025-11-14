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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    // Use service role key for checking users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar se email existe na tabela auth.users
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ [CHECK-EMAIL] Erro ao listar usuários:', usersError);
      throw usersError;
    }

    const authUser = users?.find(user => user.email?.toLowerCase() === sanitizedEmail);
    
    if (authUser) {
      console.log('⚠️ [CHECK-EMAIL] Email encontrado no auth.users:', sanitizedEmail);
      
      // Verificar se o email também existe na tabela users
      const { data: dbUser, error: dbError } = await supabaseAdmin
        .from('users')
        .select('id, email, role, nome')
        .eq('email', sanitizedEmail)
        .maybeSingle();

      if (dbError && dbError.code !== 'PGRST116') {
        console.error('❌ [CHECK-EMAIL] Erro ao verificar tabela users:', dbError);
        throw dbError;
      }

      // Se existe no auth.users mas NÃO na tabela users, é um email órfão
      if (!dbUser) {
        console.log('🧹 [CHECK-EMAIL] Email órfão detectado, removendo do auth.users...');
        
        try {
          // Primeiro, limpar registros relacionados que podem impedir a deleção
          console.log('🗑️ [CHECK-EMAIL] Limpando registros relacionados...');
          
          // Deletar role_change_audit que pode ter foreign key
          const { error: auditDeleteError } = await supabaseAdmin
            .from('role_change_audit')
            .delete()
            .eq('user_id', authUser.id);
          
          if (auditDeleteError) {
            console.warn('⚠️ [CHECK-EMAIL] Aviso ao limpar audit:', auditDeleteError);
            // Continua mesmo com erro, pois pode não haver registros
          }

          // Deletar user_activity_logs
          const { error: logsDeleteError } = await supabaseAdmin
            .from('user_activity_logs')
            .delete()
            .eq('user_id', authUser.id);
          
          if (logsDeleteError) {
            console.warn('⚠️ [CHECK-EMAIL] Aviso ao limpar logs:', logsDeleteError);
          }
          
          console.log('✅ [CHECK-EMAIL] Registros relacionados limpos');
          
          // Agora deletar o usuário do auth.users
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
          
          if (deleteError) {
            console.error('❌ [CHECK-EMAIL] Erro ao deletar usuário órfão:', deleteError);
            throw deleteError;
          }
          
          console.log('✅ [CHECK-EMAIL] Email órfão removido com sucesso:', sanitizedEmail);
          
          return new Response(JSON.stringify({ 
            exists: false,
            message: 'Email disponível para cadastro',
            was_orphaned: true
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (cleanupError: any) {
          console.error('💥 [CHECK-EMAIL] Falha ao limpar email órfão:', cleanupError);
          // Continua e retorna como email existente se a limpeza falhar
        }
      }
      
      // Email existe no auth.users E na tabela users
      const isConfirmed = authUser.email_confirmed_at !== null;
      
      return new Response(JSON.stringify({ 
        exists: true,
        is_confirmed: isConfirmed,
        role: dbUser?.role,
        nome: dbUser?.nome,
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
