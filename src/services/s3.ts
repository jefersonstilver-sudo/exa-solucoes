
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Interface for upload response
 */
interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Generates a signed URL for direct upload to S3
 * @param fileName Name of the file to upload
 * @param contentType MIME type of the file
 * @param bucket S3/Supabase Storage bucket name
 * @returns Object with signed URL and other upload details
 */
export const getSignedUploadUrl = async (
  fileName: string,
  contentType: string,
  bucket: string = 'videos'
): Promise<{ url: string; fields: Record<string, string> }> => {
  try {
    // For Supabase Storage
    const path = `${Date.now()}_${fileName}`;
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
    
    if (error) throw error;
    
    return {
      url: data.signedUrl,
      fields: { ...data, fileUrl: `${bucket}/${path}` }
    };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate upload URL');
  }
};

/**
 * Uploads a file to S3/Supabase Storage using a pre-signed URL
 * @param file File to upload
 * @param contentType MIME type of the file
 * @param bucket S3/Supabase Storage bucket name
 * @returns UploadResponse with success status and URL or error
 */
export const uploadFileToS3 = async (
  file: File,
  contentType: string,
  bucket: string = 'videos'
): Promise<UploadResponse> => {
  try {
    // Validate file
    if (!validateFile(file)) {
      return {
        success: false,
        error: 'Invalid file type or size'
      };
    }
    
    const path = `${Date.now()}_${file.name}`;
    
    // Upload to Supabase Storage
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType,
      cacheControl: '3600'
    });
    
    if (error) throw error;
    
    // Get public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    
    return {
      success: true,
      url: data.publicUrl
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
 * Validates a file for allowed types and size
 * @param file File to validate
 * @returns Boolean indicating if file is valid
 */
const validateFile = (file: File): boolean => {
  const allowedTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ];
  
  const maxSize = 500 * 1024 * 1024; // 500MB
  
  return allowedTypes.includes(file.type) && file.size <= maxSize;
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
