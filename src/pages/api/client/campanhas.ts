
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
      return getCampaigns(req, res, user.id);
    case 'POST':
      return createCampaign(req, res, user.id);
    case 'PUT':
      return updateCampaign(req, res, user.id);
    case 'DELETE':
      return deleteCampaign(req, res, user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get campaigns for the authenticated client
async function getCampaigns(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    // Check if a specific campaign ID is requested
    const { id } = req.query;
    
    if (id) {
      // Get single campaign
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .eq('id', String(id))
        .eq('client_id', userId)
        .single();
        
      if (error) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      return res.status(200).json(data);
    } else {
      // Get all campaigns for this client
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
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({ error: 'Error fetching campaigns' });
  }
}

// Create a new campaign
async function createCampaign(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { title, description, start_date, end_date, video_id, painel_id } = req.body;
    
    if (!video_id || !painel_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create campaign using the correct field names according to the schema
    const { data, error } = await supabase
      .from('campanhas')
      .insert([
        {
          client_id: userId,
          video_id: video_id,
          painel_id: painel_id,
          data_inicio: start_date,
          data_fim: end_date,
          obs: description,
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
      'create_campaign',
      { campaign_id: data.id }
    );
    
    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({ error: 'Error creating campaign' });
  }
}

// Update an existing campaign
async function updateCampaign(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { id, video_id, painel_id, data_inicio, data_fim, obs, status } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }
    
    // Check if campaign belongs to user
    const { data: campaign, error: checkError } = await supabase
      .from('campanhas')
      .select('id')
      .eq('id', id)
      .eq('client_id', userId)
      .single();
      
    if (checkError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Update campaign
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
      'update_campaign',
      { campaign_id: id }
    );
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return res.status(500).json({ error: 'Error updating campaign' });
  }
}

// Delete a campaign
async function deleteCampaign(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }
    
    // Check if campaign belongs to user
    const { data: campaign, error: checkError } = await supabase
      .from('campanhas')
      .select('id')
      .eq('id', id)
      .eq('client_id', userId)
      .single();
      
    if (checkError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Delete campaign
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
      'delete_campaign',
      { campaign_id: id }
    );
    
    return res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return res.status(500).json({ error: 'Error deleting campaign' });
  }
}
