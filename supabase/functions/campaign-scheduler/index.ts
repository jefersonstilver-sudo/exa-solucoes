import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScheduleRule {
  id: string
  days_of_week: number[]
  start_time: string
  end_time: string
  is_active: boolean
}

interface Campaign {
  id: string
  status: string
  start_date: string
  end_date: string
  campaign_video_schedules: {
    campaign_schedule_rules: ScheduleRule[]
  }[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD

    console.log(`[SCHEDULER] Running at ${now.toISOString()}, current time: ${currentTime}, current day: ${currentDay}`)

    // Buscar todas as campanhas que podem precisar de mudança de status
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns_advanced')
      .select(`
        id,
        status,
        start_date,
        end_date,
        campaign_video_schedules (
          campaign_schedule_rules (
            id,
            days_of_week,
            start_time,
            end_time,
            is_active
          )
        )
      `)
      .in('status', ['scheduled', 'active', 'paused'])
      .gte('end_date', currentDate)

    if (campaignsError) {
      console.error('[SCHEDULER] Error fetching campaigns:', campaignsError)
      throw campaignsError
    }

    console.log(`[SCHEDULER] Found ${campaigns?.length || 0} campaigns to process`)

    let activatedCount = 0
    let pausedCount = 0
    let expiredCount = 0

    for (const campaign of campaigns || []) {
      const typedCampaign = campaign as Campaign
      
      // Verificar se a campanha expirou
      if (currentDate > typedCampaign.end_date) {
        if (typedCampaign.status !== 'expired') {
          await supabase
            .from('campaigns_advanced')
            .update({ status: 'expired' })
            .eq('id', typedCampaign.id)
          
          console.log(`[SCHEDULER] Campaign ${typedCampaign.id} expired`)
          expiredCount++
        }
        continue
      }

      // Verificar se a campanha ainda não começou
      if (currentDate < typedCampaign.start_date) {
        continue
      }

      // Verificar regras de horário
      let shouldBeActive = false
      
      for (const schedule of typedCampaign.campaign_video_schedules) {
        for (const rule of schedule.campaign_schedule_rules) {
          if (!rule.is_active) continue
          
          // Verificar se hoje está nos dias da semana da regra
          if (!rule.days_of_week.includes(currentDay)) continue
          
          // Verificar se estamos dentro do horário
          const startTime = rule.start_time
          const endTime = rule.end_time
          
          // Lidar com horários que passam da meia-noite (ex: 22:00 - 02:00)
          if (startTime <= endTime) {
            // Horário normal (ex: 09:00 - 17:00)
            if (currentTime >= startTime && currentTime < endTime) {
              shouldBeActive = true
              break
            }
          } else {
            // Horário que passa da meia-noite (ex: 22:00 - 02:00)
            if (currentTime >= startTime || currentTime < endTime) {
              shouldBeActive = true
              break
            }
          }
        }
        if (shouldBeActive) break
      }

      // Atualizar status se necessário
      const newStatus = shouldBeActive ? 'active' : 'paused'
      
      if (typedCampaign.status !== newStatus) {
        const { error: updateError } = await supabase
          .from('campaigns_advanced')
          .update({ status: newStatus })
          .eq('id', typedCampaign.id)

        if (updateError) {
          console.error(`[SCHEDULER] Error updating campaign ${typedCampaign.id}:`, updateError)
        } else {
          console.log(`[SCHEDULER] Campaign ${typedCampaign.id} status changed: ${typedCampaign.status} -> ${newStatus}`)
          
          if (newStatus === 'active') {
            activatedCount++
          } else {
            pausedCount++
          }

          // Log da mudança
          await supabase
            .from('log_eventos_sistema')
            .insert({
              tipo_evento: 'CAMPAIGN_STATUS_AUTO_CHANGE',
              descricao: `Campaign ${typedCampaign.id} automatically changed from ${typedCampaign.status} to ${newStatus} at ${now.toISOString()}`
            })
        }
      }
    }

    const result = {
      success: true,
      timestamp: now.toISOString(),
      campaigns_processed: campaigns?.length || 0,
      campaigns_activated: activatedCount,
      campaigns_paused: pausedCount,
      campaigns_expired: expiredCount,
      current_time: currentTime,
      current_day: currentDay
    }

    console.log('[SCHEDULER] Processing complete:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('[SCHEDULER] Fatal error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})