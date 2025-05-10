
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole, getTokenFromHeader } from '../../../lib/auth';
import { supabase, logUserAction } from '../../../services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if user has client role
  const hasAccess = await checkRole(req, res, 'client');
  if (!hasAccess) return;

  // Get user ID from token
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getCampanhas(req, res, user.id);
    case 'POST':
      return createCampanha(req, res, user.id);
    case 'PUT':
      return updateCampanha(req, res, user.id);
    case 'DELETE':
      return deleteCampanha(req, res, user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get campanha for the authenticated client
async function getCampanhas(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    // Check if a specific campanha ID is requested
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    
    if (id) {
      // Get single campanha
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .eq('id', id)
        .eq('client_id', userId)
        .single();
        
      if (error) {
        return res.status(404).json({ error: 'Campanha not found' });
      }
      
      return res.status(200).json(data);
    } else {
      // Get all campanhas for this client
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      return res.status(200).json(data || []);
    }
  } catch (error) {
    console.error('Error fetching campanhas:', error);
    return res.status(500).json({ error: 'Error fetching campanhas' });
  }
}

// Create a new campanha
async function createCampanha(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { video_id, painel_id, data_inicio, data_fim, obs } = req.body;
    
    if (!video_id || !painel_id || !data_inicio || !data_fim) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create campanha using the correct field names according to the schema
    const { data, error } = await supabase
      .from('campanhas')
      .insert([
        {
          client_id: userId,
          video_id,
          painel_id,
          data_inicio,
          data_fim,
          obs,
          status: 'pendente'
        }
      ])
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    // Log action
    await logUserAction(
      userId,
      'create_campanha',
      { campanha_id: data.id }
    );
    
    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating campanha:', error);
    return res.status(500).json({ error: 'Error creating campanha' });
  }
}

// Update an existing campanha
async function updateCampanha(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { id, video_id, painel_id, data_inicio, data_fim, obs, status } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Campanha ID is required' });
    }
    
    // Check if campanha belongs to user
    const { data: campanha, error: checkError } = await supabase
      .from('campanhas')
      .select('id')
      .eq('id', id)
      .eq('client_id', userId)
      .single();
      
    if (checkError || !campanha) {
      return res.status(404).json({ error: 'Campanha not found' });
    }
    
    // Update campanha
    const { data, error } = await supabase
      .from('campanhas')
      .update({
        video_id,
        painel_id,
        data_inicio,
        data_fim,
        obs,
        status
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    // Log action
    await logUserAction(
      userId,
      'update_campanha',
      { campanha_id: id }
    );
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating campanha:', error);
    return res.status(500).json({ error: 'Error updating campanha' });
  }
}

// Delete a campanha
async function deleteCampanha(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    
    if (!id) {
      return res.status(400).json({ error: 'Campanha ID is required' });
    }
    
    // Check if campanha belongs to user
    const { data: campanha, error: checkError } = await supabase
      .from('campanhas')
      .select('id')
      .eq('id', id)
      .eq('client_id', userId)
      .single();
      
    if (checkError || !campanha) {
      return res.status(404).json({ error: 'Campanha not found' });
    }
    
    // Delete campanha
    const { error } = await supabase
      .from('campanhas')
      .delete()
      .eq('id', id);
      
    if (error) {
      throw error;
    }
    
    // Log action
    await logUserAction(
      userId,
      'delete_campanha',
      { campanha_id: id }
    );
    
    return res.status(200).json({ message: 'Campanha deleted successfully' });
  } catch (error) {
    console.error('Error deleting campanha:', error);
    return res.status(500).json({ error: 'Error deleting campanha' });
  }
}
