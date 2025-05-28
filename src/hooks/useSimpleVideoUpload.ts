
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { validateVideoFile } from '@/services/videoValidationService';
import { uploadVideoToSupabase } from '@/services/videoUploadService';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';

export interface UseSimpleVideoUploadProps {
  orderId: string | null;
  userId: string | undefined;
}

export const useSimpleVideoUpload = ({ orderId, userId }: UseSimpleVideoUploadProps) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoOrientation, setVideoOrientation] = useState<'landscape' | 'portrait' | 'unknown'>('unknown');
  const [videoError, setVideoError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!videoRef.current) return;

    try {
      setVideoError(null);
      const validation = await validateVideoFile(file, videoRef.current);
      
      if (validation.errors.length > 0) {
        setVideoError(validation.errors.join(', '));
        toast.error(validation.errors.join(', '));
        return;
      }
      
      setVideoFile(file);
      setVideoDuration(validation.duration);
      setVideoOrientation(validation.orientation);
      
      toast.success('Vídeo validado com sucesso! Clique em enviar para fazer upload.');
    } catch (error: any) {
      setVideoError(error.message);
      toast.error('Erro ao processar vídeo: ' + error.message);
    }
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  }, [processFile]);

  const startUpload = useCallback(async () => {
    if (!videoFile || !userId || !orderId || !videoDuration) {
      toast.error('Dados incompletos para upload');
      return;
    }

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);

      await uploadVideoToSupabase({
        file: videoFile,
        userId,
        orderId,
        duration: videoDuration,
        orientation: videoOrientation as 'landscape' | 'portrait'
      });

      setUploadProgress(100);
      setUploadStatus('success');
      toast.success('Vídeo enviado para aprovação com sucesso!');

    } catch (error: any) {
      console.error('Upload error:', error);
      setVideoError(error.message);
      setUploadStatus('error');
      toast.error('Erro no upload: ' + error.message);
    }
  }, [videoFile, userId, orderId, videoDuration, videoOrientation]);

  const handleReset = useCallback(() => {
    setVideoFile(null);
    setVideoDuration(null);
    setVideoOrientation('unknown');
    setVideoError(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleContinue = useCallback(() => {
    console.log('Continue action triggered');
  }, []);

  const dragAndDropHandlers = useDragAndDrop({
    onFileSelected: processFile
  });

  return {
    uploadStatus,
    uploadProgress,
    videoFile,
    videoDuration,
    videoOrientation,
    videoError,
    handleFileUpload,
    startUpload,
    handleReset,
    handleContinue,
    videoRef,
    fileInputRef,
    ...dragAndDropHandlers
  };
};
