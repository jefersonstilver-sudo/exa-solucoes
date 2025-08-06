import { supabase } from '@/integrations/supabase/client';

interface ScheduleRule {
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface VideoApprovalData {
  videoId: string;
  videoUrl: string;
  videoName: string;
  pedidoId: string;
  contractStartDate: string;
  contractEndDate: string;
  scheduleRules: ScheduleRule[];
  panelCodes: string[];
  buildingId: string;
}

const mapDaysToPortuguese = (days: number[]): string[] => {
  const dayMap: { [key: number]: string } = {
    0: 'domingo',
    1: 'segunda',
    2: 'terca',
    3: 'quarta',
    4: 'quinta',
    5: 'sexta',
    6: 'sabado'
  };
  
  return days.map(day => dayMap[day]).filter(Boolean);
};

const formatScheduleRules = (rules: ScheduleRule[]): Record<string, any[]> => {
  const schedule: Record<string, any[]> = {};
  
  rules.forEach(rule => {
    if (!rule.is_active) return;
    
    const days = mapDaysToPortuguese(rule.days_of_week);
    days.forEach(day => {
      if (!schedule[day]) {
        schedule[day] = [];
      }
      schedule[day].push({
        inicio: rule.start_time,
        fim: rule.end_time
      });
    });
  });
  
  return schedule;
};

const getContractTimeRange = (
  contractStart: string, 
  contractEnd: string, 
  scheduleRules: ScheduleRule[]
): { dataIni: string; dataFim: string } => {
  // Encontrar o horário mais cedo e mais tarde das regras
  const activeTimes = scheduleRules
    .filter(rule => rule.is_active)
    .flatMap(rule => [rule.start_time, rule.end_time]);
  
  const earliestTime = activeTimes.length > 0 
    ? activeTimes.sort()[0] 
    : '08:00';
  
  const latestTime = activeTimes.length > 0 
    ? activeTimes.sort().reverse()[0] 
    : '18:00';
  
  return {
    dataIni: `${contractStart}T${earliestTime}:00`,
    dataFim: `${contractEnd}T${latestTime}:00`
  };
};

const fetchVideoApprovalData = async (pedidoVideoId: string): Promise<VideoApprovalData | null> => {
  try {
    // Buscar dados do vídeo, pedido e configurações
    const { data: videoData, error: videoError } = await supabase
      .from('pedido_videos')
      .select(`
        id,
        pedido_id,
        video_id,
        videos!inner (
          id,
          nome,
          url
        ),
        pedidos!inner (
          id,
          data_inicio,
          data_fim,
          lista_paineis
        )
      `)
      .eq('id', pedidoVideoId)
      .single();

    if (videoError || !videoData) {
      console.error('Erro ao buscar dados do vídeo:', videoError);
      return null;
    }

    // Buscar regras de agendamento salvas
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('campaign_video_schedules')
      .select(`
        id,
        campaign_schedule_rules!inner (
          days_of_week,
          start_time,
          end_time,
          is_active
        )
      `)
      .eq('video_id', videoData.video_id);

    if (scheduleError) {
      console.error('Erro ao buscar regras de agendamento:', scheduleError);
    }

    // Se não tiver regras específicas, criar regra padrão
    let scheduleRules: ScheduleRule[] = [];
    if (scheduleData && scheduleData.length > 0) {
      scheduleRules = scheduleData.flatMap(schedule => 
        schedule.campaign_schedule_rules.map(rule => ({
          days_of_week: rule.days_of_week,
          start_time: rule.start_time,
          end_time: rule.end_time,
          is_active: rule.is_active
        }))
      );
    } else {
      // Regra padrão: Segunda a sexta, 8h às 18h
      scheduleRules = [{
        days_of_week: [1, 2, 3, 4, 5],
        start_time: '08:00',
        end_time: '18:00',
        is_active: true
      }];
    }

    // Buscar dados dos painéis
    const panelIds = videoData.pedidos.lista_paineis || [];
    let panelCodes: string[] = [];
    let buildingId = '';

    if (panelIds.length > 0) {
      const { data: panelData, error: panelError } = await supabase
        .from('painels')
        .select('code, building_id')
        .in('id', panelIds);

      if (!panelError && panelData.length > 0) {
        panelCodes = panelData.map(panel => panel.code);
        buildingId = panelData[0].building_id;
      }
    }

    return {
      videoId: videoData.video_id,
      videoUrl: videoData.videos.url,
      videoName: videoData.videos.nome,
      pedidoId: videoData.pedido_id,
      contractStartDate: videoData.pedidos.data_inicio,
      contractEndDate: videoData.pedidos.data_fim,
      scheduleRules,
      panelCodes,
      buildingId
    };
  } catch (error) {
    console.error('Erro ao buscar dados para webhook:', error);
    return null;
  }
};

export const sendVideoApprovalToWebhook = async (pedidoVideoId: string): Promise<boolean> => {
  try {
    const data = await fetchVideoApprovalData(pedidoVideoId);
    
    if (!data) {
      console.error('Não foi possível obter dados para enviar ao webhook');
      return false;
    }

    const { dataIni, dataFim } = getContractTimeRange(
      data.contractStartDate,
      data.contractEndDate,
      data.scheduleRules
    );

    // Montar payload igual ao da campanha
    const payload = {
      building_id: data.buildingId,
      panel_code_prefix: data.panelCodes.join(','),
      [data.videoName]: {
        titulo: data.videoName.replace(/\.[^/.]+$/, ''), // Remove extensão
        video_url: data.videoUrl,
        data_ini: dataIni,
        data_fim: dataFim,
        programacao: formatScheduleRules(data.scheduleRules)
      }
    };

    console.log('Enviando payload para webhook:', payload);

    // Enviar para webhook
    const response = await fetch('https://stilver.app.n8n.cloud/webhook/propagandas_upload_propagandas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook retornou status ${response.status}`);
    }

    console.log('Webhook enviado com sucesso para vídeo aprovado');
    return true;
  } catch (error) {
    console.error('Erro ao enviar webhook de aprovação:', error);
    return false;
  }
};