import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole } from '../../../lib/auth';
import { updatePanelStatus, logVideoPlay, logEmergencyFallback } from '../../../services/playlist';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if user has painel role
  const hasAccess = await checkRole(req, res, 'painel');
  if (!hasAccess) return;

  if (req.method === 'POST') {
    return handleSync(req, res);
  } else if (req.method === 'PUT') {
    return handleVideoPlay(req, res);
  } else if (req.method === 'PATCH') {
    return handleVideoError(req, res);
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

    // Handle offline mode as emergency if specified in details
    if (details && details.connectivity === 'offline') {
      await logEmergencyFallback(panelId, 'offline_mode');
    } else {
      await updatePanelStatus(panelId, status, details);
    }
    
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

// Handle video error reports
async function handleVideoError(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { panelId, videoId, errorCount, errorType } = req.body;
    
    if (!panelId || !videoId) {
      return res.status(400).json({ error: 'Panel ID and Video ID are required' });
    }
    
    // If error count is >= 3, activate emergency protocol
    if (errorCount >= 3) {
      await logEmergencyFallback(panelId, 'video_error');
      
      return res.status(200).json({
        status: 'emergency_activated',
        fallback: true,
        fallback_video_url: "/fallback/indexa_default.mp4",
        message: "Emergency protocol activated due to multiple video errors"
      });
    }
    
    // Otherwise just log the error but don't activate emergency protocol
    await logVideoPlay(panelId, videoId, 0); // Using 0 duration to indicate error
    
    return res.status(200).json({ 
      status: 'error_logged',
      message: `Video error logged. Current error count: ${errorCount}` 
    });
  } catch (error) {
    console.error('Error handling video error:', error);
    return res.status(500).json({ error: 'Error handling video error report' });
  }
}
