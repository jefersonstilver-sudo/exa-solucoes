
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole } from '../../../lib/auth';
import { supabase } from '../../../services/supabase';

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
    
    // Get panel status
    const { data: panel, error: panelError } = await supabase
      .from('painels')
      .select('status')
      .eq('id', parsedPanelId)
      .single();
      
    if (panelError) {
      throw panelError;
    }
    
    // Check if there was an emergency log in the last 15 minutes
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
    
    const { data: emergencyLogs, error: logsError } = await supabase
      .from('painel_logs')
      .select('id, status_sincronizacao, timestamp')
      .eq('painel_id', parsedPanelId)
      .eq('status_sincronizacao', 'emergencia')
      .gte('timestamp', fifteenMinutesAgo.toISOString())
      .order('timestamp', { ascending: false });
      
    if (logsError) {
      throw logsError;
    }
    
    // Check if panel is in emergency mode
    const isEmergency = panel?.status === 'emergencia' || (emergencyLogs && emergencyLogs.length > 0);
    
    return res.status(200).json({
      panelId: parsedPanelId,
      status: isEmergency ? 'emergency' : 'normal',
      fallback_active: isEmergency,
      fallback_reason: isEmergency && emergencyLogs && emergencyLogs.length > 0 
        ? emergencyLogs[0].status_sincronizacao 
        : null,
      fallback_until: isEmergency && emergencyLogs && emergencyLogs.length > 0
        ? new Date(new Date(emergencyLogs[0].timestamp).getTime() + 15 * 60 * 1000).toISOString()
        : null
    });
  } catch (error) {
    console.error('Error checking fallback status:', error);
    return res.status(500).json({ error: 'Error checking fallback status' });
  }
}
