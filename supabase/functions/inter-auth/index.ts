/**
 * Edge Function: inter-auth
 * 
 * Endpoint para autenticação e health check da conexão com Banco Inter
 * Valida certificados e retorna status da conexão
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getInterToken, getInterSaldo } from "../_shared/inter-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🏦 [inter-auth] Testing Banco Inter connection...');

    // Verificar se as credenciais existem
    const clientId = Deno.env.get('INTER_CLIENT_ID');
    const clientSecret = Deno.env.get('INTER_CLIENT_SECRET');
    const certBase64 = Deno.env.get('INTER_CERTIFICATE_BASE64');
    const keyBase64 = Deno.env.get('INTER_PRIVATE_KEY_BASE64');
    const pixKey = Deno.env.get('INTER_PIX_KEY');
    const contaCorrente = Deno.env.get('INTER_CONTA_CORRENTE');

    const missingCredentials: string[] = [];
    if (!clientId) missingCredentials.push('INTER_CLIENT_ID');
    if (!clientSecret) missingCredentials.push('INTER_CLIENT_SECRET');
    if (!certBase64) missingCredentials.push('INTER_CERTIFICATE_BASE64');
    if (!keyBase64) missingCredentials.push('INTER_PRIVATE_KEY_BASE64');
    if (!pixKey) missingCredentials.push('INTER_PIX_KEY');
    if (!contaCorrente) missingCredentials.push('INTER_CONTA_CORRENTE');

    if (missingCredentials.length > 0) {
      console.error('❌ [inter-auth] Missing credentials:', missingCredentials);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing credentials',
          missingCredentials,
          message: 'Configure as credenciais do Banco Inter nas secrets do Supabase'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Testar autenticação OAuth2
    console.log('🔐 [inter-auth] Testing OAuth2 authentication...');
    const startAuth = Date.now();
    const token = await getInterToken();
    const authTime = Date.now() - startAuth;

    if (!token) {
      throw new Error('Failed to obtain access token');
    }

    console.log(`✅ [inter-auth] OAuth2 authentication successful (${authTime}ms)`);

    // Testar acesso à API de saldo (opcional, para validar escopo)
    let saldoTest = null;
    let saldoTime = 0;
    
    try {
      console.log('💰 [inter-auth] Testing Banking API access...');
      const startSaldo = Date.now();
      saldoTest = await getInterSaldo();
      saldoTime = Date.now() - startSaldo;
      console.log(`✅ [inter-auth] Banking API access successful (${saldoTime}ms)`);
    } catch (saldoError) {
      console.warn('⚠️ [inter-auth] Banking API test failed:', saldoError.message);
      // Não falhar se só o saldo não funcionar - pode ser permissão
    }

    const response = {
      success: true,
      message: 'Conexão com Banco Inter estabelecida com sucesso',
      connection: {
        status: 'connected',
        authenticatedAt: new Date().toISOString(),
        authResponseTimeMs: authTime,
      },
      credentials: {
        clientId: clientId ? `${clientId.substring(0, 8)}...` : null,
        pixKey: pixKey ? `${pixKey.substring(0, 10)}...` : null,
        contaCorrente: contaCorrente ? `***${contaCorrente.slice(-4)}` : null,
        certificatePresent: !!certBase64,
        privateKeyPresent: !!keyBase64,
      },
      bankingApi: saldoTest ? {
        status: 'available',
        responseTimeMs: saldoTime,
        saldoDisponivel: saldoTest.disponivel,
      } : {
        status: 'not_tested',
        message: 'Banking API not tested or permission denied'
      }
    };

    console.log('🎉 [inter-auth] Health check completed successfully');

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ [inter-auth] Connection test failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
        message: 'Falha ao conectar com Banco Inter. Verifique as credenciais e certificados.',
        troubleshooting: [
          'Verifique se o Client ID e Secret estão corretos',
          'Verifique se o certificado (.cer) está em formato Base64 válido',
          'Verifique se a chave privada (.key) está em formato Base64 válido',
          'Confirme que o certificado não expirou',
          'Verifique se a conta Inter Empresas está ativa',
        ]
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
