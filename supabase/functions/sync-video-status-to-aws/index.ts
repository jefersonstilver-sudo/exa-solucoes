import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const EXTERNAL_API_BASE = 'http://15.228.8.3:8000';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pedidoId, activeVideoId, previousVideoId } = await req.json();

    console.log('🔄 [AWS_SYNC] ====== INÍCIO ======');
    console.log('🔄 [AWS_SYNC] Pedido:', pedidoId);
    console.log('🔄 [AWS_SYNC] Video ativo:', activeVideoId);
    console.log('🔄 [AWS_SYNC] Video anterior:', previousVideoId || 'nenhum (ignorado - usaremos global-toggle)');

    if (!pedidoId) {
      throw new Error('pedidoId é obrigatório');
    }
    
    if (!activeVideoId) {
      throw new Error('activeVideoId é obrigatório');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar TODOS os vídeos aprovados do pedido
    const { data: allApprovedVideos, error: videosError } = await supabase
      .from('pedido_videos')
      .select(`
        id,
        video_id,
        slot_position,
        approval_status,
        videos ( id, nome, url )
      `)
      .eq('pedido_id', pedidoId)
      .eq('approval_status', 'approved');

    if (videosError) {
      console.error('❌ [AWS_SYNC] Erro ao buscar vídeos aprovados:', videosError);
      throw new Error(`Erro ao buscar vídeos: ${JSON.stringify(videosError)}`);
    }

    console.log(`✅ [AWS_SYNC] Encontrados ${allApprovedVideos?.length || 0} vídeos aprovados`);

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

    // 3. REGRA CONSOLIDADA: clientId = primeiros 4 dígitos do UUID do prédio (sem hífens)
    const buildingClients = buildingIds.map(uuid => ({
      buildingId: uuid,
      clientId: uuid.replace(/-/g, '').substring(0, 4)
    }));

    console.log('📋 [AWS_SYNC] Client IDs (4 primeiros dígitos UUID):', buildingClients.map(b => b.clientId));

    // 4. Helper para extrair título do vídeo (nome do arquivo sem extensão)
    const extractTitulo = (videoUrl?: string | null): string | null => {
      if (!videoUrl) return null;
      const base = String(videoUrl).split("/").pop() || "";
      const cleaned = base.split("?")[0].split("#")[0].trim();
      return cleaned || null;
    };

    // 5. Encontrar o vídeo que será ativado
    const activeVideo = allApprovedVideos?.find(v => v.video_id === activeVideoId);
    if (!activeVideo) {
      throw new Error(`Vídeo ativo não encontrado: ${activeVideoId}`);
    }

    const tituloAtivo = extractTitulo(activeVideo.videos?.url);
    if (!tituloAtivo) {
      throw new Error(`Não foi possível extrair título do vídeo ativo: ${activeVideo.videos?.url}`);
    }

    console.log(`✅ [AWS_SYNC] Vídeo para ativar: "${tituloAtivo}" (${activeVideoId})`);

    // 6. Coletar títulos de TODOS os outros vídeos aprovados (para desativar)
    const otherTitulos = (allApprovedVideos || [])
      .filter(v => v.video_id !== activeVideoId)
      .map(v => extractTitulo(v.videos?.url))
      .filter(Boolean) as string[];

    console.log(`📋 [AWS_SYNC] Outros vídeos para desativar: ${otherTitulos.length}`, otherTitulos);

    // 7. Montar array de títulos: primeiro o ativo, depois os outros
    const titulos = [tituloAtivo, ...otherTitulos];
    console.log(`📋 [AWS_SYNC] Array titulos para global-toggle-ativo:`, titulos);

    // 8. Chamar global-toggle-ativo para cada clientId
    const toggleResults = [];

    for (const { clientId, buildingId } of buildingClients) {
      console.log(`🔄 [AWS_SYNC] Chamando global-toggle-ativo para clientId: ${clientId}`);

      try {
        const toggleResponse = await supabase.functions.invoke(`global-toggle-ativo/${clientId}`, {
          body: { titulos }
        });

        console.log(`📥 [AWS_SYNC] Resposta global-toggle-ativo (${clientId}):`, toggleResponse);

        if (toggleResponse.error) {
          console.error(`❌ [AWS_SYNC] Erro global-toggle-ativo (${clientId}):`, toggleResponse.error);
          toggleResults.push({
            clientId,
            buildingId,
            success: false,
            error: toggleResponse.error.message
          });
        } else if (toggleResponse.data?.ok) {
          console.log(`✅ [AWS_SYNC] Sucesso global-toggle-ativo (${clientId}):`, toggleResponse.data);
          toggleResults.push({
            clientId,
            buildingId,
            success: true,
            data: toggleResponse.data
          });
        } else {
          console.warn(`⚠️ [AWS_SYNC] Resposta parcial global-toggle-ativo (${clientId}):`, toggleResponse.data);
          toggleResults.push({
            clientId,
            buildingId,
            success: toggleResponse.data?.activated || false,
            data: toggleResponse.data
          });
        }
      } catch (err: any) {
        console.error(`💥 [AWS_SYNC] Exceção global-toggle-ativo (${clientId}):`, err.message);
        toggleResults.push({
          clientId,
          buildingId,
          success: false,
          error: err.message
        });
      }
    }

    // 9. Resumo final
    const successCount = toggleResults.filter(r => r.success).length;
    const failedCount = toggleResults.filter(r => !r.success).length;
    const overallSuccess = failedCount === 0;

    console.log('🔄 [AWS_SYNC] ====== RESULTADO FINAL ======');
    console.log(`📊 [AWS_SYNC] Sucesso geral: ${overallSuccess}`);
    console.log(`📊 [AWS_SYNC] Prédios OK: ${successCount}/${toggleResults.length}`);
    console.log(`📊 [AWS_SYNC] Prédios com falha: ${failedCount}`);
    console.log(`📊 [AWS_SYNC] Vídeo ativado: "${tituloAtivo}"`);
    console.log(`📊 [AWS_SYNC] Vídeos desativados: ${otherTitulos.length}`);

    return new Response(
      JSON.stringify({
        success: overallSuccess,
        video_activated: tituloAtivo,
        videos_deactivated: otherTitulos,
        buildings_success: successCount,
        buildings_failed: failedCount,
        details: toggleResults
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: overallSuccess ? 200 : 207
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
