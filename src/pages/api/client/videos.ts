
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole, getTokenFromHeader } from '../../../lib/auth';
import { supabase, logUserAction } from '../../../services/supabase';
import { getSignedUploadUrl, uploadFileToS3, validateVideo, updateVideoDuration } from '../../../services/s3';

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
      } else if (req.query.action === 'validate') {
        return validateVideoRequest(req, res);
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

// Validate a video before uploading
async function validateVideoRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { fileSize, fileType } = req.body;
    
    // Check file type
    if (fileType !== 'video/mp4') {
      return res.status(400).json({ 
        isValid: false,
        error: 'Only MP4 videos are allowed' 
      });
    }
    
    // Check file size (100MB max)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (fileSize > maxSize) {
      return res.status(400).json({
        isValid: false, 
        error: 'Video size must be under 100MB' 
      });
    }
    
    return res.status(200).json({ isValid: true });
  } catch (error) {
    console.error('Error validating video:', error);
    return res.status(500).json({ isValid: false, error: 'Error validating video' });
  }
}

// Get videos for a client
async function getVideos(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    
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
    const { fileName, contentType } = req.body;
    
    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate the file type
    if (contentType !== 'video/mp4') {
      return res.status(400).json({ error: 'Only MP4 videos are allowed' });
    }
    
    const uploadData = await getSignedUploadUrl(fileName, contentType, userId);
    
    // Log action
    await logUserAction(
      userId,
      'request_upload_url',
      { file_name: fileName }
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
    const { nome, url, duracao, path } = req.body;
    
    if (!nome || !url) {
      return res.status(400).json({ error: 'Nome and URL are required' });
    }
    
    // Create video record
    const { data, error } = await supabase
      .from('videos')
      .insert([
        {
          client_id: userId,
          nome,
          url,
          duracao: duracao || 0,
          origem: 'cliente',
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
    const { id, nome, duracao } = req.body;
    
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
        nome,
        duracao
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
