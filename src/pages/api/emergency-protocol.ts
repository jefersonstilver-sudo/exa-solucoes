
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../integrations/supabase/client';
import { securityMonitor } from '../../services/securityMonitoring';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Log all emergency protocol access attempts
  const ip = Array.isArray(req.headers['x-forwarded-for'])
    ? req.headers['x-forwarded-for'][0]
    : req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  
  const userAgent = req.headers['user-agent'] || 'unknown';

  await securityMonitor.logSecurityEvent({
    event_type: 'emergency_protocol_access_attempt',
    description: 'Emergency protocol endpoint accessed',
    ip_address: ip,
    user_agent: userAgent,
    metadata: { method: req.method }
  });

  // Rate limiting for emergency protocol
  if (!securityMonitor.checkRateLimit(`emergency_${ip}`, 3, 3600000)) { // 3 attempts per hour
    return res.status(429).json({ 
      error: 'Too many emergency protocol attempts. Please wait before trying again.',
      lockoutTime: '1 hour'
    });
  }

  switch (req.method) {
    case 'GET':
      return getEmergencyStatus(req, res);
    case 'POST':
      return res.status(403).json({ 
        error: 'Emergency mode activation disabled for security. Use admin panel for system management.' 
      });
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get current emergency mode status (read-only)
async function getEmergencyStatus(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data } = await supabase.rpc('is_emergency_mode');
    const is_emergency_mode = data === true;
    
    return res.status(200).json({ 
      modo_emergencia: is_emergency_mode,
      message: 'Emergency mode status (read-only)'
    });
  } catch (error) {
    console.error('Error checking emergency mode:', error);
    return res.status(500).json({ error: 'Error checking emergency mode status' });
  }
}
