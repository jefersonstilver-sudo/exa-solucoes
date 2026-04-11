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
    console.log('[CHECK-CONNECTION] 🔍 Starting connection check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const licenseId = Deno.env.get('ANYDESK_LICENSE_ID');
    const apiPassword = Deno.env.get('ANYDESK_API_PASSWORD');

    if (!licenseId || !apiPassword) {
      throw new Error('AnyDesk credentials not configured');
    }

    // Gerar token de autenticação AnyDesk (formato correto)
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const resource = '/clients';
    const method = 'GET';
    const content = '';
    
    // Calcular content hash (SHA1 do body em base64)
    const encoder = new TextEncoder();
    const contentData = encoder.encode(content);
    const contentHashBuffer = await crypto.subtle.digest('SHA-1', contentData);
    const contentHash = btoa(String.fromCharCode(...new Uint8Array(contentHashBuffer)));
    
    // Criar request string: METHOD\n/resource\nTIMESTAMP\nCONTENT_HASH
    const requestString = `${method}\n${resource}\n${timestamp}\n${contentHash}`;
    
    // Gerar HMAC-SHA1 token
    const keyData = encoder.encode(apiPassword);
    const messageData = encoder.encode(requestString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const token = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    // Criar header de autenticação: AD LICENSE:TIMESTAMP:TOKEN
    const authHeader = `AD ${licenseId}:${timestamp}:${token}`;

    // Buscar clientes do AnyDesk (URL correta)
    const anydeskUrl = `https://v1.api.anydesk.com:8081/clients`;
    const response = await fetch(anydeskUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`AnyDesk API error: ${response.status}`);
    }

    const anydeskData = await response.json();
    const apiClients = anydeskData.list || [];
    const apiClientIds = new Set(apiClients.map((c: any) => c.cid));

    console.log(`[CHECK-CONNECTION] 📋 Found ${apiClients.length} clients in API`);

    // Buscar dispositivos do banco
    const { data: dbDevices } = await supabase
      .from('devices')
      .select('*');

    const dbClientIds = new Set(dbDevices?.map(d => d.anydesk_client_id) || []);

    console.log(`[CHECK-CONNECTION] 💾 Found ${dbDevices?.length || 0} devices in database`);

    // Comparar
    const missingInDb = Array.from(apiClientIds).filter(id => !dbClientIds.has(id));
    const missingInApi = Array.from(dbClientIds).filter(id => !apiClientIds.has(id));
    const onlineCount = apiClients.filter((c: any) => c.online).length;
    const offlineCount = apiClients.length - onlineCount;

    const hasIssues = missingInDb.length > 0 || missingInApi.length > 0;

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      hasIssues,
      message: hasIssues 
        ? `Found ${missingInDb.length + missingInApi.length} discrepancies between API and database`
        : 'All devices are in sync',
      summary: {
        api_total: apiClients.length,
        api_online: onlineCount,
        api_offline: offlineCount,
        db_total: dbDevices?.length || 0,
        missing_in_db: missingInDb.length,
        missing_in_api: missingInApi.length,
      },
      details: {
        missing_in_db: missingInDb,
        missing_in_api: missingInApi,
      },
    };

    console.log('[CHECK-CONNECTION] ✅ Check completed:', result.summary);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[CHECK-CONNECTION] 💥 Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});