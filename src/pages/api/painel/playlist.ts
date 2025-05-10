
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole } from '../../../lib/auth';
import { getPanelPlaylist } from '../../../services/playlist';

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
    
    if (!playlist) {
      return res.status(404).json({ error: 'No active playlist found for this panel' });
    }
    
    return res.status(200).json(playlist);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return res.status(500).json({ error: 'Error fetching playlist' });
  }
}
