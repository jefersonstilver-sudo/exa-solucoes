
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Interface for upload response
 */
interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
  videoId?: string;
}

/**
 * Interface for video validation
 */
interface VideoValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Generates a signed URL for direct upload to S3
 * @param fileName Name of the file to upload
 * @param contentType MIME type of the file
 * @param clientId ID of the client uploading the file
 * @param bucket S3/Supabase Storage bucket name
 * @returns Object with signed URL and other upload details
 */
export const getSignedUploadUrl = async (
  fileName: string,
  contentType: string,
  clientId: string,
  bucket: string = 'videos'
): Promise<{ url: string; fields: Record<string, string> }> => {
  try {
    // Create a unique path with client_id and timestamp
    const timestamp = Date.now();
    const nameSlug = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const path = `${clientId}/${nameSlug}_${timestamp}_${fileName}`;
    
    // For Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
    
    if (error) throw error;
    
    return {
      url: data.signedUrl,
      fields: { ...data, fileUrl: `${bucket}/${path}`, path }
    };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate upload URL');
  }
};

/**
 * Validates a video file for upload
 * @param file File to validate
 * @returns VideoValidation with validation results
 */
export const validateVideo = (file: File): VideoValidation => {
  // Check file type
  if (file.type !== 'video/mp4') {
    return {
      isValid: false,
      error: 'Only MP4 videos are allowed'
    };
  }
  
  // Check file size (100MB max)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Video size must be under 100MB'
    };
  }
  
  return { isValid: true };
};

/**
 * Uploads a file to S3/Supabase Storage using a pre-signed URL
 * @param file File to upload
 * @param clientId ID of the client uploading the file
 * @param nome Name to be used for the video record
 * @param bucket S3/Supabase Storage bucket name
 * @returns UploadResponse with success status and URL or error
 */
export const uploadFileToS3 = async (
  file: File,
  clientId: string,
  nome: string,
  bucket: string = 'videos'
): Promise<UploadResponse> => {
  try {
    // Validate the file
    const validation = validateVideo(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }
    
    // Create a unique path with client_id and timestamp
    const timestamp = Date.now();
    const nameSlug = nome.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const path = `${clientId}/${nameSlug}_${timestamp}.mp4`;
    
    // Upload to Supabase Storage
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: 'video/mp4',
      cacheControl: '3600'
    });
    
    if (error) throw error;
    
    // Get public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    
    // Create a record in the videos table
    const { data: videoData, error: videoError } = await supabase
      .from('videos')
      .insert([
        {
          client_id: clientId,
          nome,
          url: data.publicUrl,
          origem: 'cliente',
          status: 'ativo',
          duracao: 0 // Will be updated once video metadata is extracted
        }
      ])
      .select()
      .single();
      
    if (videoError) throw videoError;
    
    return {
      success: true,
      url: data.publicUrl,
      videoId: videoData.id
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: 'File upload failed'
    };
  }
};

/**
 * Gets a temporary public URL for a file in S3/Supabase Storage
 * @param path Path to the file in the bucket
 * @param bucket S3/Supabase Storage bucket name
 * @returns URL to access the file
 */
export const getPublicUrl = async (
  path: string,
  bucket: string = 'videos'
): Promise<string> => {
  // For Supabase Storage
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Updates video duration in the database
 * @param videoId ID of the video record
 * @param duracao Duration in seconds
 * @returns Promise resolving to success status
 */
export const updateVideoDuration = async (
  videoId: string,
  duracao: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('videos')
      .update({ duracao })
      .eq('id', videoId);
      
    return !error;
  } catch (error) {
    console.error('Error updating video duration:', error);
    return false;
  }
};
