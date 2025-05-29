
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { uploadVideo } from '@/services/videoUploadService';
import { validateVideoFile } from '@/services/videoStorageService';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';

interface UseSimpleVideoUploadProps {
  orderId?: string | null;
  userId?: string;
}

export const useSimpleVideoUpload = ({ orderId, userId }: UseSimpleVideoUploadProps = {}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoOrientation, setVideoOrientation] = useState<'landscape' | 'portrait' | 'unknown'>('unknown');
  const [videoError, setVideoError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setVideoFile(file);
    setUploadStatus('validating');
    setVideoError(null);

    try {
      const validation = await validateVideoFile(file);
      
      if (!validation.valid) {
        setVideoError(validation.errors.join(', '));
        setUploadStatus('error');
        return;
      }

      setVideoDuration(validation.metadata.duration);
      // Map the orientation from validation service to our state type
      const mappedOrientation = validation.metadata.orientation === 'horizontal' ? 'landscape' : 'portrait';
      setVideoOrientation(mappedOrientation);
      setUploadStatus('idle');
    } catch (error) {
      setVideoError('Erro ao validar o vídeo');
      setUploadStatus('error');
    }
  };

  const { handleDragEnter, handleDragOver, handleDragLeave, handleDrop } = useDragAndDrop({
    onFileSelected: processFile
  });

  const startUpload = async () => {
    if (!videoFile || !userId || !orderId) {
      toast.error('Dados necessários não encontrados');
      return;
    }

    try {
      setUploading(true);
      setUploadStatus('uploading');
      setUploadProgress(0);

      const success = await uploadVideo(
        1, // slot position for order confirmation
        videoFile,
        userId,
        orderId,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      if (success) {
        setUploadStatus('success');
        toast.success('Vídeo enviado com sucesso!');
      } else {
        setUploadStatus('error');
        setVideoError('Erro ao enviar vídeo');
        toast.error('Erro ao enviar vídeo');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadStatus('error');
      setVideoError('Erro ao enviar vídeo');
      toast.error('Erro ao enviar vídeo');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setVideoFile(null);
    setVideoDuration(null);
    setVideoOrientation('unknown');
    setVideoError(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploading(false);
  };

  const handleContinue = () => {
    // Navigate to dashboard or appropriate page
    window.location.href = '/pedidos';
  };

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
    // Original properties
    uploading,
    uploadProgress,
    handleVideoUpload,
    
    // New properties for OrderConfirmation
    videoRef,
    fileInputRef,
    uploadStatus,
    videoFile,
    videoDuration,
    videoOrientation,
    videoError,
    handleFileUpload,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    startUpload,
    handleReset,
    handleContinue
  };
};
