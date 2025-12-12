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
          plano_meses,
          lista_predios
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
      client_id: pedidoVideo.pedidos.client_id,
      lista_predios: pedidoVideo.pedidos.lista_predios
    });

    // 2. REGRA CONSOLIDADA: clientId = primeiros 4 dígitos do UUID do prédio (sem hífens)
    // CRÍTICO: Enviar para TODOS os prédios do pedido, não apenas o primeiro!
    const listaPredios = pedidoVideo.pedidos.lista_predios;
    if (!listaPredios || !Array.isArray(listaPredios) || listaPredios.length === 0) {
      throw new Error('Nenhum prédio selecionado no pedido (campo lista_predios vazio)');
    }
    
    // Mapear TODOS os prédios para seus clientIds
    const buildingClients = listaPredios.map((uuid: string) => ({
      buildingId: uuid,
      clientId: uuid.replace(/-/g, '').substring(0, 4)
    }));
    
    console.log('🏢 [UPLOAD_EXTERNAL_API] Client IDs extraídos (TODOS os prédios):', { 
      totalPredios: buildingClients.length,
      clientIds: buildingClients.map(b => b.clientId),
      regra: 'primeiros_4_digitos_uuid_sem_hifens'
    });

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

    // 4. Verificar se é o primeiro vídeo aprovado deste pedido
    const { count: approvedCount } = await supabase
      .from('pedido_videos')
      .select('*', { count: 'exact', head: true })
      .eq('pedido_id', pedidoVideo.pedido_id)
      .eq('status', 'approved')
      .neq('id', pedido_video_id);

    const isFirstApproved = (approvedCount ?? 0) === 0;
    console.log('🎯 [UPLOAD_EXTERNAL_API] Verificação primeiro aprovado:', {
      pedido_id: pedidoVideo.pedido_id,
      outros_aprovados: approvedCount,
      isFirstApproved,
      ativo: isFirstApproved
    });

    // 5. Preparar metadados
    // IMPORTANTE: Extrair nome do arquivo do Storage URL (não o nome dado pelo usuário)
    const storageUrl = pedidoVideo.videos.url;
    const storageFileName = storageUrl.split('/').pop() || pedidoVideo.videos.nome;
    const videoTitle = storageFileName.replace(/\.[^/.]+$/, ''); // Remove extensão

    console.log('📝 [UPLOAD_EXTERNAL_API] Nome do arquivo extraído:', {
      nome_usuario: pedidoVideo.videos.nome,
      nome_storage: storageFileName,
      titulo_enviado: videoTitle
    });

    const metadata: VideoMetadata = {
      titulo: videoTitle,
      data_ini: formatDateForApi(pedidoVideo.pedidos.data_inicio),
      data_fim: formatDateForApi(pedidoVideo.pedidos.data_fim),
      programacao
    };

    const metadataJson = {
      [storageFileName]: {
        ...metadata,
        ativo: isFirstApproved,
        status: 'new'
      }
    };

    console.log('📦 [UPLOAD_EXTERNAL_API] Metadados preparados:', metadataJson);

    // 5. Baixar arquivo do vídeo do Supabase Storage COMPLETO
    console.log('⬇️ [UPLOAD_EXTERNAL_API] Baixando vídeo COMPLETO do Storage:', pedidoVideo.videos.url);
    
    const videoResponse = await fetch(pedidoVideo.videos.url);
    if (!videoResponse.ok) {
      console.error('❌ [UPLOAD_EXTERNAL_API] Erro ao baixar vídeo:', {
        status: videoResponse.status,
        statusText: videoResponse.statusText
      });
      throw new Error(`Erro ao baixar vídeo do Storage: ${videoResponse.statusText}`);
    }

    // CRÍTICO: Usar arrayBuffer() diretamente para garantir download completo
    console.log('📥 [UPLOAD_EXTERNAL_API] Baixando ArrayBuffer completo...');
    const arrayBuffer = await videoResponse.arrayBuffer();
    
    // Verificar se o arquivo não está vazio
    if (arrayBuffer.byteLength === 0) {
      throw new Error('❌ Arquivo de vídeo está VAZIO após download do Storage');
    }
    
    console.log('✅ [UPLOAD_EXTERNAL_API] ArrayBuffer baixado:', {
      size: arrayBuffer.byteLength,
      sizeMB: (arrayBuffer.byteLength / (1024 * 1024)).toFixed(2)
    });
    
    // Verificar assinatura do arquivo (primeiros bytes para validar que é MP4)
    const uint8Array = new Uint8Array(arrayBuffer);
    const firstBytes = Array.from(uint8Array.slice(0, 12)).map(b => b.toString(16).padStart(2, '0')).join(' ');
    console.log('🔍 [UPLOAD_EXTERNAL_API] Assinatura do arquivo (primeiros 12 bytes):', firstBytes);
    
    // Verificar últimos bytes para confirmar integridade
    const lastBytes = Array.from(uint8Array.slice(-8)).map(b => b.toString(16).padStart(2, '0')).join(' ');
    console.log('🔍 [UPLOAD_EXTERNAL_API] Últimos 8 bytes:', lastBytes);
    
    // GARANTIR que o nome do arquivo tenha extensão .mp4
    let finalFileName = storageFileName;
    if (!finalFileName.toLowerCase().endsWith('.mp4')) {
      finalFileName = `${finalFileName}.mp4`;
      console.log('⚠️ [UPLOAD_EXTERNAL_API] Adicionando extensão .mp4 ao arquivo:', finalFileName);
    }
    
    // CRÍTICO: Criar Blob com tipo explícito video/mp4 a partir do ArrayBuffer COMPLETO
    const videoFile = new Blob([arrayBuffer], { type: 'video/mp4' });
    
    console.log('✅ [UPLOAD_EXTERNAL_API] Arquivo MP4 preparado:', {
      fileName: finalFileName,
      size: videoFile.size,
      sizeMB: (videoFile.size / (1024 * 1024)).toFixed(2),
      type: videoFile.type,
      isComplete: videoFile.size === arrayBuffer.byteLength
    });

    // 6. Preparar form-data com arquivo COMPLETO
    const formData = new FormData();
    formData.append('files', videoFile, finalFileName);
    formData.append('metadados', JSON.stringify(metadataJson));

    console.log('📦 [UPLOAD_EXTERNAL_API] FormData preparado para envio:', {
      fileName: finalFileName,
      fileSize: videoFile.size,
      fileType: videoFile.type,
      hasExtension: finalFileName.endsWith('.mp4'),
      metadataKeys: Object.keys(metadataJson)
    });

    // 7. Enviar para TODOS os prédios do pedido
    console.log('📤 [UPLOAD_EXTERNAL_API] Iniciando envio para', buildingClients.length, 'prédios');
    
    const uploadResults: Array<{ clientId: string; success: boolean; status?: number; error?: string }> = [];
    
    for (const { clientId, buildingId } of buildingClients) {
      console.log(`📤 [UPLOAD_EXTERNAL_API] Enviando para prédio ${clientId} (${buildingId})...`);
      
      // Recriar FormData para cada envio (FormData não pode ser reutilizado)
      const formDataForBuilding = new FormData();
      formDataForBuilding.append('files', videoFile, finalFileName);
      formDataForBuilding.append('metadados', JSON.stringify(metadataJson));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
      
      try {
        const externalApiResponse = await fetch(
          `http://15.228.8.3:8000/propagandas/upload-propagandas/${clientId}`,
          {
            method: 'POST',
            body: formDataForBuilding,
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        const responseText = await externalApiResponse.text();
        console.log(`📥 [UPLOAD_EXTERNAL_API] Resposta para ${clientId}:`, {
          status: externalApiResponse.status,
          body: responseText.substring(0, 200)
        });
        
        if (externalApiResponse.ok) {
          console.log(`✅ [UPLOAD_EXTERNAL_API] Upload para ${clientId} concluído com sucesso`);
          uploadResults.push({ clientId, success: true, status: externalApiResponse.status });
        } else {
          console.error(`❌ [UPLOAD_EXTERNAL_API] Erro no upload para ${clientId}:`, responseText);
          uploadResults.push({ clientId, success: false, status: externalApiResponse.status, error: responseText });
        }
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error(`⏱️ [UPLOAD_EXTERNAL_API] Timeout para ${clientId}`);
          uploadResults.push({ clientId, success: false, error: 'Timeout' });
        } else {
          console.error(`❌ [UPLOAD_EXTERNAL_API] Erro para ${clientId}:`, fetchError.message);
          uploadResults.push({ clientId, success: false, error: fetchError.message });
        }
      }
    }
    
    // Verificar resultados
    const successCount = uploadResults.filter(r => r.success).length;
    const failedCount = uploadResults.filter(r => !r.success).length;
    
    console.log('📋 [UPLOAD_EXTERNAL_API] Resultado final:', {
      total: uploadResults.length,
      sucesso: successCount,
      falha: failedCount,
      detalhes: uploadResults
    });
    
    // Se todos falharam, retornar erro
    if (successCount === 0) {
      throw new Error(`Falha ao enviar vídeo para todos os ${failedCount} prédios`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Vídeo enviado para ${successCount}/${uploadResults.length} prédios`,
        results: uploadResults,
        videoFileName: storageFileName
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

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
