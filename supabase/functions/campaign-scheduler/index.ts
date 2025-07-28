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
    let scheduledCount = 0
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
      let hasActiveScheduleToday = false
      let hasActiveScheduleFuture = false
      let activationReason = ''
      let nextActivationInfo = ''
      
      console.log(`[SCHEDULER] Evaluating campaign ${typedCampaign.id}:`)
      console.log(`[SCHEDULER]   Current: ${currentDate} ${currentTime} (Day ${currentDay})`)
      console.log(`[SCHEDULER]   Period: ${typedCampaign.start_date} to ${typedCampaign.end_date}`)
      console.log(`[SCHEDULER]   Status: ${typedCampaign.status}`)
      
      // Conversão para minutos para comparação simples
      const timeToMinutes = (timeStr: string): number => {
        const cleanTime = timeStr.replace(/:00$/, '')
        if (!/^\d{2}:\d{2}$/.test(cleanTime)) {
          return 0 // Fallback para 00:00
        }
        const [hours, minutes] = cleanTime.split(':').map(Number)
        return hours * 60 + minutes
      }
      
      const currentMinutes = timeToMinutes(currentTime)
      
      for (const schedule of typedCampaign.campaign_video_schedules) {
        for (const rule of schedule.campaign_schedule_rules) {
          console.log(`[SCHEDULER]   Rule ${rule.id}: active=${rule.is_active}, days=[${rule.days_of_week.join(',')}], time=${rule.start_time}-${rule.end_time}`)
          
          if (!rule.is_active) {
            console.log(`[SCHEDULER]     ❌ Rule disabled`)
            continue
          }
          
          const startMinutes = timeToMinutes(rule.start_time)
          const endMinutes = timeToMinutes(rule.end_time)
          
          // Verificar se a regra é para hoje
          if (rule.days_of_week.includes(currentDay)) {
            console.log(`[SCHEDULER]     ✅ Today matches: ${currentDay}`)
            
            let isInTimeRange = false
            
            if (startMinutes <= endMinutes) {
              // Horário normal no mesmo dia
              isInTimeRange = currentMinutes >= startMinutes && currentMinutes <= endMinutes
              console.log(`[SCHEDULER]     📅 Normal range: ${isInTimeRange ? 'ATIVO' : 'FORA'} do intervalo ${rule.start_time}-${rule.end_time}`)
              
              // Se não está ativo agora, mas ainda há tempo hoje
              if (!isInTimeRange && currentMinutes < startMinutes) {
                hasActiveScheduleToday = true
                nextActivationInfo = `Próxima ativação hoje às ${rule.start_time}`
                console.log(`[SCHEDULER]     📅 AGENDADO para hoje às ${rule.start_time}`)
              }
            } else {
              // Horário que cruza meia-noite
              isInTimeRange = currentMinutes >= startMinutes || currentMinutes <= endMinutes
              console.log(`[SCHEDULER]     🌙 Cross-midnight range: ${isInTimeRange ? 'ATIVO' : 'FORA'} do intervalo ${rule.start_time}-${rule.end_time}`)
            }
            
            if (isInTimeRange) {
              shouldBeActive = true
              activationReason = `Ativo no horário: ${rule.start_time}-${rule.end_time}`
              console.log(`[SCHEDULER]     ✅ ATIVO - ${activationReason}`)
              break
            }
          } else {
            // Verificar se há dias futuros programados
            const futureDays = rule.days_of_week.filter(day => day > currentDay || (day < currentDay && day >= 0))
            if (futureDays.length > 0) {
              hasActiveScheduleFuture = true
              const nextDay = Math.min(...futureDays.filter(day => day > currentDay))
              const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
              if (nextDay !== Infinity) {
                nextActivationInfo = `Próxima ativação: ${dayNames[nextDay]} às ${rule.start_time}`
              } else {
                const earliestDay = Math.min(...rule.days_of_week)
                nextActivationInfo = `Próxima ativação: ${dayNames[earliestDay]} às ${rule.start_time}`
              }
              console.log(`[SCHEDULER]     📅 AGENDADO para próximos dias: [${futureDays.join(',')}]`)
            } else {
              console.log(`[SCHEDULER]     ❌ Dia atual (${currentDay}) não está programado: [${rule.days_of_week.join(',')}]`)
            }
          }
        }
        if (shouldBeActive) break
      }
      
      // Determinar status final com lógica melhorada
      let newStatus: string
      if (shouldBeActive) {
        newStatus = 'active'
        console.log(`[SCHEDULER] Final decision: ATIVO - ${activationReason}`)
      } else if (hasActiveScheduleToday || hasActiveScheduleFuture) {
        newStatus = 'scheduled'
        console.log(`[SCHEDULER] Final decision: AGENDADO - ${nextActivationInfo}`)
      } else {
        newStatus = 'paused'
        console.log(`[SCHEDULER] Final decision: PAUSADO - Nenhuma programação ativa encontrada`)
      }
      
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
          } else if (newStatus === 'scheduled') {
            scheduledCount++
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
      campaigns_scheduled: scheduledCount,
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