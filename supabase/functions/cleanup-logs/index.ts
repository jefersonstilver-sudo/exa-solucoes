import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🧹 Starting log cleanup...');

    // Delete logs older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString();

    const tables = [
      { name: 'video_management_logs', retention: 7 },
      { name: 'log_eventos_sistema', retention: 30 }, // Keep system logs longer
      { name: 'financial_access_logs', retention: 90 }, // Keep financial logs for compliance
      { name: 'user_behavior_tracking', retention: 30 },
      { name: 'email_logs', retention: 30 },
      { name: 'webhook_logs', retention: 7 },
      { name: 'auth_detailed_logs', retention: 30 },
    ];

    let totalDeleted = 0;
    const results = [];

    for (const table of tables) {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - table.retention);
      
      try {
        const { error, count } = await supabase
          .from(table.name)
          .delete()
          .lt('created_at', retentionDate.toISOString());

        if (error) {
          console.error(`❌ Error deleting from ${table.name}:`, error);
          results.push({ table: table.name, deleted: 0, error: error.message });
        } else {
          const deleted = count || 0;
          totalDeleted += deleted;
          console.log(`✅ Deleted ${deleted} rows from ${table.name}`);
          results.push({ table: table.name, deleted, retention: table.retention });
        }
      } catch (err) {
        console.error(`❌ Exception deleting from ${table.name}:`, err);
        results.push({ table: table.name, deleted: 0, error: String(err) });
      }
    }

    // Log cleanup completion
    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'LOG_CLEANUP_COMPLETED',
        descricao: `Cleanup completed: ${totalDeleted} total rows deleted`,
      });

    return new Response(
      JSON.stringify({
        success: true,
        totalDeleted,
        timestamp: new Date().toISOString(),
        results,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
