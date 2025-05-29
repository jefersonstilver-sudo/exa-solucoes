
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { uploadVideo } from '@/services/videoUploadService';
import { validateVideoFile, ensureVideosBucket } from '@/services/videoStorageService';
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
    console.log('Processando arquivo:', file.name, 'Tamanho:', file.size);
    setVideoFile(file);
    setUploadStatus('validating');
    setVideoError(null);

    try {
      // Garantir que o bucket existe
      const bucketReady = await ensureVideosBucket();
      if (!bucketReady) {
        throw new Error('Erro ao preparar storage de vídeos');
      }

      const validation = await validateVideoFile(file);
      
      if (!validation.valid) {
        console.error('Validação falhou:', validation.errors);
        setVideoError(validation.errors.join(', '));
        setUploadStatus('error');
        return;
      }

      console.log('Arquivo validado com sucesso:', validation.metadata);
      setVideoDuration(validation.metadata.duration);
      // Map the orientation from validation service to our state type
      const mappedOrientation = validation.metadata.orientation === 'horizontal' ? 'landscape' : 'portrait';
      setVideoOrientation(mappedOrientation);
      setUploadStatus('idle');
    } catch (error) {
      console.error('Erro ao validar vídeo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao validar o vídeo';
      setVideoError(errorMessage);
      setUploadStatus('error');
    }
  };

  const { handleDragEnter, handleDragOver, handleDragLeave, handleDrop } = useDragAndDrop({
    onFileSelected: processFile
  });

  const startUpload = async () => {
    if (!videoFile || !userId || !orderId) {
      const missingData = [];
      if (!videoFile) missingData.push('arquivo de vídeo');
      if (!userId) missingData.push('ID do usuário');
      if (!orderId) missingData.push('ID do pedido');
      
      const errorMsg = `Dados necessários não encontrados: ${missingData.join(', ')}`;
      console.error(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      console.log('Iniciando upload com dados:', { 
        videoFile: videoFile.name, 
        userId, 
        orderId 
      });
      
      setUploading(true);
      setUploadStatus('uploading');
      setUploadProgress(0);

      const success = await uploadVideo(
        1, // slot position for order confirmation
        videoFile,
        userId,
        orderId,
        (progress) => {
          console.log('Progresso do upload:', progress + '%');
          setUploadProgress(progress);
        }
      );

      if (success) {
        console.log('Upload concluído com sucesso');
        setUploadStatus('success');
        toast.success('Vídeo enviado com sucesso!');
      } else {
        console.error('Upload falhou');
        setUploadStatus('error');
        setVideoError('Erro ao enviar vídeo');
        toast.error('Erro ao enviar vídeo');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar vídeo';
      setVideoError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    console.log('Resetando estado do upload');
    setVideoFile(null);
    setVideoDuration(null);
    setVideoOrientation('unknown');
    setVideoError(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploading(false);
    
    // Limpar input de arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContinue = () => {
    // Navigate to dashboard or appropriate page
    console.log('Navegando para dashboard de pedidos');
    window.location.href = '/pedidos';
  };

  const handleVideoUpload = async (file: File, userId: string, orderId: string, slotPosition: number) => {
    try {
      console.log('Upload de vídeo solicitado:', { 
        fileName: file.name, 
        userId, 
        orderId, 
        slotPosition 
      });
      
      setUploading(true);
      setUploadProgress(0);

      const success = await uploadVideo(
        slotPosition,
        file,
        userId,
        orderId,
        (progress) => {
          console.log(`Progresso upload slot ${slotPosition}:`, progress + '%');
          setUploadProgress(progress);
        }
      );

      if (success) {
        console.log('Upload de vídeo bem-sucedido');
        toast.success('Vídeo enviado com sucesso!');
        return true;
      } else {
        console.error('Upload de vídeo falhou');
        toast.error('Erro ao enviar vídeo');
        return false;
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar vídeo';
      toast.error(errorMessage);
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
