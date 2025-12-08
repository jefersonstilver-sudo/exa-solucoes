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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return new Response(
        `<html><body><h1>Erro na autorização</h1><p>${error}</p></body></html>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    if (!code) {
      return new Response(
        '<html><body><h1>Código de autorização não encontrado</h1></body></html>',
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    console.log('Received authorization code, exchanging for tokens...');

    const clientId = Deno.env.get('ZOHO_CLIENT_ID');
    const clientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');
    const redirectUri = 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/zoho-oauth-callback';

    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Token response:', JSON.stringify(tokenData, null, 2));

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData);
      return new Response(
        `<html><body><h1>Erro ao obter tokens</h1><pre>${JSON.stringify(tokenData, null, 2)}</pre></body></html>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Get account info
    let accountId = null;
    try {
      const accountResponse = await fetch('https://mail.zoho.com/api/accounts', {
        headers: {
          'Authorization': `Zoho-oauthtoken ${tokenData.access_token}`,
        },
      });
      const accountData = await accountResponse.json();
      console.log('Account data:', JSON.stringify(accountData, null, 2));
      
      if (accountData.data && accountData.data.length > 0) {
        accountId = accountData.data[0].accountId;
      }
    } catch (e) {
      console.error('Error fetching account info:', e);
    }

    // Save to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

    // Check if config exists
    const { data: existingConfig } = await supabase
      .from('zoho_email_config')
      .select('id')
      .limit(1)
      .single();

    if (existingConfig) {
      // Update existing config
      await supabase
        .from('zoho_email_config')
        .update({
          account_id: accountId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConfig.id);
    } else {
      // Insert new config
      await supabase
        .from('zoho_email_config')
        .insert({
          account_id: accountId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          is_active: true,
        });
    }

    console.log('Zoho credentials saved successfully');

    return new Response(
      `<html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: linear-gradient(135deg, #f5f5f5, #e0e0e0); }
            .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
            h1 { color: #22c55e; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
            .success-icon { font-size: 48px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="success-icon">✅</div>
            <h1>Conexão Zoho Estabelecida!</h1>
            <p>Sua conta Zoho Mail foi conectada com sucesso.</p>
            <p>O sistema agora está monitorando seus emails automaticamente.</p>
            <p><strong>Account ID:</strong> ${accountId || 'Detectando...'}</p>
            <p>Você pode fechar esta janela.</p>
          </div>
        </body>
      </html>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('Error in zoho-oauth-callback:', error);
    return new Response(
      `<html><body><h1>Erro</h1><pre>${error.message}</pre></body></html>`,
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  }
});
