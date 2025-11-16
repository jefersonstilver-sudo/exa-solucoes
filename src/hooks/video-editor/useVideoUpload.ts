import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AssetType } from '@/types/videoEditor';

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

const MAX_DURATION = 15; // seconds
const MAX_FILE_SIZE = {
  video: 100 * 1024 * 1024, // 100MB
  image: 10 * 1024 * 1024,  // 10MB
  audio: 20 * 1024 * 1024   // 20MB
};

/**
 * Hook for uploading video editor assets
 */
export const useVideoUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const queryClient = useQueryClient();

  // Validate file
  const validateFile = async (file: File, type: AssetType): Promise<{ valid: boolean; error?: string }> => {
    // Check file size
    const maxSize = type === 'video' ? MAX_FILE_SIZE.video : 
                   type === 'audio' ? MAX_FILE_SIZE.audio : 
                   MAX_FILE_SIZE.image;

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Arquivo muito grande. Máximo: ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }

    // For video files, check duration
    if (type === 'video') {
      const duration = await getVideoDuration(file);
      if (duration > MAX_DURATION) {
        return {
          valid: false,
          error: `Vídeo muito longo. Máximo: ${MAX_DURATION} segundos (seu vídeo: ${duration.toFixed(1)}s)`
        };
      }
    }

    return { valid: true };
  };

  // Get video duration
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        reject(new Error('Erro ao ler vídeo'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  // Get media metadata
  const getMediaMetadata = async (file: File, type: AssetType) => {
    if (type === 'video') {
      return new Promise<any>((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          resolve({
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight
          });
        };
        video.src = URL.createObjectURL(file);
      });
    } else if (type === 'image') {
      return new Promise<any>((resolve) => {
        const img = new Image();
        img.onload = () => {
          window.URL.revokeObjectURL(img.src);
          resolve({
            width: img.width,
            height: img.height
          });
        };
        img.src = URL.createObjectURL(file);
      });
    }
    return {};
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ 
      file, 
      type, 
      projectId 
    }: { 
      file: File; 
      type: AssetType; 
      projectId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate file
      const validation = await validateFile(file, type);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Update progress
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { fileName: file.name, progress: 0, status: 'uploading' }
      }));

      // Upload to Supabase Storage
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[file.name]?.progress || 0;
          if (current >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return {
            ...prev,
            [file.name]: { fileName: file.name, progress: current + 10, status: 'uploading' }
          };
        });
      }, 200);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('video-editor-assets')
        .upload(fileName, file);

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      // Update progress - processing
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { fileName: file.name, progress: 100, status: 'processing' }
      }));

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('video-editor-assets')
        .getPublicUrl(fileName);

      // Get metadata
      const metadata = await getMediaMetadata(file, type);

      // Save to database
      const { data, error: dbError } = await supabase
        .from('video_editor_assets')
        .insert({
          user_id: user.id,
          project_id: projectId,
          asset_type: type,
          file_name: file.name,
          file_url: publicUrl,
          file_size_mb: file.size / 1024 / 1024,
          mime_type: file.type,
          metadata: metadata
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Update progress - completed
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { fileName: file.name, progress: 100, status: 'completed' }
      }));

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-editor-assets'] });
      toast.success('Upload concluído com sucesso');
    },
    onError: (error: Error, variables) => {
      setUploadProgress(prev => ({
        ...prev,
        [variables.file.name]: { 
          fileName: variables.file.name, 
          progress: 0, 
          status: 'error',
          error: error.message
        }
      }));
      toast.error(error.message);
    }
  });

  // Clear progress
  const clearProgress = (fileName: string) => {
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  return {
    upload: uploadMutation.mutate,
    uploadProgress,
    clearProgress,
    isUploading: uploadMutation.isPending
  };
};
