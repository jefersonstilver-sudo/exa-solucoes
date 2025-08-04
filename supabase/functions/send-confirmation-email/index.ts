import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@4.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS para OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 [SEND-CONFIRMATION] Iniciando processamento do email de confirmação')
    
    // Validação da requisição
    if (req.method !== 'POST') {
      console.error('❌ [SEND-CONFIRMATION] Método não permitido:', req.method)
      return new Response(
        JSON.stringify({ success: false, error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let requestBody
    try {
      requestBody = await req.json()
    } catch (parseError: any) {
      console.error('❌ [SEND-CONFIRMATION] Erro ao parsear JSON:', parseError)
      return new Response(
        JSON.stringify({ success: false, error: 'JSON inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📦 [SEND-CONFIRMATION] Dados recebidos:', {
      hasUser: !!requestBody.user,
      hasEmailData: !!requestBody.email_data,
      userEmail: requestBody.user?.email,
      hasTokenHash: !!requestBody.email_data?.token_hash,
      hasRedirectTo: !!requestBody.email_data?.redirect_to
    })

    const { user, email_data } = requestBody

    // Validação rigorosa dos dados
    if (!user) {
      console.error('❌ [SEND-CONFIRMATION] Objeto user não fornecido')
      return new Response(
        JSON.stringify({ success: false, error: 'Dados de usuário não fornecidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user.email) {
      console.error('❌ [SEND-CONFIRMATION] Email do usuário não fornecido')
      return new Response(
        JSON.stringify({ success: false, error: 'Email do usuário é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!email_data?.token_hash) {
      console.error('❌ [SEND-CONFIRMATION] Token hash não fornecido')
      return new Response(
        JSON.stringify({ success: false, error: 'Token de confirmação não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar API key do Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    console.log('🔑 [SEND-CONFIRMATION] Status da API Key:', {
      hasApiKey: !!resendApiKey,
      keyLength: resendApiKey?.length || 0,
      keyStart: resendApiKey ? `${resendApiKey.substring(0, 6)}...` : 'N/A'
    })
    
    if (!resendApiKey) {
      console.error('❌ [SEND-CONFIRMATION] RESEND_API_KEY não configurada')
      // CRÍTICO: Não quebrar o fluxo de cadastro, mas logar o erro
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Serviço de email não configurado',
          user_can_continue: true // Flag para indicar que o usuário pode continuar
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resend = new Resend(resendApiKey)

    // Construir URL de confirmação com fallback
    const baseUrl = 'https://aakenoljsycyrcrchgxj.supabase.co'
    const redirectTo = email_data.redirect_to || 'https://loving-bough-1xb6c3h.lovableproject.com/'
    const confirmationUrl = `${baseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=signup&redirect_to=${encodeURIComponent(redirectTo)}`

    console.log('🔗 [SEND-CONFIRMATION] URL de confirmação construída:', {
      baseUrl,
      redirectTo,
      tokenHashLength: email_data.token_hash.length,
      fullUrl: confirmationUrl
    })

    // Template HTML simplificado
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Confirme seu email - Indexa</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333;">🎯 Bem-vindo à Indexa!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-top: 0;">Olá, ${user.user_metadata?.name || user.email}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Obrigado por se cadastrar na Indexa! Para completar seu cadastro e começar a usar nossa plataforma, 
              você precisa confirmar seu endereço de email.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" 
                 style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                ✅ Confirmar Email
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <a href="${confirmationUrl}" style="color: #007bff; word-break: break-all;">${confirmationUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; color: #888; font-size: 12px;">
            <p>Este email foi enviado automaticamente. Se você não se cadastrou na Indexa, pode ignorar este email.</p>
            <p>&copy; ${new Date().getFullYear()} Indexa - Todos os direitos reservados</p>
          </div>
        </body>
      </html>
    `

    // Tentar enviar email via Resend
    console.log('📤 [SEND-CONFIRMATION] Tentando enviar email para:', user.email)
    
    try {
      const emailResult = await resend.emails.send({
        from: 'Indexa <onboarding@resend.dev>', // Usando domínio verificado temporariamente
        to: [user.email],
        subject: '🎯 Confirme seu email na Indexa - Bem-vindo!',
        html: htmlTemplate,
      })

      console.log('📧 [SEND-CONFIRMATION] Resposta do Resend:', {
        success: !emailResult.error,
        emailId: emailResult.data?.id,
        error: emailResult.error
      })

      if (emailResult.error) {
        console.error('❌ [SEND-CONFIRMATION] Erro do Resend:', {
          message: emailResult.error.message,
          name: emailResult.error.name,
          statusCode: emailResult.error.statusCode,
          fullError: emailResult.error
        })
        
        // Retornar erro mais detalhado
        throw new Error(`Falha no envio de email: ${emailResult.error.message || 'Erro desconhecido'}`)
      }

      console.log('✅ [SEND-CONFIRMATION] Email enviado com sucesso:', {
        emailId: emailResult.data?.id,
        recipient: user.email
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email de confirmação enviado com sucesso',
          emailId: emailResult.data?.id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )

    } catch (sendError: any) {
      console.error('💥 [SEND-CONFIRMATION] Erro na tentativa de envio:', {
        message: sendError.message,
        name: sendError.name,
        stack: sendError.stack,
        type: typeof sendError
      })
      
      // CRÍTICO: Não quebrar o fluxo de cadastro
      // Retornar 200 com flag de erro para permitir que o usuário continue
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro no envio de email: ${sendError.message}`,
          user_can_continue: true,
          details: {
            errorType: sendError.name || 'UnknownError',
            timestamp: new Date().toISOString()
          }
        }),
        { 
          status: 200, // 200 para não quebrar o Auth Hook
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error: any) {
    console.error('💥 [SEND-CONFIRMATION] Erro:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})