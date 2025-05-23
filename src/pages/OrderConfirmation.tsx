import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, FileUp, RefreshCw, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Progress } from '@/components/ui/progress';
import { useUserSession } from '@/hooks/useUserSession';
import { Separator } from '@/components/ui/separator';

const OrderConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoOrientation, setVideoOrientation] = useState<'landscape' | 'portrait' | 'unknown'>('unknown');
  const [videoError, setVideoError] = useState<string | null>(null);
  
  // Get order ID from URL params or localStorage (fallback)
  const orderId = searchParams.get('id') || localStorage.getItem('lastCompletedOrderId');
  
  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0 }
  };
  
  const cardVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.5, delay: 0.2 } },
    exit: { y: -20, opacity: 0 }
  };
  
  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "ID do pedido não encontrado."
        });
        navigate('/checkout');
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('pedidos')
          .select('*, lista_paineis, plano_meses, data_inicio, data_fim, status, valor_total')
          .eq('id', orderId)
          .single();
          
        if (error) throw error;
        
        setOrderDetails(data);
        
        // If we have an order, update its status if needed
        if (data && data.status === 'pendente') {
          await supabase
            .from('pedidos')
            .update({ status: 'pago' })
            .eq('id', orderId);
            
          console.log('Order status updated to paid');
        }
        
      } catch (error) {
        console.error('Error fetching order details:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os detalhes do pedido."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, toast, navigate]);
  
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
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    if (!videoFile || !user?.id || !orderId) {
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
      const uniqueFileName = `${user.id}_order_${orderId}_${timestamp}.${fileExtension}`;
      
      // Get upload URL from API
      const { data: urlData, error: urlError } = await supabase.functions.invoke('get-upload-url', {
        body: { 
          fileName: uniqueFileName, 
          contentType: videoFile.type,
          userId: user.id
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
                    client_id: user.id,
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
                    client_id: user.id,
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
  
  const handleContinue = () => {
    navigate('/dashboard');
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
  
  // Hidden video element for analyzing video files
  const hiddenVideo = <video ref={videoRef} className="hidden" />;
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex flex-col items-center">
          <RefreshCw className="h-10 w-10 text-indexa-purple animate-spin" />
          <h2 className="text-xl font-medium mt-4">Carregando detalhes do pedido...</h2>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="container mx-auto px-4 py-8 md:py-12"
      >
        <div className="max-w-3xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: 0.2
              }}
              className="flex justify-center mb-4"
            >
              <div className="bg-green-100 p-5 rounded-full">
                <CheckCircle className="h-14 w-14 text-green-600" />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-gray-900">
                Sua campanha está prestes a estrear
              </h1>
              <p className="text-gray-600 mt-3 text-lg">
                O próximo anúncio de sucesso começa agora. Envie seu vídeo abaixo para finalizar.
              </p>
            </motion.div>
          </div>
          
          {/* Order summary */}
          <motion.div
            variants={cardVariants}
            className="mb-8"
          >
            <Card className="p-6 shadow-md">
              <h2 className="text-xl font-semibold flex items-center">
                <span className="mr-2">📋</span>
                Resumo do pedido
              </h2>
              
              <div className="mt-6 space-y-6">
                {/* Order details here */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Plano Selecionado</h3>
                    <p className="text-lg font-medium">
                      {orderDetails?.plano_meses === 1 && 'Plano Básico (1 mês)'}
                      {orderDetails?.plano_meses === 3 && 'Plano Popular (3 meses)'}
                      {orderDetails?.plano_meses === 6 && 'Plano Profissional (6 meses)'}
                      {orderDetails?.plano_meses === 12 && 'Plano Empresarial (12 meses)'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Qtde. painéis</h3>
                    <p className="text-lg font-medium">
                      {orderDetails?.lista_paineis?.length || 0}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Período</h3>
                    <div>
                      <p className="text-md">
                        <span className="text-gray-700">Início:</span> {new Date(orderDetails?.data_inicio).toLocaleDateString()}
                      </p>
                      <p className="text-md">
                        <span className="text-gray-700">Término:</span> {new Date(orderDetails?.data_fim).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Valor</h3>
                    <p className="text-lg font-medium">
                      R$ {orderDetails?.valor_total?.toFixed(2)?.replace('.', ',') || '0,00'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
          
          {/* File upload */}
          <motion.div
            variants={cardVariants}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 shadow-md border-2 border-indexa-purple/20">
              <h2 className="text-xl font-semibold flex items-center">
                <Upload className="mr-2 h-5 w-5 text-indexa-purple" />
                {uploadStatus === 'success' ? 'Vídeo enviado com sucesso!' : 'Envie seu vídeo'}
              </h2>
              
              <p className="mt-2 text-gray-600">
                {uploadStatus === 'success' 
                  ? 'Seu vídeo foi enviado e será analisado pela nossa equipe nas próximas 24 horas.'
                  : 'Envie o vídeo que será exibido nos painéis selecionados.'}
              </p>
              
              <Separator className="my-4" />
              
              {/* Video requirements */}
              <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Requisitos do vídeo:</h3>
                    <ul className="mt-1 text-xs text-blue-700 space-y-1 list-disc list-inside">
                      <li>Formato horizontal obrigatório</li>
                      <li>Duração máxima: 45 segundos</li>
                      <li>Tamanho máximo: 100MB</li>
                      <li>Formatos aceitos: MP4, MOV, AVI</li>
                      <li>Resolução recomendada: 1080p ou superior</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <AnimatePresence mode="wait">
                  {uploadStatus === 'success' ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg p-8 bg-green-50 border border-green-100 text-center"
                    >
                      <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                      <h3 className="text-xl font-medium text-green-800 mb-2">
                        Vídeo enviado com sucesso!
                      </h3>
                      <p className="text-green-700 mb-6">
                        Seu vídeo foi recebido e está aguardando aprovação.<br />
                        Nossa equipe irá analisá-lo em até 24 horas.
                      </p>
                      <Button 
                        onClick={handleContinue}
                        className="bg-indexa-purple hover:bg-indexa-purple/90"
                      >
                        Ir para o Dashboard
                      </Button>
                    </motion.div>
                  ) : uploadStatus === 'uploading' || uploadStatus === 'processing' ? (
                    <motion.div
                      key="uploading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg p-8 bg-gray-50 border border-gray-200 text-center"
                    >
                      <RefreshCw className="mx-auto h-12 w-12 text-indexa-purple animate-spin mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        {uploadStatus === 'uploading' ? 'Enviando seu vídeo...' : 'Processando...'}
                      </h3>
                      
                      <div className="w-full mb-4">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="mt-1 text-sm text-gray-600">{uploadProgress}%</p>
                      </div>
                      
                      <p className="text-gray-600">
                        {uploadStatus === 'uploading' 
                          ? 'Por favor, aguarde enquanto seu vídeo é enviado.' 
                          : 'Finalizando e criando sua campanha...'}
                      </p>
                    </motion.div>
                  ) : uploadStatus === 'error' ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg p-6 bg-red-50 border border-red-100"
                    >
                      <div className="flex items-start">
                        <AlertCircle className="h-6 w-6 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h3 className="text-lg font-medium text-red-800 mb-2">
                            Erro ao processar o vídeo
                          </h3>
                          <p className="text-red-700 mb-4">
                            {videoError || 'Ocorreu um erro ao enviar seu vídeo. Por favor, tente novamente.'}
                          </p>
                          <Button 
                            variant="outline" 
                            onClick={handleReset}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Tentar novamente
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : videoFile ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="rounded-lg p-6 bg-gray-100 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <FileUp className="h-5 w-5 text-indexa-purple mr-2" />
                            <span className="font-medium truncate max-w-[280px]">{videoFile.name}</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleReset}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1 mt-4">
                          <div className="flex justify-between">
                            <span>Tamanho:</span>
                            <span>{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                          </div>
                          {videoDuration !== null && (
                            <div className="flex justify-between">
                              <span>Duração:</span>
                              <span className={videoDuration > 45 ? 'text-red-500 font-medium' : ''}>
                                {Math.floor(videoDuration / 60)}:{Math.floor(videoDuration % 60).toString().padStart(2, '0')}
                                {videoDuration > 45 && ' (excede o limite)'}
                              </span>
                            </div>
                          )}
                          {videoOrientation !== 'unknown' && (
                            <div className="flex justify-between">
                              <span>Orientação:</span>
                              <span className={videoOrientation !== 'landscape' ? 'text-red-500 font-medium' : ''}>
                                {videoOrientation === 'landscape' ? 'Horizontal ✓' : 'Vertical ✗'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <Button 
                          variant="outline" 
                          onClick={handleReset}
                        >
                          Selecionar outro arquivo
                        </Button>
                        
                        <Button 
                          onClick={startUpload}
                          disabled={!!videoError || uploadStatus === 'validating' || !videoDuration}
                          className="bg-indexa-purple hover:bg-indexa-purple/90 disabled:bg-gray-300"
                        >
                          {uploadStatus === 'validating' ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Validando...
                            </>
                          ) : (
                            'Iniciar upload'
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="dropzone"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center"
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="video/mp4,video/quicktime,video/avi"
                        onChange={handleFileUpload}
                      />
                      <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-4 text-lg font-medium text-gray-700">
                        Arraste e solte seu vídeo aqui, ou clique para selecionar
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        MP4, MOV ou AVI (máx. 100MB)
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        </div>
        
        {/* Hidden video element for metadata extraction */}
        {hiddenVideo}
      </motion.div>
    </Layout>
  );
};

export default OrderConfirmation;
