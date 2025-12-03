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

      // Update proposal counters
      const { data: proposal } = await supabase
        .from('proposals')
        .select('view_count, first_viewed_at')
        .eq('id', proposalId)
        .single();

      const updates: any = {
        view_count: (proposal?.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString(),
      };

      if (!proposal?.first_viewed_at) {
        updates.first_viewed_at = new Date().toISOString();
      }

      await supabase
        .from('proposals')
        .update(updates)
        .eq('id', proposalId);

      console.log('✅ View registered');

    } else if (action === 'leave' && timeSpentSeconds > 0) {
      // Update time spent on the most recent view
      const { data: recentView } = await supabase
        .from('proposal_views')
        .select('id')
        .eq('proposal_id', proposalId)
        .order('viewed_at', { ascending: false })
        .limit(1)
        .single();

      if (recentView) {
        await supabase
          .from('proposal_views')
          .update({ time_spent_seconds: timeSpentSeconds })
          .eq('id', recentView.id);
      }

      // Update total time in proposals
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

      console.log(`✅ Time updated: ${timeSpentSeconds}s`);
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
