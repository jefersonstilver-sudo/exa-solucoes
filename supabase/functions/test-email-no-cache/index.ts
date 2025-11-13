import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Publicidade%20Inteligente%20(800%20x%20800%20px).png';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      throw new Error('Email é obrigatório');
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }

    const resend = new Resend(resendKey);
    const timestamp = new Date().toISOString();
    
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🧪 Email de Teste - ${timestamp}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
      color: #333333;
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
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #7D1818 0%, #9C1E1E 100%);
      padding: 50px 40px;
      text-align: center;
    }
    
    .header-logo {
      max-width: 220px;
      height: auto;
      display: block;
      margin: 0 auto 20px auto;
    }
    
    .header-title {
      font-size: 32px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 10px 0;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
    
    .header-subtitle {
      font-size: 16px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.95);
      margin: 0;
    }
    
    .content {
      padding: 48px 40px;
      background: #ffffff;
    }
    
    .test-badge {
      background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 18px;
      margin-bottom: 24px;
      text-align: center;
    }
    
    .timestamp {
      background: #f0f0f0;
      padding: 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      margin: 24px 0;
    }
    
    .success-indicator {
      background: linear-gradient(135deg, #00D084 0%, #00B574 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
    }
    
    .footer {
      background: #fafafa;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #f0f0f0;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="header">
        <img src="${EXA_LOGO_URL}" alt="EXA Mídia" class="header-logo" />
        <h1 class="header-title">🧪 Email de Teste</h1>
        <p class="header-subtitle">Verificação de Cache e Template</p>
      </div>
      
      <div class="content">
        <div class="test-badge">
          ✅ EMAIL GERADO COM SUCESSO
        </div>
        
        <h2 style="color: #7D1818; margin-bottom: 16px;">Teste de Template Moderno</h2>
        
        <p style="font-size: 16px; line-height: 1.7; color: #4a4a4a; margin-bottom: 20px;">
          Se você está vendo este email com:
        </p>
        
        <ul style="margin: 0 0 24px 24px; color: #4a4a4a;">
          <li style="margin-bottom: 8px;">✅ Header com gradiente vermelho (#7D1818 → #9C1E1E)</li>
          <li style="margin-bottom: 8px;">✅ Logo da EXA</li>
          <li style="margin-bottom: 8px;">✅ Fonte Inter moderna</li>
          <li style="margin-bottom: 8px;">✅ Badge laranja com gradiente</li>
        </ul>
        
        <div class="success-indicator">
          🎉 O SISTEMA ESTÁ FUNCIONANDO PERFEITAMENTE!
        </div>
        
        <p style="font-size: 16px; line-height: 1.7; color: #4a4a4a; margin-bottom: 20px;">
          Este email foi gerado em tempo real, sem cache, com o template moderno inline.
        </p>
        
        <div class="timestamp">
          <strong>Timestamp de Geração:</strong><br>
          ${timestamp}<br><br>
          <strong>Versão:</strong> INLINE-TEMPLATE-V2<br>
          <strong>Status:</strong> SEM CACHE ✅
        </div>
      </div>
      
      <div class="footer">
        <p style="font-size: 14px; color: #999999;">
          EXA Mídia • Email de Teste Técnico
        </p>
        <p style="font-size: 12px; color: #bbbbbb; margin-top: 8px;">
          ${timestamp}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    console.log('📧 [TEST-EMAIL] Enviando email de teste para:', email);
    console.log('🕐 [TEST-EMAIL] Timestamp:', timestamp);
    console.log('📏 [TEST-EMAIL] Tamanho do HTML:', html.length, 'chars');
    
    const result = await resend.emails.send({
      from: 'EXA <noreply@examidia.com.br>',
      to: [email],
      subject: `🧪 TESTE ${timestamp.substring(11, 19)} - Verificação de Template`,
      html,
    });

    console.log('✅ [TEST-EMAIL] Email enviado - ID:', result.data?.id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email de teste enviado',
      email_id: result.data?.id,
      timestamp: timestamp,
      html_size: html.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('❌ [TEST-EMAIL] Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
