
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole } from '../../../lib/auth';
import { updatePanelStatus, logVideoPlay } from '../../../services/playlist';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if user has painel role
  const hasAccess = await checkRole(req, res, 'painel');
  if (!hasAccess) return;

  if (req.method === 'POST') {
    return handleSync(req, res);
  } else if (req.method === 'PUT') {
    return handleVideoPlay(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Handle panel sync/heartbeat
async function handleSync(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { panelId, status, details } = req.body;
    
    if (!panelId || !status) {
      return res.status(400).json({ error: 'Panel ID and status are required' });
    }
    
    await updatePanelStatus(panelId, status, details);
    
    // Return current time for panel to sync
    return res.status(200).json({ 
      serverTime: new Date().toISOString(),
      received: {
        panelId,
        status,
        details
      }
    });
  } catch (error) {
    console.error('Error updating panel status:', error);
    return res.status(500).json({ error: 'Error updating panel status' });
  }
}

// Handle video play logs
async function handleVideoPlay(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { panelId, videoId, playDuration } = req.body;
    
    if (!panelId || !videoId || playDuration === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await logVideoPlay(panelId, videoId, playDuration);
    
    return res.status(200).json({ message: 'Video play logged successfully' });
  } catch (error) {
    console.error('Error logging video play:', error);
    return res.status(500).json({ error: 'Error logging video play' });
  }
}
