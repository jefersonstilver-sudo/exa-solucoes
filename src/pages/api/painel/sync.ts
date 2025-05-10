
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole } from '../../../lib/auth';
import { updatePanelStatus, logVideoPlay } from '../../../services/playlist';
import { withEmergencyCheck } from '../../../middleware/emergencyModeMiddleware';
import { supabase } from '@/integrations/supabase/client';

async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    
    await updatePanelStatus(panelId, status, details);
    
    // Check if emergency mode is active
    const { data: { is_emergency_mode } } = await supabase.rpc('is_emergency_mode');
    
    // Return current time for panel to sync
    return res.status(200).json({ 
      serverTime: new Date().toISOString(),
      emergency_mode: is_emergency_mode,
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

// Handle video errors (new)
async function handleVideoError(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { panelId, videoId, error_type, error_message } = req.body;
    
    if (!panelId || !videoId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Log video error
    await supabase
      .from('painel_logs')
      .insert([
        {
          painel_id: panelId,
          status_sincronizacao: 'video_error',
          uso_cpu: 0,
          temperatura: 0
        }
      ]);
    
    return res.status(200).json({ 
      message: 'Video error logged successfully',
      fallback_mode: true,
      fallback_video: "/fallback/indexa_default.mp4" 
    });
  } catch (error) {
    console.error('Error handling video error:', error);
    return res.status(500).json({ error: 'Error handling video error' });
  }
}

// Apply emergency check middleware
export default withEmergencyCheck(handler);
