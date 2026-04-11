import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleRule {
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface ValidationRequest {
  orderId: string;
  videoId: string;
  rules: ScheduleRule[];
}

interface ScheduleConflict {
  conflictingVideoName: string;
  conflictingDay: number;
  conflictingStartTime: string;
  conflictingEndTime: string;
  newStartTime: string;
  newEndTime: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, videoId, rules }: ValidationRequest = await req.json();

    console.log('🔍 [VALIDATE] Validando conflitos:', { orderId, videoId, rulesCount: rules.length });

    // Buscar todas as regras ativas de outros vídeos do mesmo pedido
    const { data: existingRules, error: fetchError } = await supabase
      .from('campaign_schedule_rules')
      .select(`
        id,
        days_of_week,
        start_time,
        end_time,
        is_active,
        campaign_video_schedule_id,
        campaign_video_schedules!campaign_schedule_rules_campaign_video_schedule_id_fkey!inner (
          video_id,
          campaign_id,
          campaigns_advanced!fk_campaign_video_schedules_campaign!inner (
            pedido_id
          ),
          videos!fk_campaign_video_schedules_video!inner (
            id,
            nome
          )
        )
      `)
      .eq('campaign_video_schedules.campaigns_advanced.pedido_id', orderId)
      .neq('campaign_video_schedules.video_id', videoId)
      .eq('is_active', true);

    if (fetchError) {
      console.error('❌ [VALIDATE] Erro ao buscar regras:', fetchError);
      throw fetchError;
    }

    console.log('📊 [VALIDATE] Regras existentes:', existingRules?.length || 0);

    const conflicts: ScheduleConflict[] = [];

    // Verificar cada nova regra contra as existentes
    for (const newRule of rules) {
      for (const newDay of newRule.days_of_week) {
        const existingOnDay = (existingRules || []).filter(rule => 
          rule.days_of_week.includes(newDay)
        );

        for (const existing of existingOnDay) {
          const hasOverlap = checkTimeOverlap(
            newRule.start_time,
            newRule.end_time,
            existing.start_time,
            existing.end_time
          );

          if (hasOverlap) {
            const videoData = (existing as any).campaign_video_schedules?.videos;
            conflicts.push({
              conflictingVideoName: videoData?.nome || 'Vídeo desconhecido',
              conflictingDay: newDay,
              conflictingStartTime: existing.start_time,
              conflictingEndTime: existing.end_time,
              newStartTime: newRule.start_time,
              newEndTime: newRule.end_time
            });
          }
        }
      }
    }

    console.log('✅ [VALIDATE] Validação concluída:', { 
      conflictCount: conflicts.length,
      valid: conflicts.length === 0 
    });

    return new Response(
      JSON.stringify({
        valid: conflicts.length === 0,
        conflicts,
        suggestions: generateSuggestions(conflicts)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('💥 [VALIDATE] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        valid: false,
        conflicts: [],
        suggestions: {}
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

// Funções auxiliares
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  return !(end1Minutes <= start2Minutes || end2Minutes <= start1Minutes);
}

function generateSuggestions(conflicts: ScheduleConflict[]): Record<string, string[]> {
  const suggestionsByDay: Record<string, string[]> = {};

  conflicts.forEach(conflict => {
    const day = conflict.conflictingDay.toString();
    if (!suggestionsByDay[day]) {
      suggestionsByDay[day] = [];
    }

    // Sugerir horário antes do conflito
    const conflictStart = timeToMinutes(conflict.conflictingStartTime);
    if (conflictStart > 60) { // Se há pelo menos 1h antes
      suggestionsByDay[day].push(`00:00 às ${conflict.conflictingStartTime}`);
    }

    // Sugerir horário depois do conflito
    const conflictEnd = timeToMinutes(conflict.conflictingEndTime);
    if (conflictEnd < 1380) { // Se há pelo menos 1h depois (23h = 1380 min)
      suggestionsByDay[day].push(`${conflict.conflictingEndTime} às 23:59`);
    }
  });

  return suggestionsByDay;
}