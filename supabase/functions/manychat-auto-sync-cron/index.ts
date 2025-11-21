import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[AUTO-SYNC-CRON] Starting automatic sync check...');

    // 1. Buscar todos os agentes ativos com ManyChat configurado
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('key, display_name, manychat_config, is_active')
      .eq('is_active', true)
      .not('manychat_config', 'is', null);

    if (agentsError) {
      throw new Error(`Failed to fetch agents: ${agentsError.message}`);
    }

    if (!agents || agents.length === 0) {
      console.log('[AUTO-SYNC-CRON] No active agents with ManyChat config found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No agents to sync',
          agentsChecked: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AUTO-SYNC-CRON] Found ${agents.length} active agents`);

    // 2. Filtrar agentes que precisam sincronizar
    const now = new Date();
    const agentsToSync = agents.filter(agent => {
      const config = agent.manychat_config;
      
      // Verificar se auto-sync está ativo
      if (!config?.auto_sync_enabled) {
        return false;
      }

      // Verificar se o intervalo passou
      const lastSync = config.last_sync_at ? new Date(config.last_sync_at) : new Date(0);
      const intervalMs = (config.auto_sync_interval || 5) * 60 * 1000; // Converter minutos para ms
      const timeSinceLastSync = now.getTime() - lastSync.getTime();

      const shouldSync = timeSinceLastSync >= intervalMs;
      
      console.log(`[AUTO-SYNC-CRON] ${agent.display_name}: last_sync=${lastSync.toISOString()}, interval=${config.auto_sync_interval}min, time_since=${Math.floor(timeSinceLastSync/1000)}s, should_sync=${shouldSync}`);
      
      return shouldSync;
    });

    console.log(`[AUTO-SYNC-CRON] ${agentsToSync.length} agents need sync`);

    const syncResults = [];

    // 3. Sincronizar cada agente
    for (const agent of agentsToSync) {
      console.log(`[AUTO-SYNC-CRON] Syncing ${agent.display_name}...`);
      
      try {
        // Invocar a função de sincronização existente
        const { data: syncResult, error: syncError } = await supabase.functions.invoke(
          'manychat-sync-conversations',
          {
            body: { agent_key: agent.key }
          }
        );

        if (syncError) {
          throw syncError;
        }

        // 4. Atualizar last_sync_at no agente
        const { error: updateError } = await supabase
          .from('agents')
          .update({
            manychat_config: {
              ...agent.manychat_config,
              last_sync_at: new Date().toISOString()
            }
          })
          .eq('key', agent.key);

        if (updateError) {
          console.error(`[AUTO-SYNC-CRON] Failed to update last_sync_at for ${agent.display_name}:`, updateError);
        }

        syncResults.push({
          agent: agent.display_name,
          success: true,
          result: syncResult
        });

        console.log(`✅ [AUTO-SYNC-CRON] ${agent.display_name} synced successfully`);
      } catch (error) {
        console.error(`❌ [AUTO-SYNC-CRON] Error syncing ${agent.display_name}:`, error);
        
        syncResults.push({
          agent: agent.display_name,
          success: false,
          error: error.message
        });
      }
    }

    const totalTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Auto-sync completed',
        stats: {
          agentsChecked: agents.length,
          agentsWithAutoSync: agents.filter(a => a.manychat_config?.auto_sync_enabled).length,
          agentsSynced: agentsToSync.length,
          syncResults,
          executionTimeMs: totalTime
        },
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[AUTO-SYNC-CRON] Fatal error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
