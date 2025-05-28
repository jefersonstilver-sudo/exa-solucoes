
import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { prepareForInsert } from '@/utils/supabaseUtils';

export interface UseVideoUploadResult {
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  uploadProgress: number;
  videoFile: File | null;
  videoDuration: number | null;
  videoOrientation: 'landscape' | 'portrait' | 'unknown';
  videoError: string | null;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  startUpload: () => Promise<void>;
  handleReset: () => void;
  handleContinue: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

interface UseVideoUploadProps {
  orderId: string | null;
  userId: string | undefined;
  orderDetails: any;
}

export const useVideoUpload = ({ orderId, userId, orderDetails }: UseVideoUploadProps): UseVideoUploadResult => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoOrientation, setVideoOrientation] = useState<'landscape' | 'portrait' | 'unknown'>('unknown');
  const [videoError, setVideoError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const validateVideoAdvanced = useCallback((file: File): Promise<{ 
    duration: number; 
    orientation: 'landscape' | 'portrait'; 
    width: number; 
    height: number; 
    errors: string[];
  }> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current) {
        reject(new Error('Video element not available'));
        return;
      }

      const video = videoRef.current;
      const url = URL.createObjectURL(file);
      const errors: string[] = [];
      
      video.onloadedmetadata = async () => {
        const duration = Math.round(video.duration);
        const width = video.videoWidth;
        const height = video.videoHeight;
        const orientation = height > width ? 'portrait' : 'landscape';
        
        // Validações essenciais (removida validação de áudio)
        if (duration > 15) {
          errors.push('Vídeo deve ter no máximo 15 segundos');
        }
        
        if (orientation !== 'landscape') {
          errors.push('Vídeo deve estar em orientação horizontal');
        }
        
        // Verificar proporção (largura deve ser maior que altura)
        if (width <= height) {
          errors.push('Vídeo deve ter proporção horizontal (largura > altura)');
        }
        
        // Validar formato
        if (!['video/mp4', 'video/quicktime', 'video/avi'].includes(file.type)) {
          errors.push('Formato deve ser MP4, MOV ou AVI');
        }
        
        // Validar tamanho do arquivo (máx 100MB)
        if (file.size > 100 * 1024 * 1024) {
          errors.push('Arquivo deve ter no máximo 100MB');
        }
        
        URL.revokeObjectURL(url);
        resolve({ 
          duration, 
          orientation, 
          width, 
          height, 
          errors 
        });
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = url;
    });
  }, []);

  const startUpload = useCallback(async () => {
    if (!videoFile || !userId || !orderId) {
      toast.error('Dados incompletos para upload');
      return;
    }

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);

      // Validar usando a função do Supabase (sem verificação de áudio)
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_video_specs', {
          p_duracao: videoDuration || 0,
          p_orientacao: videoOrientation === 'landscape' ? 'horizontal' : 'vertical',
          p_tem_audio: false, // Sempre false, áudio será mutado na reprodução
          p_largura: 1920,
          p_altura: 1080
        });

      if (validationError) throw validationError;

      if (!validationResult[0]?.valid) {
        const errors = validationResult[0]?.errors || ['Vídeo não atende aos requisitos'];
        setVideoError(errors.join(', '));
        setUploadStatus('error');
        toast.error(errors.join(', '));
        return;
      }

      // Criar registro do vídeo
      const videoData = prepareForInsert({
        client_id: userId,
        nome: videoFile.name,
        url: 'pending_upload',
        origem: 'cliente',
        duracao: videoDuration,
        status: 'ativo',
        orientacao: videoOrientation === 'landscape' ? 'horizontal' : 'vertical',
        tem_audio: false, // Sempre false para garantir que seja mutado
        largura: 1920,
        altura: 1080,
        tamanho_arquivo: videoFile.size,
        formato: videoFile.type
      });

      const { data: newVideo, error: videoInsertError } = await supabase
        .from('videos')
        .insert([videoData] as any)
        .select()
        .single();

      if (videoInsertError) throw videoInsertError;

      // Criar entrada na tabela pedido_videos para aprovação
      const { error: pedidoVideoError } = await supabase
        .from('pedido_videos')
        .insert({
          pedido_id: orderId,
          video_id: newVideo.id,
          slot_position: 1,
          approval_status: 'pending'
        });

      if (pedidoVideoError) throw pedidoVideoError;

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

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setVideoError(null);
      const validation = await validateVideoAdvanced(file);
      
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
  }, [validateVideoAdvanced]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      try {
        setVideoError(null);
        const validation = await validateVideoAdvanced(videoFile);
        
        if (validation.errors.length > 0) {
          setVideoError(validation.errors.join(', '));
          toast.error(validation.errors.join(', '));
          return;
        }
        
        setVideoFile(videoFile);
        setVideoDuration(validation.duration);
        setVideoOrientation(validation.orientation);
        
        toast.success('Vídeo validado com sucesso! Clique em enviar para fazer upload.');
      } catch (error: any) {
        setVideoError(error.message);
        toast.error('Erro ao processar vídeo: ' + error.message);
      }
    }
  }, [validateVideoAdvanced]);

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

  return {
    uploadStatus,
    uploadProgress,
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
    handleContinue,
    videoRef,
    fileInputRef
  };
};
