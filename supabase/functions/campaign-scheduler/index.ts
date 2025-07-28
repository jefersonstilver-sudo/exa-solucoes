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

    // Converter para horário brasileiro (UTC-3) usando Intl para maior precisão
    const now = new Date()
    
    // Usar Intl.DateTimeFormat para obter horário brasileiro preciso
    const brazilFormatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    
    const brazilDateFormatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    
    // Usar getDay() diretamente para obter o dia da semana
    const brazilDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    
    // Criar objeto Date no horário brasileiro
    const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const currentTime = brazilFormatter.format(now).slice(0, 5) // HH:MM format
    const currentDay = brazilDate.getDay() // 0=Sunday, 1=Monday, etc.
    const currentDate = brazilDateFormatter.format(now).split('/').reverse().join('-') // YYYY-MM-DD

    console.log(`[SCHEDULER] Running at ${now.toISOString()} (UTC)`)
    console.log(`[SCHEDULER] Brazil time: ${brazilTime.toISOString()}, current time: ${currentTime}, current day: ${currentDay}`)
    console.log(`[SCHEDULER] Formatted date: ${currentDate}`)

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

      // Verificar regras de horário com logs detalhados
      let shouldBeActive = false
      let activationReason = ''
      
      console.log(`[SCHEDULER] Evaluating campaign ${typedCampaign.id}:`)
      console.log(`[SCHEDULER]   Current: ${currentDate} ${currentTime} (Day ${currentDay})`)
      console.log(`[SCHEDULER]   Period: ${typedCampaign.start_date} to ${typedCampaign.end_date}`)
      console.log(`[SCHEDULER]   Status: ${typedCampaign.status}`)
      
      for (const schedule of typedCampaign.campaign_video_schedules) {
        for (const rule of schedule.campaign_schedule_rules) {
          console.log(`[SCHEDULER]   Rule ${rule.id}: active=${rule.is_active}, days=[${rule.days_of_week.join(',')}], time=${rule.start_time}-${rule.end_time}`)
          
          if (!rule.is_active) {
            console.log(`[SCHEDULER]     ❌ Rule disabled`)
            continue
          }
          
          // Verificar se hoje está nos dias da semana da regra
          if (!rule.days_of_week.includes(currentDay)) {
            console.log(`[SCHEDULER]     ❌ Wrong day: current=${currentDay}, allowed=[${rule.days_of_week.join(',')}]`)
            continue
          }
          
          console.log(`[SCHEDULER]     ✅ Day matches: ${currentDay}`)
          
          // Criar objetos Date para comparação mais precisa com tolerância
          const today = new Date(`${currentDate}T${currentTime}:00`)
          const startDate = new Date(`${currentDate}T${rule.start_time}:00`)
          const endDate = new Date(`${currentDate}T${rule.end_time}:00`)
          
          // Adicionar tolerância de 30 segundos para ativação
          const tolerance = 30 * 1000 // 30 segundos em ms
          const adjustedStart = new Date(startDate.getTime() - tolerance)
          const adjustedEnd = new Date(endDate.getTime() + tolerance)
          
          // Lidar com horários que passam da meia-noite
          if (rule.start_time <= rule.end_time) {
            // Horário normal (ex: 09:00 - 17:00)
            if (today >= adjustedStart && today <= adjustedEnd) {
              shouldBeActive = true
              activationReason = `Normal time range: ${rule.start_time}-${rule.end_time} (with tolerance)`
              console.log(`[SCHEDULER]     ✅ Active - ${activationReason}`)
              break
            } else {
              console.log(`[SCHEDULER]     ❌ Outside time range: ${currentTime} not in ${rule.start_time}-${rule.end_time}`)
            }
          } else {
            // Horário que passa da meia-noite (ex: 22:00 - 02:00)
            const nextDayEnd = new Date(endDate.getTime() + 24 * 60 * 60 * 1000)
            const adjustedNextDayEnd = new Date(nextDayEnd.getTime() + tolerance)
            
            if (today >= adjustedStart || today <= adjustedNextDayEnd) {
              shouldBeActive = true
              activationReason = `Cross-midnight range: ${rule.start_time}-${rule.end_time} (with tolerance)`
              console.log(`[SCHEDULER]     ✅ Active - ${activationReason}`)
              break
            } else {
              console.log(`[SCHEDULER]     ❌ Outside cross-midnight range: ${currentTime} not in ${rule.start_time}-${rule.end_time}`)
            }
          }
        }
        if (shouldBeActive) break
      }
      
      console.log(`[SCHEDULER] Final decision: shouldBeActive=${shouldBeActive}${activationReason ? ` (${activationReason})` : ''}`)

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