
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
  // Add the missing ref properties
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

  const validateVideo = useCallback((file: File): Promise<{ duration: number; orientation: 'landscape' | 'portrait' }> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current) {
        reject(new Error('Video element not available'));
        return;
      }

      const video = videoRef.current;
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const width = video.videoWidth;
        const height = video.videoHeight;
        const orientation = height > width ? 'portrait' : 'landscape';
        
        URL.revokeObjectURL(url);
        resolve({ duration, orientation });
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

      // Insert video record into database
      const videoData = prepareForInsert({
        client_id: userId,
        nome: videoFile.name,
        url: 'pending_upload',
        origem: 'upload',
        duracao: videoDuration,
        status: 'ativo'
      });

      const { data, error } = await supabase
        .from('videos')
        .insert([videoData] as any)
        .select()
        .single();

      if (error) throw error;

      setUploadProgress(100);
      setUploadStatus('success');
      toast.success('Vídeo enviado com sucesso!');

    } catch (error: any) {
      console.error('Upload error:', error);
      setVideoError(error.message);
      setUploadStatus('error');
      toast.error('Erro no upload: ' + error.message);
    }
  }, [videoFile, userId, orderId, videoDuration]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setVideoError(null);
      const { duration, orientation } = await validateVideo(file);
      
      setVideoFile(file);
      setVideoDuration(duration);
      setVideoOrientation(orientation);
      
      toast.success('Vídeo carregado com sucesso!');
    } catch (error: any) {
      setVideoError(error.message);
      toast.error('Erro ao processar vídeo: ' + error.message);
    }
  }, [validateVideo]);

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
        const { duration, orientation } = await validateVideo(videoFile);
        
        setVideoFile(videoFile);
        setVideoDuration(duration);
        setVideoOrientation(orientation);
        
        toast.success('Vídeo carregado com sucesso!');
      } catch (error: any) {
        setVideoError(error.message);
        toast.error('Erro ao processar vídeo: ' + error.message);
      }
    }
  }, [validateVideo]);

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
    // Implementation for continue action
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
    // Export the refs
    videoRef,
    fileInputRef
  };
};
