
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole } from '../../../lib/auth';
import { getPanelPlaylist } from '../../../services/playlist';
import { withEmergencyCheck } from '../../../middleware/emergencyModeMiddleware';
import { supabase } from '@/integrations/supabase/client';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if user has painel role
  const hasAccess = await checkRole(req, res, 'painel');
  if (!hasAccess) return;

  // Only GET requests allowed
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { panelId } = req.query;
    
    if (!panelId) {
      return res.status(400).json({ error: 'Panel ID is required' });
    }
    
    // Normalize panelId to string
    const parsedPanelId = Array.isArray(panelId) ? panelId[0] : panelId;
    
    // Check if emergency mode is active - correctly using RPC
    const { data } = await supabase.rpc('is_emergency_mode');
    const is_emergency_mode = data === true;
    
    if (is_emergency_mode) {
      // Log that emergency mode is active
      await supabase
        .from('painel_logs')
        .insert({
          painel_id: parsedPanelId,
          status_sincronizacao: 'emergencia',
          timestamp: new Date().toISOString()
        });
      
      // Return emergency fallback playlist
      return res.status(200).json({
        emergency: true,
        message: "Painel temporariamente desativado por segurança.",
        videos: [
          {
            url: "https://storage.indexa.com.br/institucional/painel-bloqueado.mp4",
            nome: "Indexa Lockdown",
            duracao: 30
          }
        ]
      });
    }
    
    // Buscar pedidos ativos para este painel
    const startTime = Date.now();
    
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id, client_id, valor_total, status, data_fim')
      .contains('lista_paineis', [parsedPanelId])
      .in('status', ['video_aprovado', 'pago_pendente_video', 'video_enviado', 'pago'])
      .gte('data_fim', new Date().toISOString().split('T')[0]);
    
    if (pedidosError) {
      console.error('Erro ao buscar pedidos:', pedidosError);
    }
    
    const queryTime = Date.now() - startTime;
    console.log(`⚡ [PLAYLIST API] Query concluída em ${queryTime}ms`);
    
    // Se há pedidos ativos, buscar vídeo atual
    if (pedidos && pedidos.length > 0) {
      const pedido = pedidos[0];
      
      const { data: currentVideo, error: videoError } = await supabase
        .rpc('get_current_display_video', { p_pedido_id: pedido.id });
      
      if (videoError) {
        console.error('Erro ao buscar vídeo atual:', videoError);
      }
      
      // RPC retorna um array, pegar o primeiro item
      const videoInfo = Array.isArray(currentVideo) && currentVideo.length > 0 ? currentVideo[0] : null;
      
      if (videoInfo && (videoInfo as any).video_id) {
        const { data: videoData } = await supabase
          .from('videos')
          .select('url, nome, duracao')
          .eq('id', (videoInfo as any).video_id)
          .single();
        
        if (videoData) {
          await supabase
            .from('painel_logs')
            .insert({
              painel_id: parsedPanelId,
              status_sincronizacao: 'ativo_com_contrato',
              timestamp: new Date().toISOString()
            });
          
          return res.status(200).json({
            active_contract: true,
            videos: [
              {
                url: videoData.url,
                nome: videoData.nome,
                duracao: videoData.duracao
              }
            ]
          });
        }
      }
    }
    
    // Fallback para contratos expirados - vídeo institucional
    await supabase
      .from('painel_logs')
      .insert({
        painel_id: parsedPanelId,
        status_sincronizacao: 'contrato_expirado',
        timestamp: new Date().toISOString()
      });
      
    return res.status(200).json({
      contract_expired: true,
      fallback_video_url: "/fallback/indexa_default.mp4",
      reason: "contrato_expirado",
      message: "Contrato expirado - exibindo vídeo institucional"
    });
    
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return res.status(500).json({ error: 'Error fetching playlist' });
  }
}

// Apply emergency check middleware
export default withEmergencyCheck(handler);
