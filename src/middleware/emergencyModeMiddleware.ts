
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

/**
 * Middleware that checks if the system is in emergency mode
 * If it is, it blocks all requests except for the emergency protocol route
 */
export function withEmergencyCheck(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Skip check for the emergency protocol route itself
    if (req.url?.includes('/57303905503127900')) {
      return handler(req, res);
    }
    
    // Check if system is in emergency mode - correctly using RPC
    const { data } = await supabase.rpc('is_emergency_mode');
    const is_emergency_mode = data === true;
    
    if (is_emergency_mode) {
      return res.status(503).json({ 
        error: 'Emergency mode activated',
        message: 'System is in emergency lockdown. Access is restricted.'
      });
    }
    
    // System not in emergency mode, proceed normally
    return handler(req, res);
  };
}
