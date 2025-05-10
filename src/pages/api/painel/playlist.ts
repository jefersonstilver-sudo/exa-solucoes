
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
      // Log that emergency mode is active - fixed to not use array
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
    
    // Normal mode - get regular playlist
    const playlist = await getPanelPlaylist(parsedPanelId);
    
    if (!playlist) {
      // No active playlist - use fallback - fixed to not use array
      await supabase
        .from('painel_logs')
        .insert({
          painel_id: parsedPanelId,
          status_sincronizacao: 'emergencia',
          timestamp: new Date().toISOString()
        });
        
      return res.status(200).json({
        fallback: true,
        fallback_video_url: "/fallback/indexa_default.mp4",
        reason: "no_campanha"
      });
    }
    
    return res.status(200).json(playlist);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return res.status(500).json({ error: 'Error fetching playlist' });
  }
}

// Apply emergency check middleware
export default withEmergencyCheck(handler);
