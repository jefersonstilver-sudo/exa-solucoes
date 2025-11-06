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
    const redirectTo = email_data.redirect_to || 'https://indexamidia.com.br/'
    const confirmationUrl = `${baseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=signup&redirect_to=${encodeURIComponent(redirectTo)}`

    console.log('🔗 [SEND-CONFIRMATION] URL de confirmação construída:', {
      baseUrl,
      redirectTo,
      tokenHashLength: email_data.token_hash.length,
      fullUrl: confirmationUrl
    })

    // Template HTML profissional com logo EXA
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo à EXA</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
      color: #333333;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .email-wrapper {
      width: 100%;
      background-color: #f5f5f5;
      padding: 40px 20px;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    
    .header {
      background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
      padding: 56px 40px;
      text-align: center;
      border-bottom: none;
    }
    
    .brand-container {
      text-align: center;
    }
    
    .brand-logo-text {
      font-size: 56px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 12px;
      margin: 0;
      text-transform: uppercase;
      font-family: 'Inter', sans-serif;
      text-shadow: 0 2px 12px rgba(255, 255, 255, 0.3);
    }
    
    .brand-tagline {
      font-size: 13px;
      font-weight: 400;
      color: #ffffff;
      letter-spacing: 3px;
      margin: 12px 0 0 0;
      text-transform: uppercase;
      opacity: 0.95;
    }
    
    .content {
      padding: 48px 40px;
      background: #ffffff;
    }
    
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 16px;
      line-height: 1.3;
    }
    
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #4a4a4a;
      margin: 0 0 32px;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #DC2626 0%, #991b1b 100%);
      color: #ffffff !important;
      font-weight: 600;
      text-decoration: none;
      padding: 18px 56px;
      border-radius: 8px;
      font-size: 16px;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 6px 20px rgba(220, 38, 38, 0.35);
      letter-spacing: 0.3px;
    }
    
    .cta-container {
      text-align: center;
      margin: 32px 0;
    }
    
    .info-box {
      background-color: #fafafa;
      border-left: 3px solid #DC2626;
      padding: 20px 24px;
      margin: 32px 0;
      border-radius: 4px;
    }
    
    .info-box p {
      font-size: 14px;
      line-height: 1.6;
      color: #666666;
      margin: 0;
    }
    
    .info-box strong {
      color: #1a1a1a;
      font-weight: 600;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e0e0e0, transparent);
      margin: 32px 0;
    }
    
    .footer {
      background: #fafafa;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #f0f0f0;
    }
    
    .footer-text {
      font-size: 13px;
      line-height: 1.6;
      color: #999999;
      margin: 8px 0;
    }
    
    .footer-brand {
      font-size: 14px;
      font-weight: 600;
      color: #DC2626;
      margin: 16px 0 8px;
    }
    
    .footer-link {
      color: #DC2626;
      text-decoration: none;
      font-weight: 500;
    }
    
    @media screen and (max-width: 640px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      
      .header {
        padding: 40px 24px;
      }
      
      .brand-logo-text {
        font-size: 42px;
        letter-spacing: 8px;
      }
      
      .brand-tagline {
        font-size: 11px;
        letter-spacing: 2px;
      }
      
      .content {
        padding: 32px 24px;
      }
      
      .footer {
        padding: 24px;
      }
      
      .greeting {
        font-size: 22px;
      }
      
      .message {
        font-size: 15px;
      }
      
      .cta-button {
        padding: 14px 36px;
        font-size: 15px;
        display: block;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header com Logo -->
      <div class="header">
        <div class="brand-container">
          <h1 class="brand-logo-text">EXA</h1>
          <p class="brand-tagline">Publicidade Inteligente</p>
        </div>
      </div>
      
      <!-- Conteúdo Principal -->
      <div class="content">
        <h1 class="greeting">Bem-vindo à EXA, ${user.user_metadata?.name || user.email.split('@')[0]}!</h1>
        
        <p class="message">
          Estamos muito felizes em tê-lo conosco. Para começar a utilizar nossa plataforma de painéis digitais e gerenciar suas campanhas publicitárias, precisamos que você confirme seu endereço de e-mail.
        </p>
        
        <div class="cta-container">
          <a href="${confirmationUrl}" class="cta-button">Confirmar E-mail</a>
        </div>
        
        <div class="info-box">
          <p><strong>Por que confirmar seu e-mail?</strong></p>
          <p style="margin-top: 8px;">A confirmação garante a segurança da sua conta e permite que você receba notificações importantes sobre suas campanhas, além de possibilitar a recuperação de senha caso necessário.</p>
        </div>
        
        <div class="divider"></div>
        
        <p class="message" style="font-size: 14px; color: #666666; margin-bottom: 0;">
          Este link de confirmação é válido por <strong>24 horas</strong>. Caso expire, você poderá solicitar um novo através da página de login.
        </p>
      </div>
      
      <!-- Rodapé -->
      <div class="footer">
        <p class="footer-brand">EXA • Publicidade Inteligente</p>
        <p class="footer-text">
          Precisa de ajuda? Entre em contato: <a href="mailto:suporte@examidia.com.br" class="footer-link">suporte@examidia.com.br</a>
        </p>
        <p class="footer-text" style="margin-top: 16px;">
          © 2025 EXA Mídia. Todos os direitos reservados.
        </p>
        <p class="footer-text" style="font-size: 12px; color: #bbbbbb; margin-top: 12px;">
          Se você não se cadastrou na EXA, pode ignorar este e-mail com segurança.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `

    // Tentar enviar email via Resend
    console.log('📤 [SEND-CONFIRMATION] Tentando enviar email para:', user.email)
    
    try {
      const emailResult = await resend.emails.send({
        from: 'EXA <noreply@examidia.com.br>',
        to: [user.email],
        subject: '🎯 Confirme seu email na EXA - Bem-vindo!',
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