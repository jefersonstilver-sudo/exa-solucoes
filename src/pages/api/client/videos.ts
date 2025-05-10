
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole, getTokenFromHeader } from '../../../lib/auth';
import { supabase, logUserAction } from '../../../services/supabase';
import { getSignedUploadUrl, uploadFileToS3 } from '../../../services/s3';

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
      return getVideos(req, res, user.id);
    case 'POST':
      if (req.query.action === 'upload-url') {
        return getUploadUrl(req, res, user.id);
      } else {
        return createVideo(req, res, user.id);
      }
    case 'PUT':
      return updateVideo(req, res, user.id);
    case 'DELETE':
      return deleteVideo(req, res, user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get videos for a campaign
async function getVideos(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const campaignId = Array.isArray(req.query.campaignId) ? req.query.campaignId[0] : req.query.campaignId;
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    
    // First check if the campaign belongs to the user
    if (campaignId) {
      const { data: campaign, error: campaignError } = await supabase
        .from('campanhas')
        .select('id')
        .eq('id', campaignId)
        .eq('client_id', userId)
        .single();
        
      if (campaignError || !campaign) {
        return res.status(404).json({ error: 'Campaign not found or access denied' });
      }
    }
    
    if (id) {
      // Get single video
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .eq('client_id', userId)
        .single();
        
      if (error || !data) {
        return res.status(404).json({ error: 'Video not found' });
      }
      
      return res.status(200).json(data);
    } else if (campaignId) {
      // Get all videos for campaign
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      return res.status(200).json(data || []);
    } else {
      // Get all videos for client
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      return res.status(200).json(data || []);
    }
  } catch (error) {
    console.error('Error fetching videos:', error);
    return res.status(500).json({ error: 'Error fetching videos' });
  }
}

// Get pre-signed URL for uploading a video
async function getUploadUrl(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { fileName, contentType, campaignId } = req.body;
    
    if (!fileName || !contentType || !campaignId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if campaign belongs to user
    const { data: campaign, error: campaignError } = await supabase
      .from('campanhas')
      .select('id')
      .eq('id', campaignId)
      .eq('client_id', userId)
      .single();
      
    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found or access denied' });
    }
    
    const uploadData = await getSignedUploadUrl(fileName, contentType);
    
    // Log action
    await logUserAction(
      userId,
      'request_upload_url',
      { campaign_id: campaignId, file_name: fileName }
    );
    
    return res.status(200).json(uploadData);
  } catch (error) {
    console.error('Error getting upload URL:', error);
    return res.status(500).json({ error: 'Error generating upload URL' });
  }
}

// Create a new video record
async function createVideo(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { title, url, duration } = req.body;
    
    if (!title || !url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create video record
    const { data, error } = await supabase
      .from('videos')
      .insert([
        {
          client_id: userId,
          nome: title,
          url: url,
          duracao: duration || 0,
          origem: 'upload',
          status: 'ativo'
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
      'create_video',
      { video_id: data.id }
    );
    
    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating video:', error);
    return res.status(500).json({ error: 'Error creating video' });
  }
}

// Update an existing video
async function updateVideo(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { id, title, duration } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Video ID is required' });
    }
    
    // Check if video belongs to user
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id')
      .eq('id', id)
      .eq('client_id', userId)
      .single();
      
    if (videoError || !video) {
      return res.status(404).json({ error: 'Video not found or access denied' });
    }
    
    // Update video
    const { data, error } = await supabase
      .from('videos')
      .update({
        nome: title,
        duracao: duration
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
      'update_video',
      { video_id: id }
    );
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating video:', error);
    return res.status(500).json({ error: 'Error updating video' });
  }
}

// Delete a video
async function deleteVideo(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    
    if (!id) {
      return res.status(400).json({ error: 'Video ID is required' });
    }
    
    // Check if video belongs to user
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, url')
      .eq('id', id)
      .eq('client_id', userId)
      .single();
      
    if (videoError || !video) {
      return res.status(404).json({ error: 'Video not found or access denied' });
    }
    
    // Extract path from URL
    const urlParts = video.url.split('/');
    const path = urlParts[urlParts.length - 1];
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('videos')
      .remove([path]);
      
    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue anyway as the database record is more important
    }
    
    // Delete video record
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);
      
    if (error) {
      throw error;
    }
    
    // Log action
    await logUserAction(
      userId,
      'delete_video',
      { video_id: id }
    );
    
    return res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    return res.status(500).json({ error: 'Error deleting video' });
  }
}
