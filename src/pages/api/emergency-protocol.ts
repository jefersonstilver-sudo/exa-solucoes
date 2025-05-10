
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole } from '../../lib/auth';
import { supabase } from '../../services/supabase';
import * as bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if user has admin role - this is required for both activating and deactivating
  const hasAccess = await checkRole(req, res, 'admin');
  if (!hasAccess) return;

  switch (req.method) {
    case 'GET':
      return getEmergencyStatus(req, res);
    case 'POST':
      return toggleEmergencyMode(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get current emergency mode status
async function getEmergencyStatus(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data: { is_emergency_mode } } = await supabase.rpc('is_emergency_mode');
    
    return res.status(200).json({ 
      modo_emergencia: is_emergency_mode 
    });
  } catch (error) {
    console.error('Error checking emergency mode:', error);
    return res.status(500).json({ error: 'Error checking emergency mode status' });
  }
}

// Toggle emergency mode with seed phrase validation
async function toggleEmergencyMode(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { seedPhrase } = req.body;
    
    if (!seedPhrase) {
      return res.status(400).json({ error: 'Seed phrase is required' });
    }
    
    // Get current configuration with stored hash
    const { data: config, error: configError } = await supabase
      .from('configuracoes_sistema')
      .select('seed_hash, modo_emergencia')
      .single();
      
    if (configError || !config) {
      return res.status(500).json({ error: 'Error retrieving system configuration' });
    }
    
    // Validate seed phrase
    const isValid = await bcrypt.compare(seedPhrase, config.seed_hash);
    
    if (!isValid) {
      // Log invalid attempt
      await supabase
        .from('log_eventos_sistema')
        .insert([
          {
            tipo_evento: 'emergency_invalid_attempt',
            descricao: 'Invalid seed phrase provided',
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            user_agent: req.headers['user-agent']
          }
        ]);
        
      return res.status(401).json({ error: 'Invalid seed phrase' });
    }
    
    // Toggle emergency mode
    const newMode = !config.modo_emergencia;
    
    const { error: updateError } = await supabase
      .from('configuracoes_sistema')
      .update({ 
        modo_emergencia: newMode,
        updated_at: new Date().toISOString()
      });
      
    if (updateError) {
      return res.status(500).json({ error: 'Error updating emergency mode' });
    }
    
    // Log the event
    await supabase
      .from('log_eventos_sistema')
      .insert([
        {
          tipo_evento: newMode ? 'emergency_activated' : 'emergency_deactivated',
          descricao: newMode ? 'Emergency mode activated' : 'Emergency mode deactivated',
          ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          user_agent: req.headers['user-agent']
        }
      ]);
    
    return res.status(200).json({ 
      success: true, 
      modo_emergencia: newMode,
      message: newMode 
        ? 'Emergency protocol activated successfully' 
        : 'Emergency protocol deactivated successfully'
    });
  } catch (error) {
    console.error('Error toggling emergency mode:', error);
    return res.status(500).json({ error: 'Error processing request' });
  }
}
