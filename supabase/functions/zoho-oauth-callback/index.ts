import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zoho OAuth Configuration
// Required scopes: ZohoMail.accounts.READ, ZohoMail.messages.READ
// Authorization URL: https://accounts.zoho.com/oauth/v2/auth
// Token URL: https://accounts.zoho.com/oauth/v2/token

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const state = url.searchParams.get('state');

    console.log('=== ZOHO OAUTH CALLBACK ===');
    console.log('Full URL:', req.url);
    console.log('Code received:', code ? 'Yes (length: ' + code.length + ')' : 'No');
    console.log('Error:', error || 'None');
    console.log('State:', state || 'None');

    if (error) {
      console.error('OAuth error from Zoho:', error);
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Erro - Zoho OAuth</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: linear-gradient(135deg, #fee2e2, #fecaca); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 500px; text-align: center; }
            h1 { color: #dc2626; margin-bottom: 16px; font-size: 24px; }
            p { color: #666; line-height: 1.6; margin: 8px 0; }
            .error-icon { font-size: 48px; margin-bottom: 16px; }
            .error-code { background: #fee2e2; padding: 12px; border-radius: 8px; font-family: monospace; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="error-icon">❌</div>
            <h1>Erro na Autorização</h1>
            <p>O Zoho retornou um erro durante a autorização.</p>
            <div class="error-code">${error}</div>
            <p style="margin-top: 20px; font-size: 14px; color: #999;">Verifique as configurações no Zoho API Console.</p>
          </div>
        </body>
        </html>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    if (!code) {
      console.error('No authorization code received');
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Erro - Código Ausente</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: linear-gradient(135deg, #fef3c7, #fde68a); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 500px; text-align: center; }
            h1 { color: #d97706; margin-bottom: 16px; font-size: 24px; }
            p { color: #666; line-height: 1.6; }
            .icon { font-size: 48px; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⚠️</div>
            <h1>Código de Autorização Ausente</h1>
            <p>Nenhum código de autorização foi recebido do Zoho.</p>
            <p style="margin-top: 20px; font-size: 14px; color: #999;">Tente autorizar novamente.</p>
          </div>
        </body>
        </html>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    console.log('Authorization code received, exchanging for tokens...');

    const clientId = Deno.env.get('ZOHO_CLIENT_ID');
    const clientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');
    const redirectUri = 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/zoho-oauth-callback';

    console.log('Client ID configured:', clientId ? 'Yes' : 'No');
    console.log('Client Secret configured:', clientSecret ? 'Yes' : 'No');
    console.log('Redirect URI:', redirectUri);

    if (!clientId || !clientSecret) {
      console.error('Missing Zoho credentials in environment');
      throw new Error('Zoho credentials not configured');
    }

    // Exchange authorization code for tokens
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: code,
    });

    console.log('Calling Zoho token endpoint...');
    
    const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody,
    });

    const tokenData = await tokenResponse.json();
    console.log('Token response status:', tokenResponse.status);
    console.log('Token response:', JSON.stringify(tokenData, null, 2));

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData);
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Erro - Token</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: linear-gradient(135deg, #fee2e2, #fecaca); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 600px; text-align: center; }
            h1 { color: #dc2626; margin-bottom: 16px; font-size: 24px; }
            p { color: #666; line-height: 1.6; }
            .icon { font-size: 48px; margin-bottom: 16px; }
            pre { background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: left; overflow-x: auto; font-size: 12px; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">❌</div>
            <h1>Erro ao Obter Tokens</h1>
            <p>Falha na troca do código por tokens de acesso.</p>
            <pre>${JSON.stringify(tokenData, null, 2)}</pre>
          </div>
        </body>
        </html>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Get Zoho Mail account info
    let accountId = null;
    let accountEmail = null;
    
    try {
      console.log('Fetching Zoho Mail account info...');
      const accountResponse = await fetch('https://mail.zoho.com/api/accounts', {
        headers: {
          'Authorization': `Zoho-oauthtoken ${tokenData.access_token}`,
        },
      });
      const accountData = await accountResponse.json();
      console.log('Account response:', JSON.stringify(accountData, null, 2));
      
      if (accountData.data && accountData.data.length > 0) {
        accountId = accountData.data[0].accountId;
        accountEmail = accountData.data[0].emailAddress?.address || accountData.data[0].primaryEmailAddress;
        console.log('Account ID:', accountId);
        console.log('Account Email:', accountEmail);
      }
    } catch (e) {
      console.error('Error fetching account info:', e);
    }

    // Save tokens to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

    console.log('Saving tokens to database...');

    // Check if config exists
    const { data: existingConfig } = await supabase
      .from('zoho_email_config')
      .select('id')
      .limit(1)
      .single();

    let saveResult;
    if (existingConfig) {
      // Update existing config
      saveResult = await supabase
        .from('zoho_email_config')
        .update({
          account_id: accountId,
          account_email: accountEmail,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || existingConfig.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          is_active: true,
          last_checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConfig.id);
    } else {
      // Insert new config
      saveResult = await supabase
        .from('zoho_email_config')
        .insert({
          account_id: accountId,
          account_email: accountEmail,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          is_active: true,
          last_checked_at: new Date().toISOString(),
        });
    }

    if (saveResult.error) {
      console.error('Error saving to database:', saveResult.error);
      throw new Error('Failed to save tokens to database');
    }

    console.log('✅ Zoho credentials saved successfully!');

    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sucesso - Zoho Conectado</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: linear-gradient(135deg, #d1fae5, #a7f3d0); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
          .card { background: white; padding: 48px; border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); max-width: 500px; text-align: center; }
          h1 { color: #059669; margin-bottom: 16px; font-size: 28px; font-weight: 600; }
          p { color: #666; line-height: 1.8; margin: 8px 0; }
          .success-icon { font-size: 64px; margin-bottom: 20px; animation: bounce 0.6s ease-in-out; }
          @keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
          .info { background: #f0fdf4; padding: 16px; border-radius: 12px; margin-top: 24px; text-align: left; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #6b7280; font-size: 14px; }
          .info-value { color: #111; font-weight: 500; font-size: 14px; }
          .close-btn { margin-top: 24px; padding: 12px 32px; background: #059669; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 500; cursor: pointer; }
          .close-btn:hover { background: #047857; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="success-icon">✅</div>
          <h1>Conexão Estabelecida!</h1>
          <p>Sua conta Zoho Mail foi conectada com sucesso.</p>
          <p>O sistema agora está monitorando seus emails automaticamente.</p>
          
          <div class="info">
            <div class="info-row">
              <span class="info-label">Account ID</span>
              <span class="info-value">${accountId || 'Detectando...'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">${accountEmail || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Token expira em</span>
              <span class="info-value">${tokenData.expires_in ? Math.round(tokenData.expires_in / 60) + ' minutos' : '1 hora'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Refresh Token</span>
              <span class="info-value">${tokenData.refresh_token ? '✅ Salvo' : '⚠️ Não recebido'}</span>
            </div>
          </div>
          
          <button class="close-btn" onclick="window.close()">Fechar Janela</button>
        </div>
      </body>
      </html>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('Error in zoho-oauth-callback:', error);
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Erro Interno</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: linear-gradient(135deg, #fee2e2, #fecaca); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
          .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 500px; text-align: center; }
          h1 { color: #dc2626; margin-bottom: 16px; font-size: 24px; }
          p { color: #666; line-height: 1.6; }
          .icon { font-size: 48px; margin-bottom: 16px; }
          .error-msg { background: #fee2e2; padding: 12px; border-radius: 8px; font-family: monospace; margin-top: 16px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">💥</div>
          <h1>Erro Interno</h1>
          <p>Ocorreu um erro ao processar a autorização.</p>
          <div class="error-msg">${error.message}</div>
        </div>
      </body>
      </html>`,
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  }
});
