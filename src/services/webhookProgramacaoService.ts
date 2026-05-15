import { supabase } from '@/integrations/supabase/client';

interface ScheduleRule {
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_all_day?: boolean;
}

interface VideoWithSchedule {
  videoId: string;
  videoName: string;
  scheduleRules: ScheduleRule[];
}

interface WebhookBody {
  Propagandas: Array<{
    titulo: string;
    programacao: {
      segunda: Array<{ inicio: string; fim: string }>;
      terca: Array<{ inicio: string; fim: string }>;
      quarta: Array<{ inicio: string; fim: string }>;
      quinta: Array<{ inicio: string; fim: string }>;
      sexta: Array<{ inicio: string; fim: string }>;
      sabado: Array<{ inicio: string; fim: string }>;
      domingo: Array<{ inicio: string; fim: string }>;
    };
  }>;
  predio_id?: string;
}

// Mapear números dos dias para nomes em português
const DAY_NAMES_MAP = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado'
} as const;

/**
 * Busca todos os vídeos com agendamento de um pedido
 */
async function getAllVideosWithScheduleFromOrder(orderId: string): Promise<VideoWithSchedule[]> {
  console.log('🔍 [WEBHOOK] Buscando todos os vídeos com agendamento do pedido:', orderId);

  // Buscar todos os pedido_videos do pedido
  const { data: pedidoVideos, error: pedidoError } = await supabase
    .from('pedido_videos')
    .select(`
      video_id,
      slot_position,
      videos (
        id,
        nome
      )
    `)
    .eq('pedido_id', orderId)
    .eq('approval_status', 'approved');

  if (pedidoError || !pedidoVideos) {
    console.error('❌ [WEBHOOK] Erro ao buscar vídeos do pedido:', pedidoError);
    return [];
  }

  console.log('📹 [WEBHOOK] Vídeos encontrados:', pedidoVideos.length);

  // Para cada vídeo, buscar suas regras de agendamento
  const videosWithSchedule: VideoWithSchedule[] = [];

  for (const pv of pedidoVideos) {
    if (!pv.videos?.nome || !pv.video_id) continue;

    // Buscar regras de agendamento para este vídeo
    const { data: videoSchedules, error: scheduleError } = await supabase
      .from('campaign_video_schedules')
      .select(`
        id,
        campaign_schedule_rules (
          id,
          days_of_week,
          start_time,
          end_time,
          is_active,
          is_all_day
        )
      `)
      .eq('video_id', pv.video_id)
      .eq('slot_position', pv.slot_position);

    if (scheduleError) {
      console.error(`❌ [WEBHOOK] Erro ao buscar schedule para vídeo ${pv.video_id}:`, scheduleError);
      continue;
    }

    // Coletar todas as regras ativas
    const scheduleRules: ScheduleRule[] = [];
    if (videoSchedules && videoSchedules.length > 0) {
      videoSchedules.forEach(schedule => {
        const activeRules = schedule.campaign_schedule_rules?.filter(rule => rule.is_active) || [];
        scheduleRules.push(...activeRules);
      });
    }

    // Se tem regras de agendamento, incluir na lista
    if (scheduleRules.length > 0) {
      videosWithSchedule.push({
        videoId: pv.video_id,
        videoName: pv.videos.nome,
        scheduleRules
      });
      console.log(`✅ [WEBHOOK] Vídeo "${pv.videos.nome}" tem ${scheduleRules.length} regras ativas`);
    }
  }

  console.log(`📊 [WEBHOOK] Total de vídeos com agendamento: ${videosWithSchedule.length}`);
  return videosWithSchedule;
}

/**
 * Busca o ID do primeiro prédio de um pedido
 */
async function getBuildingIdFromOrder(orderId: string): Promise<string | null> {
  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select('lista_predios')
    .eq('id', orderId)
    .single();

  if (error || !pedido?.lista_predios || pedido.lista_predios.length === 0) {
    console.error('❌ [WEBHOOK] Erro ao buscar prédio do pedido:', error);
    return null;
  }

  const buildingId = pedido.lista_predios[0];
  console.log('🏢 [WEBHOOK] Building ID encontrado:', buildingId);
  return buildingId;
}

/**
 * Remove segundos do formato de hora (HH:MM:SS -> HH:MM)
 */
function formatTimeWithoutSeconds(time: string): string {
  if (time && time.includes(':')) {
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
  }
  return time;
}

/**
 * Formata as regras de agendamento para o formato do webhook
 */
function formatScheduleRulesForWebhook(rules: ScheduleRule[]) {
  const programacao = {
    segunda: [] as Array<{ inicio: string; fim: string }>,
    terca: [] as Array<{ inicio: string; fim: string }>,
    quarta: [] as Array<{ inicio: string; fim: string }>,
    quinta: [] as Array<{ inicio: string; fim: string }>,
    sexta: [] as Array<{ inicio: string; fim: string }>,
    sabado: [] as Array<{ inicio: string; fim: string }>,
    domingo: [] as Array<{ inicio: string; fim: string }>
  };

  rules.forEach(rule => {
    const timeSlot = {
      inicio: rule.is_all_day ? '00:00' : formatTimeWithoutSeconds(rule.start_time),
      fim: rule.is_all_day ? '23:59' : formatTimeWithoutSeconds(rule.end_time)
    };

    rule.days_of_week.forEach(dayNumber => {
      const dayName = DAY_NAMES_MAP[dayNumber as keyof typeof DAY_NAMES_MAP];
      if (dayName && programacao[dayName]) {
        programacao[dayName].push(timeSlot);
      }
    });
  });

  return programacao;
}

/**
 * Envia o webhook com a programação agendada
 */
export async function sendScheduledProgrammingWebhook(orderId: string): Promise<void> {
  try {
    console.log('🚀 [WEBHOOK] Iniciando envio do webhook de programação para pedido:', orderId);

    // Buscar todos os vídeos com agendamento do pedido
    const videosWithSchedule = await getAllVideosWithScheduleFromOrder(orderId);
    
    if (videosWithSchedule.length === 0) {
      console.log('📭 [WEBHOOK] Nenhum vídeo com agendamento encontrado, não enviando webhook');
      return;
    }

    // Buscar ID do prédio
    const buildingId = await getBuildingIdFromOrder(orderId);

    // Formatar dados para o webhook
    const webhookBody: WebhookBody = {
      Propagandas: videosWithSchedule.map(video => ({
        titulo: video.videoName,
        programacao: formatScheduleRulesForWebhook(video.scheduleRules)
      }))
    };

    // Adicionar building ID se encontrado
    if (buildingId) {
      webhookBody.predio_id = buildingId;
    }

    console.log('📤 [WEBHOOK] Payload do webhook:', JSON.stringify(webhookBody, null, 2));

    // Enviar webhook PUT
    const response = await fetch('https://stilver.app.n8n.cloud/webhook/PROGRAMAÇÃO_AGENDADA', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookBody)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status} - ${response.statusText}`);
    }

    console.log('✅ [WEBHOOK] Webhook enviado com sucesso!');
    console.log('📊 [WEBHOOK] Estatísticas:', {
      totalVideos: videosWithSchedule.length,
      buildingId: buildingId || 'Não encontrado',
      status: response.status
    });

  } catch (error) {
    console.error('❌ [WEBHOOK] Erro ao enviar webhook:', error);
    throw error; // Re-throw para que o chamador possa tratar o erro
  }
}

/**
 * Envia a programação de UM vídeo para a API externa AWS
 * Endpoint: PUT http://18.228.252.149:8000/programacao/{client_id}/{titulo}
 * Usado pelo SlotVideoScheduleModal ao salvar OU excluir agendamento.
 *
 * @param orderId   ID do pedido
 * @param videoId   ID do vídeo cuja programação foi alterada
 * @param videoName Nome do vídeo (apenas para logs)
 * @param clear     true => envia programação vazia (limpa agendamento)
 */
export async function sendWebhookAfterScheduleSave(
  orderId: string,
  videoName: string,
  videoId?: string,
  clear: boolean = false
): Promise<void> {
  try {
    if (!videoId) {
      console.warn('⚠️ [WEBHOOK] sendWebhookAfterScheduleSave chamado sem videoId, pulando envio AWS');
      return;
    }
    console.log(`🎯 [WEBHOOK] Enviando programação AWS do vídeo "${videoName}" (clear=${clear})`);
    const { data, error } = await supabase.functions.invoke('update-video-schedule-aws', {
      body: { pedido_id: orderId, video_id: videoId, clear }
    });
    if (error) throw error;
    console.log(`✅ [WEBHOOK] Programação AWS enviada para "${videoName}":`, data);
  } catch (error) {
    console.error(`❌ [WEBHOOK] Erro ao enviar programação AWS para "${videoName}":`, error);
    // Não re-throw para não bloquear o fluxo de salvamento
  }
}