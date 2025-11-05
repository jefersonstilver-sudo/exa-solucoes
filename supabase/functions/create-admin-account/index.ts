
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { validateRequest } from './validation.ts';
import { checkExistingUser } from './userChecks.ts';
import { createAdminUser } from './userCreation.ts';
import { sendAdminWelcomeEmail } from './emailService.ts';
import { corsHeaders } from './cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [CREATE-ADMIN] Edge function iniciada - versão refatorada');

    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse e validação da requisição
    const validationResult = await validateRequest(req);
    if (validationResult.error) {
      return new Response(
        JSON.stringify(validationResult.error),
        { 
          status: validationResult.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { email, adminType } = validationResult.data;

    // Verificar se usuário já existe
    const existingUserCheck = await checkExistingUser(email);
    if (existingUserCheck.error) {
      return new Response(
        JSON.stringify(existingUserCheck.error),
        { 
          status: existingUserCheck.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Criar usuário administrativo
    const createResult = await createAdminUser(email, adminType);
    if (createResult.error) {
      return new Response(
        JSON.stringify(createResult.error),
        { 
          status: createResult.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Enviar email de boas-vindas
    console.log('📧 [CREATE-ADMIN] Enviando email de boas-vindas...');
    const emailResult = await sendAdminWelcomeEmail(email, adminType, createResult.password || 'exa2025');
    
    if (!emailResult.success) {
      console.warn('⚠️ [CREATE-ADMIN] Conta criada mas email não enviado:', emailResult.error);
    } else {
      console.log('✅ [CREATE-ADMIN] Email enviado com sucesso!');
    }

    // Resposta de sucesso
    console.log('🎉 [CREATE-ADMIN] Conta criada com sucesso!');
    
    return new Response(
      JSON.stringify({
        success: true,
        user: createResult.user,
        emailSent: emailResult.success,
        message: 'Conta administrativa criada com sucesso!'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 [CREATE-ADMIN] Erro crítico não tratado:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
