import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { proposalId, timeSpentSeconds, deviceType, userAgent, action } = await req.json();

    console.log(`📊 [TRACK-VIEW] Action: ${action}, Proposal: ${proposalId}, Time: ${timeSpentSeconds}s`);

    if (!proposalId) {
      return new Response(JSON.stringify({ error: 'proposalId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'enter') {
      // Register new view
      const { error: insertError } = await supabase
        .from('proposal_views')
        .insert({
          proposal_id: proposalId,
          device_type: deviceType || 'unknown',
          user_agent: userAgent || null,
          time_spent_seconds: 0,
        });

      if (insertError) {
        console.error('❌ Error inserting view:', insertError);
      }

      // Update proposal counters AND status
      const { data: proposal } = await supabase
        .from('proposals')
        .select('view_count, first_viewed_at, status')
        .eq('id', proposalId)
        .single();

      const updates: any = {
        view_count: (proposal?.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString(),
      };

      // Se primeira visualização, atualizar first_viewed_at
      if (!proposal?.first_viewed_at) {
        updates.first_viewed_at = new Date().toISOString();
      }

      // ✅ NOVO: Atualizar status para 'visualizada' se ainda for 'enviada'
      if (proposal?.status === 'enviada') {
        updates.status = 'visualizada';
        console.log('📊 Status atualizado: enviada → visualizada');
        
        // Registrar log de visualização
        await supabase.from('proposal_logs').insert({
          proposal_id: proposalId,
          action: 'visualizada',
          details: {
            device_type: deviceType,
            timestamp: new Date().toISOString()
          }
        });
      }

      await supabase
        .from('proposals')
        .update(updates)
        .eq('id', proposalId);

      console.log('✅ View registered, view_count:', updates.view_count);

    } else if (action === 'heartbeat' && timeSpentSeconds > 0) {
      // Heartbeat: update time incrementally (works on mobile!)
      const { data: proposal } = await supabase
        .from('proposals')
        .select('total_time_spent_seconds')
        .eq('id', proposalId)
        .single();

      const newTotalTime = (proposal?.total_time_spent_seconds || 0) + timeSpentSeconds;

      await supabase
        .from('proposals')
        .update({
          total_time_spent_seconds: newTotalTime,
          last_viewed_at: new Date().toISOString(),
        })
        .eq('id', proposalId);

      // Also update the most recent view record
      const { data: recentView } = await supabase
        .from('proposal_views')
        .select('id, time_spent_seconds')
        .eq('proposal_id', proposalId)
        .order('viewed_at', { ascending: false })
        .limit(1)
        .single();

      if (recentView) {
        await supabase
          .from('proposal_views')
          .update({ 
            time_spent_seconds: (recentView.time_spent_seconds || 0) + timeSpentSeconds 
          })
          .eq('id', recentView.id);
      }

      console.log(`✅ Heartbeat: +${timeSpentSeconds}s (total: ${newTotalTime}s)`);
      
    } else if (action === 'leave' && timeSpentSeconds > 0) {
      // Legacy leave action (fallback)
      const { data: proposal } = await supabase
        .from('proposals')
        .select('total_time_spent_seconds')
        .eq('id', proposalId)
        .single();

      await supabase
        .from('proposals')
        .update({
          total_time_spent_seconds: (proposal?.total_time_spent_seconds || 0) + timeSpentSeconds,
        })
        .eq('id', proposalId);

      console.log(`✅ Leave time: ${timeSpentSeconds}s`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('💥 Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
