import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RelatorioConfig {
  ativo: boolean;
  time: string;
  selectedDays: string[];
  selectedDirectors: string[];
  sections: {
    tarefas_hoje: boolean;
    tarefas_sem_agendamento: boolean;
    predios_sem_agendamento: boolean;
    propostas: boolean;
    status_paineis: boolean;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[relatorio-operacional-scheduled] Verificando agendamento...');

    // Get config
    const { data: configData, error: configError } = await supabase
      .from('exa_alerts_config')
      .select('config_value')
      .eq('config_key', 'relatorio_operacional')
      .single();

    if (configError && configError.code !== 'PGRST116') {
      console.log('[relatorio-operacional-scheduled] Config not found');
      return new Response(JSON.stringify({ triggered: false, reason: 'no_config' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const config = configData?.config_value as RelatorioConfig;

    if (!config || !config.ativo) {
      console.log('[relatorio-operacional-scheduled] Report disabled');
      return new Response(JSON.stringify({ triggered: false, reason: 'disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check current time (Brazil timezone)
    const now = new Date();
    const brazilTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const currentHour = brazilTime.getHours().toString().padStart(2, '0');
    const currentMinute = brazilTime.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;

    // Check day of week
    const dayMap: Record<number, string> = {
      0: 'dom',
      1: 'seg',
      2: 'ter',
      3: 'qua',
      4: 'qui',
      5: 'sex',
      6: 'sab'
    };
    const currentDay = dayMap[brazilTime.getDay()];

    console.log(`[relatorio-operacional-scheduled] Current: ${currentTime} (${currentDay}), Configured: ${config.time}`);

    // Check if it's time to send
    if (currentTime !== config.time) {
      return new Response(JSON.stringify({ 
        triggered: false, 
        reason: 'not_time',
        current: currentTime,
        configured: config.time
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if today is a selected day
    if (!config.selectedDays.includes(currentDay)) {
      console.log(`[relatorio-operacional-scheduled] Day ${currentDay} not in selected days`);
      return new Response(JSON.stringify({ 
        triggered: false, 
        reason: 'day_not_selected',
        currentDay,
        selectedDays: config.selectedDays
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if already sent today (prevent duplicate sends)
    const todayStart = new Date(brazilTime);
    todayStart.setHours(0, 0, 0, 0);
    
    const { data: recentSends } = await supabase
      .from('exa_alerts_history')
      .select('id')
      .eq('tipo', 'relatorio_operacional')
      .gte('created_at', todayStart.toISOString())
      .limit(1);

    if (recentSends && recentSends.length > 0) {
      console.log('[relatorio-operacional-scheduled] Already sent today');
      return new Response(JSON.stringify({ 
        triggered: false, 
        reason: 'already_sent_today'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[relatorio-operacional-scheduled] Time matches! Triggering report...');

    // Trigger the report generation
    const { data: result, error: invokeError } = await supabase.functions.invoke(
      'relatorio-operacional-generate',
      {
        body: { sendNow: false }
      }
    );

    if (invokeError) {
      console.error('[relatorio-operacional-scheduled] Error invoking generate:', invokeError);
      return new Response(JSON.stringify({ 
        triggered: false, 
        error: invokeError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    console.log('[relatorio-operacional-scheduled] Report triggered successfully:', result);

    return new Response(JSON.stringify({ 
      triggered: true, 
      result 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[relatorio-operacional-scheduled] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
