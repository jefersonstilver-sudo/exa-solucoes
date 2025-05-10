
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole } from '../../../lib/auth';
import { supabase, logUserAction } from '../../../services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if user has admin role
  const hasAccess = await checkRole(req, res, 'admin');
  if (!hasAccess) return;

  switch (req.method) {
    case 'GET':
      return getQrCodes(req, res);
    case 'POST':
      return createQrCode(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get QR codes with optional filtering by campaign
async function getQrCodes(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { campanhaId } = req.query;
    
    // Normalize query parameters
    const parsedCampanhaId = Array.isArray(campanhaId) ? campanhaId[0] : campanhaId;
    
    // Build query
    let query = supabase
      .from('qr_codes')
      .select(`
        *,
        campanhas (id, client_id, status, data_inicio, data_fim)
      `);
      
    // Apply filters if provided
    if (parsedCampanhaId) {
      query = query.eq('campanha_id', parsedCampanhaId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return res.status(500).json({ error: 'Error fetching QR codes' });
  }
}

// Create a new QR code
async function createQrCode(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { campanha_id, url } = req.body;
    
    if (!campanha_id || !url) {
      return res.status(400).json({ error: 'Campaign ID and URL are required' });
    }
    
    const { data, error } = await supabase
      .from('qr_codes')
      .insert([
        {
          campanha_id,
          url,
          total_scans: 0
        }
      ])
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    // Log action
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await logUserAction(
          user.id,
          'create_qr_code',
          { qr_code_id: data.id }
        );
      }
    }
    
    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating QR code:', error);
    return res.status(500).json({ error: 'Error creating QR code' });
  }
}
