
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole } from '../../../lib/auth';
import { getPanelPlaylist, logEmergencyFallback } from '../../../services/playlist';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    
    const playlist = await getPanelPlaylist(parsedPanelId);
    
    if (!playlist || !playlist.videos || playlist.videos.length === 0) {
      // Emergency protocol - no active campaigns/videos found
      await logEmergencyFallback(parsedPanelId, 'no_campanha');
      
      return res.status(200).json({
        fallback: true,
        fallback_video_url: "/fallback/indexa_default.mp4",
        message: "No active campaigns found. Using fallback video."
      });
    }
    
    return res.status(200).json(playlist);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    
    // Emergency protocol - server error
    if (req.query.panelId) {
      const parsedPanelId = Array.isArray(req.query.panelId) ? req.query.panelId[0] : req.query.panelId;
      await logEmergencyFallback(parsedPanelId, 'server_error');
    }
    
    return res.status(200).json({
      fallback: true,
      fallback_video_url: "/fallback/indexa_default.mp4",
      message: "Server error. Using fallback video."
    });
  }
}
