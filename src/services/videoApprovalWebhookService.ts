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
    console.log('🔍 Buscando dados para webhook:', pedidoVideoId);

    // Buscar dados do pedido_video, vídeo e pedido
    const { data: videoData, error: videoError } = await supabase
      .from('pedido_videos')
      .select(`
        id,
        pedido_id,
        video_id,
        slot_position,
        videos!inner (
          id,
          nome,
          url
        ),
        pedidos!inner (
          id,
          data_inicio,
          data_fim,
          lista_paineis,
          lista_predios
        )
      `)
      .eq('id', pedidoVideoId)
      .single();

    if (videoError || !videoData) {
      console.error('❌ Erro ao buscar dados do vídeo:', videoError);
      return null;
    }

    console.log('📊 Dados encontrados:', {
      videoId: videoData.video_id,
      pedidoId: videoData.pedido_id,
      slotPosition: videoData.slot_position,
      videoName: videoData.videos?.nome,
      listaPaineis: videoData.pedidos?.lista_paineis,
      listaPredios: videoData.pedidos?.lista_predios
    });

    // Buscar regras de agendamento específicas do vídeo
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('campaign_video_schedules')
      .select(`
        id,
        campaign_schedule_rules (
          days_of_week,
          start_time,
          end_time,
          is_active
        )
      `)
      .eq('campaign_id', videoData.pedido_id)
      .eq('video_id', videoData.video_id)
      .eq('slot_position', videoData.slot_position);

    if (scheduleError) {
      console.error('❌ Erro ao buscar regras de agendamento:', scheduleError);
    }

    console.log('📅 Regras de agendamento encontradas:', scheduleData?.length || 0, scheduleData);

    // Processar regras de agendamento
    let scheduleRules: ScheduleRule[] = [];
    
    if (scheduleData && scheduleData.length > 0) {
      const schedule = scheduleData[0];
      if (schedule.campaign_schedule_rules && schedule.campaign_schedule_rules.length > 0) {
        scheduleRules = schedule.campaign_schedule_rules
          .filter((rule: any) => rule.is_active)
          .map((rule: any) => ({
            days_of_week: rule.days_of_week,
            start_time: rule.start_time,
            end_time: rule.end_time,
            is_active: rule.is_active
          }));
        
        console.log('✅ Usando regras personalizadas do cliente:', scheduleRules);
      }
    }

    // CRÍTICO: NÃO usar regra padrão - apenas programação personalizada do cliente
    if (scheduleRules.length === 0) {
      console.error('❌ ERRO CRÍTICO: Nenhuma programação personalizada encontrada para o vídeo!');
      console.error('📋 Dados de busca:', { 
        pedidoVideoId, 
        orderId: videoData.pedidos?.id,
        scheduleDataLength: scheduleData?.length || 0
      });
      
      // Retornar null para indicar erro - webhook não deve prosseguir sem programação personalizada
      return null;
    }

    // Buscar informações dos painéis e building_id
    let panelCodes: string[] = [];
    let buildingId = '';
    
    const listaPaineis = videoData.pedidos?.lista_paineis || [];
    const listaPredios = videoData.pedidos?.lista_predios || [];

    // Tentar buscar painéis primeiro
    if (listaPaineis.length > 0) {
      const { data: painelData, error: painelError } = await supabase
        .from('painels')
        .select('code, building_id')
        .in('id', listaPaineis);

      if (!painelError && painelData && painelData.length > 0) {
        panelCodes = painelData.map(p => p.code);
        buildingId = painelData[0].building_id;
        console.log('✅ Painéis encontrados via lista_paineis:', { panelCodes, buildingId });
      } else {
        // Se não encontrou painéis, lista_paineis pode conter building_ids incorretamente
        console.log('🔄 lista_paineis não contém painel_ids válidos, tentando como building_ids');
        
        const { data: paineisByBuilding, error: painelBuildingError } = await supabase
          .from('painels')
          .select('code, building_id')
          .in('building_id', listaPaineis)
          .eq('status', 'online')
          .limit(1);

        if (!painelBuildingError && paineisByBuilding && paineisByBuilding.length > 0) {
          panelCodes = paineisByBuilding.map(p => p.code);
          buildingId = paineisByBuilding[0].building_id;
          console.log('✅ Painéis encontrados via building_id em lista_paineis:', { panelCodes, buildingId });
        }
      }
    }

    // Fallback: usar lista_predios se não encontrou nada ainda
    if (!buildingId && listaPredios.length > 0) {
      buildingId = listaPredios[0];
      console.log('🔄 Usando building_id do fallback lista_predios:', buildingId);
      
      const { data: paineisByPredios, error: painelPrediosError } = await supabase
        .from('painels')
        .select('code, building_id')
        .eq('building_id', buildingId)
        .eq('status', 'online')
        .limit(1);

      if (!painelPrediosError && paineisByPredios && paineisByPredios.length > 0) {
        panelCodes = paineisByPredios.map(p => p.code);
        console.log('✅ Painéis encontrados via lista_predios:', { panelCodes });
      }
    }

    console.log('🏢 Building ID final:', buildingId);
    console.log('🖥️ Panel codes final:', panelCodes);

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
    console.error('💥 Erro ao buscar dados para webhook:', error);
    return null;
  }
};

export const sendVideoApprovalToWebhook = async (pedidoVideoId: string): Promise<boolean> => {
  try {
    console.log('🌐 Iniciando envio para webhook...', { pedidoVideoId });
    
    const data = await fetchVideoApprovalData(pedidoVideoId);
    
    if (!data) {
      console.error('❌ ERRO CRÍTICO: Falha ao obter dados do vídeo ou programação personalizada não encontrada');
      console.error('🚫 Webhook bloqueado - vídeo sem programação personalizada não será enviado');
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