
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseVideoUploadProps {
  orderId: string | null;
  userId: string | undefined;
  orderDetails: any;
}

export function useVideoUpload({ orderId, userId, orderDetails }: UseVideoUploadProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoOrientation, setVideoOrientation] = useState<'landscape' | 'portrait' | 'unknown'>('unknown');
  const [videoError, setVideoError] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    // Reset previous state
    setVideoFile(file);
    setVideoError(null);
    setVideoDuration(null);
    setVideoOrientation('unknown');
    setUploadStatus('validating');
    
    // Create a URL for the video file
    const videoURL = URL.createObjectURL(file);
    
    // Set the video source and load the video
    if (videoRef.current) {
      videoRef.current.src = videoURL;
      videoRef.current.onloadedmetadata = () => {
        // Get video duration
        const duration = videoRef.current?.duration || 0;
        setVideoDuration(duration);
        
        // Get video orientation
        const videoWidth = videoRef.current?.videoWidth || 0;
        const videoHeight = videoRef.current?.videoHeight || 0;
        const orientation = videoWidth > videoHeight ? 'landscape' : 'portrait';
        setVideoOrientation(orientation);
        
        // Validate video
        let errorMessage = null;
        
        // Check duration - 45 seconds max
        const maxDuration = 45; // seconds
        if (duration > maxDuration) {
          errorMessage = `O vídeo excede a duração máxima de ${maxDuration} segundos. Por favor, reduza o vídeo.`;
        }
        
        // Check orientation - must be landscape
        if (orientation !== 'landscape') {
          errorMessage = 'O vídeo deve estar na orientação horizontal (landscape). Por favor, ajuste e tente novamente.';
        }
        
        // Check file size - max 100MB
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
          errorMessage = 'O arquivo excede o tamanho máximo permitido de 100MB.';
        }
        
        if (errorMessage) {
          setVideoError(errorMessage);
          setUploadStatus('error');
          URL.revokeObjectURL(videoURL);
        } else {
          // Video is valid
          setUploadStatus('idle');
        }
      };
      
      videoRef.current.onerror = () => {
        setVideoError('Formato de vídeo inválido. Por favor, use um formato suportado como MP4.');
        setUploadStatus('error');
        URL.revokeObjectURL(videoURL);
      };
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    handleFileSelect(file);
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Start upload process
  const startUpload = async () => {
    if (!videoFile || !userId || !orderId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Informações necessárias para upload não encontradas."
      });
      return;
    }
    
    setUploadStatus('uploading');
    setUploadProgress(0);
    
    try {
      // Generate a unique file name
      const timestamp = Date.now();
      const fileExtension = videoFile.name.split('.').pop();
      const uniqueFileName = `${userId}_order_${orderId}_${timestamp}.${fileExtension}`;
      
      // Get upload URL from API
      const { data: urlData, error: urlError } = await supabase.functions.invoke('get-upload-url', {
        body: { 
          fileName: uniqueFileName, 
          contentType: videoFile.type,
          userId: userId
        }
      });
      
      if (urlError) throw urlError;
      
      // Upload file with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };
      
      // Create a promise to handle the XHR request
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.onload = async function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Upload successful, now create video record in database
            try {
              setUploadStatus('processing');
              
              const { data: videoData, error: videoError } = await supabase
                .from('videos')
                .insert([
                  {
                    client_id: userId,
                    nome: videoFile.name,
                    url: urlData.fileUrl,
                    duracao: videoDuration || 0,
                    origem: 'cliente',
                    status: 'pendente_aprovacao'
                  }
                ])
                .select()
                .single();
                
              if (videoError) throw videoError;
              
              // Link video to order
              if (videoData?.id) {
                // Update pedido with video ID
                const { error: updateError } = await supabase
                  .from('pedidos')
                  .update({
                    log_pagamento: { 
                      ...orderDetails.log_pagamento,
                      video_id: videoData.id
                    }
                  })
                  .eq('id', orderId);
                  
                if (updateError) {
                  console.error('Error updating order with video ID:', updateError);
                }
                
                // Create campaigns with the video
                const { data: painels } = await supabase
                  .from('painels')
                  .select('id')
                  .in('id', orderDetails.lista_paineis);
                  
                if (painels && painels.length > 0) {
                  const campanhas = painels.map((painel: { id: string }) => ({
                    client_id: userId,
                    video_id: videoData.id,
                    painel_id: painel.id,
                    data_inicio: orderDetails.data_inicio,
                    data_fim: orderDetails.data_fim,
                    status: 'pendente_aprovacao'
                  }));
                  
                  const { error: campanhasError } = await supabase
                    .from('campanhas')
                    .insert(campanhas);
                    
                  if (campanhasError) {
                    console.error('Error creating campaigns:', campanhasError);
                  }
                }
              }
              
              setUploadStatus('success');
              resolve();
            } catch (error) {
              console.error('Error creating video record:', error);
              setUploadStatus('error');
              reject(error);
            }
          } else {
            setUploadStatus('error');
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          setUploadStatus('error');
          reject(new Error('Network error during upload'));
        };
      });
      
      // Start the upload
      xhr.open('PUT', urlData.signedUrl);
      xhr.setRequestHeader('Content-Type', videoFile.type);
      xhr.send(videoFile);
      
      await uploadPromise;
      
      toast({
        title: "Upload concluído",
        description: "Seu vídeo foi enviado com sucesso e está aguardando aprovação."
      });
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Ocorreu um erro ao enviar o arquivo."
      });
      setUploadStatus('error');
    }
  };

  // Reset and select another file
  const handleReset = () => {
    setVideoFile(null);
    setVideoError(null);
    setVideoDuration(null);
    setVideoOrientation('unknown');
    setUploadStatus('idle');
    setUploadProgress(0);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return {
    videoRef,
    fileInputRef,
    uploadStatus,
    uploadProgress,
    videoFile,
    videoDuration,
    videoOrientation,
    videoError,
    handleFileSelect,
    handleFileUpload,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    startUpload,
    handleReset,
    handleContinue
  };
}
