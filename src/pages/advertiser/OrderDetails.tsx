
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrderDetailsOptimized } from '@/hooks/useOrderDetailsOptimized';
import { OrderDetailsSkeleton } from '@/components/loading/OrderDetailsSkeleton';
import { OrderDetailsContent } from './OrderDetails/components/OrderDetailsContent';
import { OrderDetailsErrorState } from './OrderDetails/components/OrderDetailsErrorState';
import { useOrderDetailsHandlers } from './OrderDetails/hooks/useOrderDetailsHandlers';

const OrderDetails = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();

  const {
    orderDetails,
    videoSlots,
    panelData,
    contractStatus,
    enhancedData,
    loading,
    error,
    refetch
  } = useOrderDetailsOptimized(id || '', userProfile?.id || '');

  const {
    uploading,
    uploadProgress,
    isSuccessOpen,
    videoName,
    setIsSuccessOpen,
    handleVideoUpload,
    handleVideoAction,
    handleVideoDownload
  } = useOrderDetailsHandlers({
    userProfile,
    orderId: id || '',
    contractStatus,
    refetch
  });

  // Loading state otimizado
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OrderDetailsSkeleton />
      </div>
    );
  }

  // Error state
  if (error || !orderDetails) {
    return (
      <OrderDetailsErrorState
        error={error}
        orderDetails={orderDetails}
        refetch={refetch}
      />
    );
  }

  return (
    <OrderDetailsContent
      orderDetails={orderDetails}
      videoSlots={videoSlots}
      panelData={panelData}
      contractStatus={contractStatus}
      enhancedData={enhancedData}
      uploading={uploading}
      uploadProgress={uploadProgress}
      isSuccessOpen={isSuccessOpen}
      videoName={videoName}
      setIsSuccessOpen={setIsSuccessOpen}
      handleVideoUpload={handleVideoUpload}
      handleVideoAction={handleVideoAction}
      handleVideoDownload={handleVideoDownload}
    />
  );
};

export default OrderDetails;
