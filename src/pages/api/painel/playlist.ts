
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
    
    // NOVA FUNCIONALIDADE: Verificar contratos ativos para o painel
    // Buscar vídeos ativos de contratos válidos para este painel
    const { data: activeVideos, error: videosError } = await supabase
      .from('pedido_videos')
      .select(`
        *,
        video:videos(*),
        pedido:pedidos(*)
      `)
      .eq('selected_for_display', true)
      .eq('approval_status', 'approved')
      .eq('pedidos.status', 'ativo')
      .gte('pedidos.data_fim', new Date().toISOString().split('T')[0])
      .contains('pedidos.lista_paineis', [parsedPanelId]);
    
    if (videosError) {
      console.error('Erro ao buscar vídeos ativos:', videosError);
    }
    
    // Se há vídeos de contratos ativos, usar eles
    if (activeVideos && Array.isArray(activeVideos) && activeVideos.length > 0) {
      const videoData = activeVideos[0];
      
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
            url: videoData.video?.url,
            nome: videoData.video?.nome,
            duracao: videoData.video?.duracao
          }
        ]
      });
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
