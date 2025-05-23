
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserSession } from '@/hooks/useUserSession';
import { prepareForInsert } from '@/utils/supabaseUtils';
import { Database } from '@/integrations/supabase/types';

type VideoInsert = Database['public']['Tables']['videos']['Insert'];

interface UseVideoUploadResult {
  uploading: boolean;
  uploadError: string | null;
  uploadSuccess: boolean;
  uploadVideo: (videoFile: File, videoName: string) => Promise<void>;
}

export function useVideoUpload(): UseVideoUploadResult {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { session, isLoading: isSessionLoading } = useUserSession();

  const userId = session?.user?.id;

  const uploadVideo = useCallback(async (videoFile: File, videoName: string) => {
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    if (!userId) {
      setUploadError('Usuário não autenticado.');
      setUploading(false);
      return;
    }

    const fileExt = videoFile.name.split('.').pop();
    const filePath = `${userId}/${videoName}.${fileExt}`;
    const bucketName = 'videos';

    try {
      // Upload the video to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const fileUrl = `https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/${bucketName}/${filePath}`;

      // Get video duration
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.src = URL.createObjectURL(videoFile);

      video.onloadedmetadata = async () => {
        URL.revokeObjectURL(video.src);
        const duration = video.duration;

        // Create the video entry in the database
        const videoPayload = prepareForInsert<VideoInsert>({
          client_id: userId,
          nome: videoName,
          url: fileUrl,
          duracao: duration,
          origem: 'upload',
          status: 'ativo'
        });
      
        // Insert the record with proper typing
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .insert(videoPayload)
          .select();

        if (videoError) {
          throw videoError;
        }

        setUploadSuccess(true);
        setUploading(false);
      };

      video.onerror = (error) => {
        console.error("Erro ao carregar metadados do vídeo:", error);
        setUploadError('Erro ao carregar metadados do vídeo.');
        setUploading(false);
      };
    } catch (error: any) {
      console.error("Erro ao fazer upload do vídeo:", error);
      setUploadError(error.message || 'Erro ao fazer upload do vídeo.');
      setUploading(false);
    }
  }, [userId]);

  return {
    uploading,
    uploadError,
    uploadSuccess,
    uploadVideo
  };
}
