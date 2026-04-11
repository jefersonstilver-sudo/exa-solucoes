import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const EXTERNAL_API_BASE = 'http://18.228.252.149:8000';

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

    // 7. Coletar todos os client_ids (prefixos 4 chars)
    const allClientIds = buildingClients.map(b => b.clientId);
    console.log(`📋 [AWS_SYNC] Client IDs para batch:`, allClientIds);

    // 8. Chamar PATCH /ativo/batch para ATIVAR o vídeo selecionado em todos os prédios
    const batchResults = [];

    try {
      console.log(`🔄 [AWS_SYNC] BATCH ATIVAR: "${tituloAtivo}" em ${allClientIds.length} prédios`);
      const activateResponse = await fetch(`${EXTERNAL_API_BASE}/ativo/batch`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_ids: allClientIds,
          titulo: tituloAtivo,
          ativo: true
        })
      });
      const activateData = await activateResponse.json().catch(() => null);
      console.log(`📥 [AWS_SYNC] Resposta ATIVAR (${activateResponse.status}):`, activateData);
      batchResults.push({ action: 'activate', titulo: tituloAtivo, status: activateResponse.status, success: activateResponse.ok, data: activateData });
    } catch (err: any) {
      console.error(`💥 [AWS_SYNC] Erro batch ATIVAR:`, err.message);
      batchResults.push({ action: 'activate', titulo: tituloAtivo, success: false, error: err.message });
    }

    // 9. Chamar PATCH /ativo/batch para DESATIVAR cada outro vídeo em todos os prédios
    for (const otherTitulo of otherTitulos) {
      try {
        console.log(`🔄 [AWS_SYNC] BATCH DESATIVAR: "${otherTitulo}" em ${allClientIds.length} prédios`);
        const deactivateResponse = await fetch(`${EXTERNAL_API_BASE}/ativo/batch`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_ids: allClientIds,
            titulo: otherTitulo,
            ativo: false
          })
        });
        const deactivateData = await deactivateResponse.json().catch(() => null);
        console.log(`📥 [AWS_SYNC] Resposta DESATIVAR "${otherTitulo}" (${deactivateResponse.status}):`, deactivateData);
        batchResults.push({ action: 'deactivate', titulo: otherTitulo, status: deactivateResponse.status, success: deactivateResponse.ok, data: deactivateData });
      } catch (err: any) {
        console.error(`💥 [AWS_SYNC] Erro batch DESATIVAR "${otherTitulo}":`, err.message);
        batchResults.push({ action: 'deactivate', titulo: otherTitulo, success: false, error: err.message });
      }
    }

    // 10. Resumo final
    const successCount = batchResults.filter(r => r.success).length;
    const failedCount = batchResults.filter(r => !r.success).length;
    const overallSuccess = failedCount === 0;

    console.log('🔄 [AWS_SYNC] ====== RESULTADO FINAL ======');
    console.log(`📊 [AWS_SYNC] Sucesso geral: ${overallSuccess}`);
    console.log(`📊 [AWS_SYNC] Chamadas OK: ${successCount}/${batchResults.length}`);
    console.log(`📊 [AWS_SYNC] Chamadas com falha: ${failedCount}`);
    console.log(`📊 [AWS_SYNC] Vídeo ativado: "${tituloAtivo}"`);
    console.log(`📊 [AWS_SYNC] Vídeos desativados: ${otherTitulos.length}`);

    return new Response(
      JSON.stringify({
        success: overallSuccess,
        video_activated: tituloAtivo,
        videos_deactivated: otherTitulos,
        batch_calls_success: successCount,
        batch_calls_failed: failedCount,
        client_ids: allClientIds,
        details: batchResults
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
