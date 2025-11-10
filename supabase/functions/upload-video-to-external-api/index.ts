import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoMetadata {
  titulo: string;
  data_ini: string;
  data_fim: string;
  programacao: {
    [key: string]: Array<{ inicio: string; fim: string }>;
  };
}

interface VideoUploadPayload {
  pedido_video_id: string;
}

const dayMap: { [key: number]: string } = {
  0: 'domingo',
  1: 'segunda',
  2: 'terça',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sábado'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [UPLOAD_EXTERNAL_API] Iniciando processamento');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { pedido_video_id }: VideoUploadPayload = await req.json();

    if (!pedido_video_id) {
      throw new Error('pedido_video_id é obrigatório');
    }

    console.log('📋 [UPLOAD_EXTERNAL_API] Buscando dados do vídeo:', { pedido_video_id });

    // 1. Buscar dados completos do pedido_video
    const { data: pedidoVideo, error: pvError } = await supabase
      .from('pedido_videos')
      .select(`
        id,
        pedido_id,
        video_id,
        slot_position,
        pedidos!inner (
          id,
          client_id,
          data_inicio,
          data_fim,
          plano_meses
        ),
        videos!inner (
          id,
          nome,
          url
        )
      `)
      .eq('id', pedido_video_id)
      .single();

    if (pvError || !pedidoVideo) {
      console.error('❌ [UPLOAD_EXTERNAL_API] Erro ao buscar pedido_video:', pvError);
      throw new Error('Vídeo não encontrado');
    }

    console.log('✅ [UPLOAD_EXTERNAL_API] Dados do vídeo carregados:', {
      video_nome: pedidoVideo.videos.nome,
      pedido_id: pedidoVideo.pedido_id,
      client_id: pedidoVideo.pedidos.client_id
    });

    // 2. Extrair client_id (4 primeiros caracteres do UUID sem hífens)
    const fullClientId = pedidoVideo.pedidos.client_id.replace(/-/g, '');
    const clientId = fullClientId.substring(0, 4);
    console.log('🔑 [UPLOAD_EXTERNAL_API] Client ID extraído:', { clientId, fullClientId });

    // 3. Buscar programação do vídeo
    let programacao = getDefaultSchedule();
    
    // Verificar se existe campanha avançada para este pedido
    const { data: campaign } = await supabase
      .from('campaigns_advanced')
      .select('id')
      .eq('pedido_id', pedidoVideo.pedido_id)
      .maybeSingle();

    if (campaign) {
      console.log('📅 [UPLOAD_EXTERNAL_API] Campanha encontrada:', campaign.id);
      
      // Buscar regras de agendamento
      const { data: schedules } = await supabase
        .from('campaign_video_schedules')
        .select(`
          campaign_schedule_rules!inner (
            days_of_week,
            start_time,
            end_time,
            is_active
          )
        `)
        .eq('campaign_id', campaign.id)
        .eq('video_id', pedidoVideo.video_id)
        .eq('slot_position', pedidoVideo.slot_position);

      if (schedules && schedules.length > 0) {
        console.log('⏰ [UPLOAD_EXTERNAL_API] Programação customizada encontrada');
        programacao = convertScheduleRulesToProgramacao(schedules);
      } else {
        console.log('⏰ [UPLOAD_EXTERNAL_API] Usando programação padrão 24/7');
      }
    } else {
      console.log('⏰ [UPLOAD_EXTERNAL_API] Sem campanha - usando programação padrão 24/7');
    }

    // 4. Preparar metadados
    const videoFileName = pedidoVideo.videos.nome;
    const videoTitle = videoFileName.replace(/\.[^/.]+$/, ''); // Remove extensão

    const metadata: VideoMetadata = {
      titulo: videoTitle,
      data_ini: formatDateForApi(pedidoVideo.pedidos.data_inicio),
      data_fim: formatDateForApi(pedidoVideo.pedidos.data_fim),
      programacao
    };

    const metadataJson = {
      [videoFileName]: metadata
    };

    console.log('📦 [UPLOAD_EXTERNAL_API] Metadados preparados:', metadataJson);

    // 5. Baixar arquivo do vídeo do Supabase Storage
    console.log('⬇️ [UPLOAD_EXTERNAL_API] Baixando vídeo do Storage:', pedidoVideo.videos.url);
    
    const videoResponse = await fetch(pedidoVideo.videos.url);
    if (!videoResponse.ok) {
      throw new Error(`Erro ao baixar vídeo do Storage: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    console.log('✅ [UPLOAD_EXTERNAL_API] Vídeo baixado:', {
      size: videoBlob.size,
      type: videoBlob.type
    });

    // 6. Preparar form-data
    const formData = new FormData();
    formData.append('files', videoBlob, videoFileName);
    formData.append('metadados', JSON.stringify(metadataJson));

    console.log('📤 [UPLOAD_EXTERNAL_API] Enviando para API externa:', {
      url: `http://15.228.8.3:8000/propagandas/upload-propagandas/${clientId}`,
      fileName: videoFileName,
      clientId
    });

    // 7. Enviar para API externa com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

    try {
      const externalApiResponse = await fetch(
        `http://15.228.8.3:8000/propagandas/upload-propagandas/${clientId}`,
        {
          method: 'POST',
          body: formData,
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      const responseText = await externalApiResponse.text();
      console.log('📥 [UPLOAD_EXTERNAL_API] Resposta da API externa:', {
        status: externalApiResponse.status,
        body: responseText
      });

      if (!externalApiResponse.ok) {
        throw new Error(`API externa retornou erro ${externalApiResponse.status}: ${responseText}`);
      }

      console.log('✅ [UPLOAD_EXTERNAL_API] Upload para API externa concluído com sucesso');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Vídeo enviado para API externa com sucesso',
          clientId,
          videoFileName
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('⏱️ [UPLOAD_EXTERNAL_API] Timeout ao enviar para API externa');
        throw new Error('Timeout ao enviar vídeo para sistema externo');
      }
      
      console.error('❌ [UPLOAD_EXTERNAL_API] Erro ao enviar para API externa:', fetchError);
      throw fetchError;
    }

  } catch (error: any) {
    console.error('💥 [UPLOAD_EXTERNAL_API] Erro crítico:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido ao processar upload'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

/**
 * Converte regras de agendamento do banco para formato da API externa
 */
function convertScheduleRulesToProgramacao(schedules: any[]): any {
  const programacao: any = {};

  // Inicializar todos os dias como vazio
  Object.values(dayMap).forEach(day => {
    programacao[day] = [];
  });

  // Processar cada regra de agendamento
  schedules.forEach(schedule => {
    const rules = schedule.campaign_schedule_rules;
    if (!rules || !rules.is_active) return;

    const daysOfWeek = rules.days_of_week || [];
    
    daysOfWeek.forEach((dayNum: number) => {
      const dayName = dayMap[dayNum];
      if (dayName) {
        programacao[dayName].push({
          inicio: rules.start_time || '00:00',
          fim: rules.end_time || '23:59'
        });
      }
    });
  });

  return programacao;
}

/**
 * Retorna programação padrão 24/7 para todos os dias
 */
function getDefaultSchedule(): any {
  const schedule: any = {};
  
  Object.values(dayMap).forEach(day => {
    schedule[day] = [{
      inicio: '00:00',
      fim: '23:59'
    }];
  });

  return schedule;
}

/**
 * Formata data do formato YYYY-MM-DD para YYYY-MM-DDTHH:mm:ss
 */
function formatDateForApi(dateString: string | null): string {
  if (!dateString) {
    // Se não houver data, usar data atual
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', 'T');
  }

  // Se já estiver no formato ISO completo, usar como está
  if (dateString.includes('T')) {
    return dateString.slice(0, 19);
  }

  // Caso contrário, adicionar horário padrão (08:00:00)
  return `${dateString}T08:00:00`;
}
