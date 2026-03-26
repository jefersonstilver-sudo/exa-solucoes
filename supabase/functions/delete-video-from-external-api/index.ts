import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface DeleteRequest {
  video_id: string;
  pedido_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🗑️ [DELETE_EXTERNAL_API] Iniciando deleção de vídeo na AWS');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { video_id, pedido_id }: DeleteRequest = await req.json();

    if (!video_id || !pedido_id) {
      throw new Error('video_id e pedido_id são obrigatórios');
    }

    // 1. Buscar informações do vídeo e lista de prédios
    const { data: pedidoVideo, error: pvError } = await supabase
      .from('pedido_videos')
      .select(`
        videos(url, nome),
        pedidos(lista_predios)
      `)
      .eq('video_id', video_id)
      .eq('pedido_id', pedido_id)
      .single();

    if (pvError || !pedidoVideo) {
      console.error('❌ [DELETE_EXTERNAL_API] Vídeo não encontrado:', pvError);
      throw new Error('Vídeo não encontrado');
    }

    // 2. Extrair lista de prédios
    const buildings = pedidoVideo.pedidos.lista_predios as string[];
    if (!buildings || buildings.length === 0) {
      throw new Error('Nenhum prédio associado ao pedido');
    }

    console.log(`🏢 [DELETE_EXTERNAL_API] Pedido tem ${buildings.length} prédio(s)`);

    // 3. Extrair nome do arquivo do Storage URL
    const storageUrl = pedidoVideo.videos.url;
    const fileName = storageUrl.split('/').pop()?.split('?')[0] || '';

    if (!fileName) {
      throw new Error('Nome do arquivo não encontrado na URL do Storage');
    }

    console.log(`📁 [DELETE_EXTERNAL_API] Arquivo a deletar: ${fileName}`);

    // 4. Deletar de TODOS os prédios — usando Promise.allSettled para resiliência
    const deletePromises = buildings.map(async (buildingUuid: string) => {
      const clientId = buildingUuid.replace(/-/g, '').substring(0, 4);
      const deleteUrl = `http://18.228.252.149:8000/propagandas/admin/delete-propaganda/${clientId}`;
      
      console.log(`🔄 [DELETE_EXTERNAL_API] Deletando de prédio ${buildingUuid} (clientId: ${clientId}), video_name: ${fileName}`);

      const formData = new FormData();
      formData.append('video_name', fileName);

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [DELETE_EXTERNAL_API] Erro ao deletar do prédio ${buildingUuid}:`, errorText);
        throw new Error(`AWS API erro para prédio ${buildingUuid} (${clientId}): ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log(`✅ [DELETE_EXTERNAL_API] Deletado de prédio ${buildingUuid} (clientId: ${clientId})`);
      return { buildingUuid, clientId, success: true };
    });

    const settled = await Promise.allSettled(deletePromises);

    const successes = settled.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<any>).value);
    const failures = settled.filter(r => r.status === 'rejected').map(r => ({
      error: (r as PromiseRejectedResult).reason?.message || 'Erro desconhecido'
    }));

    console.log(`✅ [DELETE_EXTERNAL_API] Resultado: ${successes.length} sucesso(s), ${failures.length} falha(s)`);

    return new Response(
      JSON.stringify({
        success: failures.length === 0,
        partial: failures.length > 0 && successes.length > 0,
        deleted_file: fileName,
        buildings_count: successes.length,
        failed_count: failures.length,
        successes,
        failures
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [DELETE_EXTERNAL_API] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
