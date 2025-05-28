
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { useUserSession } from '@/hooks/useUserSession';
import { useOrderDetails } from '@/hooks/useOrderDetails';
import { useSimpleVideoUpload } from '@/hooks/useSimpleVideoUpload';
import SuccessHeader from '@/components/order-confirmation/SuccessHeader';
import OrderSummary from '@/components/order-confirmation/OrderSummary';
import VideoRequirements from '@/components/order-confirmation/VideoRequirements';
import UploadStatus from '@/components/order-confirmation/UploadStatus';
import { VideoPlayer } from '@/components/video-management/VideoPlayer';
import { Upload } from 'lucide-react';

const OrderConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useUserSession();
  
  // Get order ID from URL params or localStorage (fallback)
  const orderId = searchParams.get('id') || localStorage.getItem('lastCompletedOrderId');
  
  // Get order details
  const { loading, orderDetails } = useOrderDetails({ orderId });
  
  // Video upload logic
  const {
    videoRef,
    fileInputRef,
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
    handleContinue
  } = useSimpleVideoUpload({ 
    orderId, 
    userId: user?.id
  });
  
  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0 }
  };
  
  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex flex-col items-center">
          <RefreshCw className="h-10 w-10 text-indexa-purple animate-spin" />
          <h2 className="text-xl font-medium mt-4 text-black">Carregando detalhes do pedido...</h2>
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
          {/* Success Header with Animation */}
          <SuccessHeader />
          
          {/* Order Summary */}
          <OrderSummary orderDetails={orderDetails} />
          
          {/* File Upload Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 shadow-md border-2 border-indexa-purple/20 bg-white">
              <h2 className="text-xl font-semibold flex items-center text-black">
                <Upload className="mr-2 h-5 w-5 text-indexa-purple" />
                {uploadStatus === 'success' ? 'Vídeo enviado com sucesso!' : 'Envie seu vídeo'}
              </h2>
              
              <p className="mt-2 text-gray-600">
                {uploadStatus === 'success' 
                  ? 'Seu vídeo foi enviado e será analisado pela nossa equipe nas próximas 24 horas.'
                  : 'Envie o vídeo que será exibido nos painéis selecionados.'}
              </p>
              
              {/* Video Requirements */}
              <VideoRequirements />
              
              {/* Upload Status Component */}
              <UploadStatus 
                uploadStatus={uploadStatus}
                videoFile={videoFile}
                videoDuration={videoDuration}
                videoOrientation={videoOrientation}
                videoError={videoError}
                uploadProgress={uploadProgress}
                handleReset={handleReset}
                startUpload={startUpload}
                handleContinue={handleContinue}
                fileInputRef={fileInputRef}
                handleDragEnter={handleDragEnter}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                handleFileUpload={handleFileUpload}
              />
            </Card>
          </motion.div>
        </div>
        
        {/* Hidden video element for metadata extraction */}
        <video ref={videoRef} className="hidden" />
      </motion.div>
    </Layout>
  );
};

export default OrderConfirmation;
