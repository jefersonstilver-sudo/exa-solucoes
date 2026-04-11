import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const timestamp = new Date().toISOString();
  
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`🏥 [SOFIA-HEALTH] REQUEST ${requestId}`);
  console.log(`🏥 [SOFIA-HEALTH] Time: ${timestamp}`);
  console.log('════════════════════════════════════════════════════════════════\n');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const results: Record<string, any> = {
    timestamp,
    request_id: requestId,
    checks: {},
    overall_status: 'healthy',
  };

  // 1. Check Supabase connection
  console.log('🏥 [HEALTH] Checking Supabase connection...');
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      results.checks.supabase = { status: 'error', message: 'Missing credentials' };
      results.overall_status = 'unhealthy';
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { count, error } = await supabase
        .from('sofia_admin_sessions')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        results.checks.supabase = { status: 'error', message: error.message };
        results.overall_status = 'unhealthy';
      } else {
        results.checks.supabase = { 
          status: 'ok', 
          message: 'Connected successfully',
          sessions_table_accessible: true
        };
      }
      
      // Check for active sessions
      const { data: activeSessions } = await supabase
        .from('sofia_admin_sessions')
        .select('id, user_phone, session_expires_at')
        .eq('session_active', true)
        .gte('session_expires_at', new Date().toISOString());
      
      results.checks.active_sessions = {
        count: activeSessions?.length || 0,
        sessions: activeSessions?.map(s => ({
          id: s.id,
          user: s.user_phone,
          expires: s.session_expires_at
        })) || []
      };
    }
  } catch (e) {
    console.error('🏥 [HEALTH] Supabase check failed:', e);
    results.checks.supabase = { status: 'error', message: e.message };
    results.overall_status = 'unhealthy';
  }

  // 2. Check ElevenLabs connection
  console.log('🏥 [HEALTH] Checking ElevenLabs connection...');
  try {
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    const agentId = Deno.env.get('ELEVENLABS_AGENT_ID');
    
    if (!apiKey) {
      results.checks.elevenlabs = { status: 'error', message: 'ELEVENLABS_API_KEY missing' };
      results.overall_status = 'unhealthy';
    } else if (!agentId) {
      results.checks.elevenlabs = { status: 'warning', message: 'ELEVENLABS_AGENT_ID missing' };
    } else {
      // Test connection by fetching agent info
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        headers: { 'xi-api-key': apiKey }
      });
      
      if (response.ok) {
        const agent = await response.json();
        const tools = agent?.conversation_config?.agent?.prompt?.tools || [];
        const toolNames = tools.map((t: any) => t.name || t.tool_config?.name).filter(Boolean);
        
        const hasAdminAuth = toolNames.includes('admin_auth');
        const hasConsultarSistema = toolNames.includes('consultar_sistema');
        
        results.checks.elevenlabs = {
          status: 'ok',
          agent_name: agent?.name || 'unknown',
          agent_id: agentId,
          language: agent?.conversation_config?.agent?.language || 'unknown',
          tools: {
            total: toolNames.length,
            names: toolNames,
            admin_auth: hasAdminAuth ? 'configured' : 'MISSING',
            consultar_sistema: hasConsultarSistema ? 'configured' : 'MISSING'
          }
        };
        
        if (!hasAdminAuth || !hasConsultarSistema) {
          results.checks.elevenlabs.warning = 'Agent missing required tools';
          results.overall_status = results.overall_status === 'healthy' ? 'degraded' : results.overall_status;
        }
      } else {
        const errorText = await response.text();
        results.checks.elevenlabs = { 
          status: 'error', 
          message: `API error: ${response.status}`,
          details: errorText
        };
        results.overall_status = 'unhealthy';
      }
    }
  } catch (e) {
    console.error('🏥 [HEALTH] ElevenLabs check failed:', e);
    results.checks.elevenlabs = { status: 'error', message: e.message };
    results.overall_status = 'unhealthy';
  }

  // 3. Check Z-API configuration
  console.log('🏥 [HEALTH] Checking Z-API configuration...');
  try {
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
    
    if (!zapiClientToken) {
      results.checks.zapi = { status: 'error', message: 'ZAPI_CLIENT_TOKEN missing' };
      results.overall_status = 'unhealthy';
    } else {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const supabase = createClient(supabaseUrl!, supabaseKey!);
      
      const { data: agent, error } = await supabase
        .from('agents')
        .select('zapi_config')
        .eq('key', 'exa_alert')
        .single();
      
      if (error || !agent?.zapi_config) {
        results.checks.zapi = { 
          status: 'warning', 
          message: 'exa_alert agent or zapi_config not found',
          client_token: 'configured'
        };
      } else {
        const config = agent.zapi_config as { instance_id: string; token: string };
        results.checks.zapi = {
          status: 'ok',
          client_token: 'configured',
          instance_id: config.instance_id ? 'configured' : 'missing',
          instance_token: config.token ? 'configured' : 'missing'
        };
      }
    }
  } catch (e) {
    console.error('🏥 [HEALTH] Z-API check failed:', e);
    results.checks.zapi = { status: 'error', message: e.message };
  }

  // 4. Check admin directors
  console.log('🏥 [HEALTH] Checking admin directors...');
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    
    const { data: directors, error } = await supabase
      .from('exa_alerts_directors')
      .select('nome, telefone, ativo')
      .eq('ativo', true)
      .limit(5);
    
    if (error) {
      results.checks.directors = { status: 'error', message: error.message };
    } else {
      results.checks.directors = {
        status: directors && directors.length > 0 ? 'ok' : 'warning',
        active_count: directors?.length || 0,
        directors: directors?.map(d => ({
          name: d.nome,
          phone_configured: !!d.telefone
        })) || []
      };
      
      if (!directors || directors.length === 0) {
        results.checks.directors.warning = 'No active directors configured - 2FA codes cannot be sent';
        results.overall_status = results.overall_status === 'healthy' ? 'degraded' : results.overall_status;
      }
    }
  } catch (e) {
    console.error('🏥 [HEALTH] Directors check failed:', e);
    results.checks.directors = { status: 'error', message: e.message };
  }

  // Summary
  console.log('\n🏥 [HEALTH] Summary:');
  console.log(JSON.stringify(results, null, 2));

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: results.overall_status === 'unhealthy' ? 503 : 200
  });
});
