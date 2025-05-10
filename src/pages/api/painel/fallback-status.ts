
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole } from '../../../lib/auth';
import { withEmergencyCheck } from '../../../middleware/emergencyModeMiddleware';
import { supabase } from '@/integrations/supabase/client';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if user has painel role or admin role
  const hasAccess = await checkRole(req, res, 'painel') || await checkRole(req, res, 'admin');
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
    
    // Check if emergency mode is active
    const { data: { is_emergency_mode } } = await supabase.rpc('is_emergency_mode');
    
    // Get recent fallback events for this panel
    const { data: recentLogs, error: logsError } = await supabase
      .from('painel_logs')
      .select('*')
      .eq('painel_id', parsedPanelId)
      .eq('status_sincronizacao', 'emergencia')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (logsError) {
      throw logsError;
    }
    
    // Return status and logs
    return res.status(200).json({
      emergency_mode: is_emergency_mode,
      panel_id: parsedPanelId,
      recent_fallback_events: recentLogs || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching fallback status:', error);
    return res.status(500).json({ error: 'Error fetching fallback status' });
  }
}

// Apply emergency check middleware
export default withEmergencyCheck(handler);
