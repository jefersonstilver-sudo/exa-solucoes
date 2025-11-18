import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AWS_API_BASE = 'http://15.228.8.3:8000';

interface VideoPayload {
  titulo: string;
  ativo: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pedidoId, activeVideoId } = await req.json();

    console.log('🔄 [AWS_SYNC] ====== INÍCIO ======');
    console.log('🔄 [AWS_SYNC] Pedido:', pedidoId);
    console.log('🔄 [AWS_SYNC] Video ativo:', activeVideoId);

    if (!pedidoId || !activeVideoId) {
      throw new Error('pedidoId e activeVideoId são obrigatórios');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar todos os vídeos do pedido
    const { data: allPedidoVideos, error: videosError } = await supabase
      .from('pedido_videos')
      .select(`
        id,
        video_id,
        slot_position,
        videos ( id, nome, url )
      `)
      .eq('pedido_id', pedidoId)
      .not('video_id', 'is', null);

    if (videosError || !allPedidoVideos || allPedidoVideos.length === 0) {
      console.error('❌ [AWS_SYNC] Erro ao buscar vídeos:', videosError);
      throw new Error(`Erro ao buscar vídeos: ${JSON.stringify(videosError)}`);
    }

    console.log(`✅ [AWS_SYNC] Encontrados ${allPedidoVideos.length} vídeos`);

    // 2. Buscar lista de prédios
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .select('lista_predios')
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !pedidoData?.lista_predios || !Array.isArray(pedidoData.lista_predios)) {
      console.error('❌ [AWS_SYNC] Erro ao buscar prédios:', pedidoError);
      throw new Error(`Erro ao buscar prédios: ${JSON.stringify(pedidoError)}`);
    }

    const buildingIds = pedidoData.lista_predios as string[];
    console.log(`✅ [AWS_SYNC] Encontrados ${buildingIds.length} prédios`);

    // 3. Extrair clientId de cada prédio (primeiros 4 dígitos do UUID)
    const buildingClients = buildingIds.map(uuid => ({
      buildingId: uuid,
      clientId: uuid.substring(0, 4)
    }));

    console.log('📋 [AWS_SYNC] Client IDs:', buildingClients.map(b => b.clientId));

    // 4. Helper para extrair título do vídeo
    const extractTitulo = (videoUrl?: string | null): string | null => {
      if (!videoUrl) return null;
      const base = String(videoUrl).split("/").pop() || "";
      const noQueryHash = base.split("?")[0].split("#")[0];
      const cleaned = noQueryHash.replace(/\.[^.]+$/, "").trim();
      return cleaned || null;
    };

    // 5. PASSO 1: Desativar TODOS os vídeos
    console.log('🔄 [AWS_SYNC] ====== PASSO 1: DESATIVAR TODOS ======');
    
    const deactivatePromises = [];
    const deactivateRequests = [];

    for (const { clientId } of buildingClients) {
      for (const video of allPedidoVideos) {
        const titulo = extractTitulo(video.videos?.url);
        if (!titulo) continue;

        const url = `${AWS_API_BASE}/ativo/${clientId}`;
        const payload: VideoPayload = { titulo, ativo: false };

        deactivateRequests.push({ url, payload, clientId, titulo });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const promise = fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        })
        .then(async (response) => {
          clearTimeout(timeoutId);
          const responseText = await response.text().catch(() => '(sem body)');
          
          console.log(`📤 [AWS_SYNC][DEACTIVATE] PATCH /ativo/${clientId}`, payload);
          console.log(`📥 [AWS_SYNC][DEACTIVATE] Status: ${response.status} ${response.statusText}`);
          console.log(`📥 [AWS_SYNC][DEACTIVATE] Response:`, responseText);

          if (!response.ok) {
            console.error(`❌ [AWS_SYNC][DEACTIVATE] ERRO: ${response.status} - ${responseText}`);
          } else {
            console.log(`✅ [AWS_SYNC][DEACTIVATE] SUCESSO`);
          }

          return { ok: response.ok, status: response.status, clientId, titulo };
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            console.error(`⏱️ [AWS_SYNC][DEACTIVATE] TIMEOUT após 10s - ${clientId}/${titulo}`);
          } else {
            console.error(`💥 [AWS_SYNC][DEACTIVATE] EXCEÇÃO:`, err.message);
          }
          throw err;
        });

        deactivatePromises.push(promise);
      }
    }

    console.log(`🔄 [AWS_SYNC] Desativando ${deactivatePromises.length} vídeos...`);
    const deactivateResults = await Promise.allSettled(deactivatePromises);

    const deactivateSuccess = deactivateResults.filter(r => r.status === 'fulfilled' && r.value.ok).length;
    const deactivateFailed = deactivateResults.length - deactivateSuccess;

    console.log(`📊 [AWS_SYNC] Desativar: ${deactivateSuccess} sucesso, ${deactivateFailed} falhas`);

    // 6. Aguardar 500ms antes de ativar
    console.log('⏳ [AWS_SYNC] Aguardando 500ms...');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 7. PASSO 2: Ativar APENAS o vídeo correto
    console.log('🔄 [AWS_SYNC] ====== PASSO 2: ATIVAR VÍDEO CORRETO ======');

    const activeVideo = allPedidoVideos.find(v => v.video_id === activeVideoId);
    if (!activeVideo) {
      throw new Error(`Vídeo ativo não encontrado: ${activeVideoId}`);
    }

    const tituloAtivo = extractTitulo(activeVideo.videos?.url);
    if (!tituloAtivo) {
      throw new Error(`Não foi possível extrair título do vídeo: ${activeVideo.videos?.url}`);
    }

    console.log(`✅ [AWS_SYNC] Vídeo para ativar: "${tituloAtivo}" (${activeVideoId})`);

    const activatePromises = [];
    const activateRequests = [];

    for (const { clientId } of buildingClients) {
      const url = `${AWS_API_BASE}/ativo/${clientId}`;
      const payload: VideoPayload = { titulo: tituloAtivo, ativo: true };

      activateRequests.push({ url, payload, clientId, titulo: tituloAtivo });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const promise = fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      .then(async (response) => {
        clearTimeout(timeoutId);
        const responseText = await response.text().catch(() => '(sem body)');
        
        console.log(`📤 [AWS_SYNC][ACTIVATE] PATCH /ativo/${clientId}`, payload);
        console.log(`📥 [AWS_SYNC][ACTIVATE] Status: ${response.status} ${response.statusText}`);
        console.log(`📥 [AWS_SYNC][ACTIVATE] Response:`, responseText);

        if (!response.ok) {
          console.error(`❌ [AWS_SYNC][ACTIVATE] ERRO: ${response.status} - ${responseText}`);
        } else {
          console.log(`✅ [AWS_SYNC][ACTIVATE] SUCESSO`);
        }

        return { ok: response.ok, status: response.status, clientId, titulo: tituloAtivo };
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          console.error(`⏱️ [AWS_SYNC][ACTIVATE] TIMEOUT após 10s - ${clientId}/${tituloAtivo}`);
        } else {
          console.error(`💥 [AWS_SYNC][ACTIVATE] EXCEÇÃO:`, err.message);
        }
        throw err;
      });

      activatePromises.push(promise);
    }

    console.log(`🔄 [AWS_SYNC] Ativando vídeo em ${activatePromises.length} prédios...`);
    const activateResults = await Promise.allSettled(activatePromises);

    const activateSuccess = activateResults.filter(r => r.status === 'fulfilled' && r.value.ok).length;
    const activateFailed = activateResults.length - activateSuccess;

    console.log(`📊 [AWS_SYNC] Ativar: ${activateSuccess} sucesso, ${activateFailed} falhas`);

    // 8. Processar erros
    const errors = [
      ...deactivateResults.filter(r => r.status === 'rejected').map(r => ({
        step: 'deactivate',
        reason: r.reason
      })),
      ...activateResults.filter(r => r.status === 'rejected').map(r => ({
        step: 'activate',
        reason: r.reason
      }))
    ];

    const success = errors.length === 0;

    console.log('🔄 [AWS_SYNC] ====== RESULTADO FINAL ======');
    console.log(`📊 [AWS_SYNC] Sucesso: ${success}`);
    console.log(`📊 [AWS_SYNC] Desativados: ${deactivateSuccess}/${deactivateResults.length}`);
    console.log(`📊 [AWS_SYNC] Ativados: ${activateSuccess}/${activateResults.length}`);
    console.log(`📊 [AWS_SYNC] Erros: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success,
        deactivated: deactivateSuccess,
        activated: activateSuccess,
        total_requests: deactivateResults.length + activateResults.length,
        errors: errors.length > 0 ? errors : undefined,
        video_activated: tituloAtivo
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: success ? 200 : 207 // 207 = Multi-Status (parcialmente sucesso)
      }
    );

  } catch (error: any) {
    console.error('💥 [AWS_SYNC] ERRO CRÍTICO:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
