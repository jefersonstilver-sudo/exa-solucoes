// ============================================
// EDGE FUNCTION: relatorio-var-scheduled
// Executado via CRON para envio programado
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🕐 [VAR SCHEDULED] Verificando relatórios programados...');

    // Buscar configuração do relatório
    const { data: config, error: configError } = await supabase
      .from('exa_alerts_config')
      .select('*')
      .eq('config_key', 'relatorio_conversas')
      .single();

    if (configError || !config) {
      console.log('⚠️ [VAR SCHEDULED] Nenhuma configuração encontrada');
      return new Response(
        JSON.stringify({ message: 'No configuration found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const configData = config.config_value as any;
    
    // ✅ VERIFICAR SE O RELATÓRIO ESTÁ ATIVO
    if (configData.ativo === false) {
      console.log('⏸️ [VAR SCHEDULED] Relatório está desativado');
      return new Response(
        JSON.stringify({ message: 'Report is disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar se é hora de enviar
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const currentDay = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][now.getDay()];

    console.log('🕐 Hora atual:', currentTime, '| Dia:', currentDay);
    console.log('⚙️ Config:', { time: configData.time, selectedDays: configData.selectedDays });

    // Verificar se deve enviar agora
    const shouldSend = 
      configData.time === currentTime &&
      configData.selectedDays.includes(currentDay) &&
      configData.selectedDirectors.length > 0;

    if (!shouldSend) {
      console.log('⏭️ [VAR SCHEDULED] Não é hora de enviar');
      return new Response(
        JSON.stringify({ message: 'Not scheduled for this time' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [VAR SCHEDULED] Gerando e enviando relatório...');

    // Calcular período baseado na frequência
    let startDate = new Date();
    const endDate = new Date();

    switch (configData.frequency) {
      case 'diario':
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'semanal':
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'mensal':
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    // Gerar relatório
    const { data: reportData, error: generateError } = await supabase.functions.invoke(
      'relatorio-var-generate',
      {
        body: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }
      }
    );

    if (generateError) throw generateError;

    // Enviar relatório
    const { error: sendError } = await supabase.functions.invoke(
      'relatorio-var-send',
      {
        body: {
          report_data: reportData,
          format: 'whatsapp', // Default para programado
          director_ids: configData.selectedDirectors
        }
      }
    );

    if (sendError) throw sendError;

    console.log('✅ [VAR SCHEDULED] Relatório enviado com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Report sent successfully',
        directors_count: configData.selectedDirectors.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [VAR SCHEDULED] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
