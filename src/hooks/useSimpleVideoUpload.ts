
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { uploadVideo } from '@/services/videoUploadService';

export const useSimpleVideoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleVideoUpload = async (file: File, userId: string, orderId: string, slotPosition: number) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const success = await uploadVideo(
        slotPosition,
        file,
        userId,
        orderId,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      if (success) {
        toast.success('Vídeo enviado com sucesso!');
        return true;
      } else {
        toast.error('Erro ao enviar vídeo');
        return false;
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar vídeo');
      return false;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploading,
    uploadProgress,
    handleVideoUpload
  };
};
