import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('⚙️ [CRON SETUP] Configurando monitoramento automático...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // SQL para criar os cron jobs
    const cronSQL = `
      -- Remover jobs existentes se houver
      SELECT cron.unschedule('sync-anydesk-monitor');
      SELECT cron.unschedule('monitor-panels-check');

      -- Job 1: Sincronizar AnyDesk a cada 1 minuto
      SELECT cron.schedule(
        'sync-anydesk-monitor',
        '* * * * *',
        $$
        SELECT net.http_post(
          url := '${supabaseUrl}/functions/v1/sync-anydesk',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ${supabaseKey}'
          ),
          body := jsonb_build_object('triggered_by', 'cron', 'timestamp', now())
        ) as request_id;
        $$
      );

      -- Job 2: Monitorar painéis a cada 1 minuto
      SELECT cron.schedule(
        'monitor-panels-check',
        '* * * * *',
        $$
        SELECT net.http_post(
          url := '${supabaseUrl}/functions/v1/monitor-panels',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ${supabaseKey}'
          ),
          body := jsonb_build_object('triggered_by', 'cron', 'timestamp', now())
        ) as request_id;
        $$
      );
    `;

    console.log('📝 [CRON SETUP] Executando SQL para criar jobs...');
    
    // Executar SQL (precisa de permissões de superuser)
    // Como não podemos executar SQL direto, retornamos o SQL para ser executado manualmente
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Para ativar o monitoramento 24/7, execute o SQL abaixo no Supabase SQL Editor',
        sql: cronSQL,
        instructions: [
          '1. Acesse o Supabase Dashboard',
          '2. Vá em SQL Editor',
          '3. Cole e execute o SQL fornecido',
          '4. Verifique os logs em Database > Cron Jobs'
        ],
        note: 'Os jobs rodarão automaticamente a cada 1 minuto após a configuração'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ [CRON SETUP] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});