import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instanceId } = await req.json();
    
    if (!instanceId) {
      throw new Error('instanceId is required');
    }

    console.log(`[CHECK-STATUS] Verificando status da instância: ${instanceId}`);

    // Buscar configuração da instância
    const ZAPI_CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN');
    
    if (!ZAPI_CLIENT_TOKEN) {
      throw new Error('ZAPI_CLIENT_TOKEN not configured');
    }

    // 1. Verificar status de conexão da instância
    const statusUrl = `https://api.z-api.io/instances/${instanceId}/token/${ZAPI_CLIENT_TOKEN}/status`;
    console.log(`[CHECK-STATUS] Chamando: ${statusUrl}`);
    
    const statusResponse = await fetch(statusUrl);
    const statusData = await statusResponse.json();
    
    console.log(`[CHECK-STATUS] Status response:`, statusData);

    // 2. Verificar webhook configurado
    const webhookUrl = `https://api.z-api.io/instances/${instanceId}/token/${ZAPI_CLIENT_TOKEN}/webhook`;
    const webhookResponse = await fetch(webhookUrl);
    const webhookData = await webhookResponse.json();
    
    console.log(`[CHECK-STATUS] Webhook config:`, webhookData);

    // 3. Verificar QR Code (se necessário reconectar)
    let qrCode = null;
    if (!statusData.connected) {
      const qrUrl = `https://api.z-api.io/instances/${instanceId}/token/${ZAPI_CLIENT_TOKEN}/qr-code/image`;
      const qrResponse = await fetch(qrUrl);
      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        qrCode = qrData.value;
      }
    }

    const result = {
      success: true,
      instance_id: instanceId,
      status: {
        connected: statusData.connected || false,
        phone: statusData.phone || null,
        state: statusData.state || 'unknown',
      },
      webhook: {
        url: webhookData.value || null,
        enabled: webhookData.enabled || false,
      },
      qr_code: qrCode,
      timestamp: new Date().toISOString(),
    };

    console.log(`[CHECK-STATUS] ✅ Resultado:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[CHECK-STATUS] ❌ Erro:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
