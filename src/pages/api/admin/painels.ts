
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole } from '../../../lib/auth';
import { supabase, logUserAction } from '../../../services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if user has admin role
  const hasAccess = await checkRole(req, res, 'admin');
  if (!hasAccess) return;

  switch (req.method) {
    case 'GET':
      return getPainels(req, res);
    case 'POST':
      return createPainel(req, res);
    case 'PUT':
      return updatePainel(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get all painels with optional filtering
async function getPainels(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { buildingId, status } = req.query;
    
    // Normalize query parameters
    const parsedBuildingId = Array.isArray(buildingId) ? buildingId[0] : buildingId;
    const parsedStatus = Array.isArray(status) ? status[0] : status;
    
    // Build query
    let query = supabase
      .from('painels')
      .select(`
        *,
        buildings (id, nome, bairro, endereco)
      `);
      
    // Apply filters if provided
    if (parsedBuildingId) {
      query = query.eq('building_id', parsedBuildingId);
    }
    
    if (parsedStatus) {
      query = query.eq('status', parsedStatus);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Error fetching painels:', error);
    return res.status(500).json({ error: 'Error fetching painels' });
  }
}

// Create a new painel
async function createPainel(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { building_id, code, resolucao, modo } = req.body;
    
    if (!building_id || !code) {
      return res.status(400).json({ error: 'Building ID and code are required' });
    }
    
    const { data: existingPainel, error: checkError } = await supabase
      .from('painels')
      .select('id')
      .eq('code', code)
      .single();
      
    if (existingPainel) {
      return res.status(409).json({ error: 'A painel with this code already exists' });
    }
    
    const { data, error } = await supabase
      .from('painels')
      .insert([
        {
          building_id,
          code,
          resolucao,
          modo,
          status: 'offline'
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
          'create_painel',
          { painel_id: data.id }
        );
      }
    }
    
    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating painel:', error);
    return res.status(500).json({ error: 'Error creating painel' });
  }
}

// Update an existing painel
async function updatePainel(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, building_id, code, resolucao, modo, status } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Painel ID is required' });
    }
    
    const { data, error } = await supabase
      .from('painels')
      .update({
        building_id,
        code,
        resolucao,
        modo,
        status
      })
      .eq('id', id)
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
          'update_painel',
          { painel_id: id }
        );
      }
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating painel:', error);
    return res.status(500).json({ error: 'Error updating painel' });
  }
}
