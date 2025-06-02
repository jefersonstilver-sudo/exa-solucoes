
import React, { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderDetailsSkeleton } from '@/components/loading/OrderDetailsSkeleton';
import { OrderDetailsGrid } from './OrderDetailsGrid';
import { VideoManagementSection } from './VideoManagementSection';

const OrderHeader = React.lazy(() => 
  import('@/components/order/OrderHeader').then(module => ({
    default: module.OrderHeader
  }))
);

const ContractStatusAlert = React.lazy(() => 
  import('@/components/order/ContractStatusAlert').then(module => ({
    default: module.ContractStatusAlert
  }))
);

const VideoDisplayStatus = React.lazy(() => 
  import('@/components/order/VideoDisplayStatus').then(module => ({
    default: module.VideoDisplayStatus
  }))
);

const VideoActivationSuccessPopup = React.lazy(() => 
  import('@/components/video-management/VideoActivationSuccessPopup').then(module => ({
    default: module.VideoActivationSuccessPopup
  }))
);

interface OrderDetailsContentProps {
  orderDetails: any;
  videoSlots: any[];
  panelData: any[];
  contractStatus: any;
  enhancedData: any;
  uploading: boolean;
  uploadProgress: { [key: number]: number };
  isSuccessOpen: boolean;
  videoName: string;
  setIsSuccessOpen: (open: boolean) => void;
  handleVideoUpload: (slotPosition: number, file: File) => Promise<void>;
  handleVideoAction: (action: () => Promise<void>) => Promise<void>;
  handleVideoDownload: (videoUrl: string, fileName: string) => void;
}

export const OrderDetailsContent: React.FC<OrderDetailsContentProps> = ({
  orderDetails,
  videoSlots,
  panelData,
  contractStatus,
  enhancedData,
  uploading,
  uploadProgress,
  isSuccessOpen,
  videoName,
  setIsSuccessOpen,
  handleVideoUpload,
  handleVideoAction,
  handleVideoDownload
}) => {
  const displayPanels = enhancedData?.recoveredPanels || orderDetails.lista_paineis || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Suspense fallback={<OrderDetailsSkeleton />}>
          <div className="space-y-6">
            {/* Header */}
            <OrderHeader orderId={orderDetails.id} />

            {/* Status do Contrato */}
            <ContractStatusAlert
              isActive={contractStatus.isActive}
              isExpired={contractStatus.isExpired}
              isNearExpiration={contractStatus.isNearExpiration}
              daysRemaining={contractStatus.daysRemaining}
              expiryDate={contractStatus.expiryDate}
            />

            {/* Status de Exibição */}
            <VideoDisplayStatus orderId={orderDetails.id} />

            {/* Grid de Cards */}
            <OrderDetailsGrid
              orderDetails={orderDetails}
              displayPanels={displayPanels}
              enhancedData={enhancedData}
            />

            {/* Gestão de Vídeos */}
            <VideoManagementSection
              contractStatus={contractStatus}
              videoSlots={videoSlots}
              uploading={uploading}
              uploadProgress={uploadProgress}
              onUpload={handleVideoUpload}
              onVideoAction={handleVideoAction}
              onDownload={handleVideoDownload}
            />
          </div>

          {/* Popup de Sucesso */}
          <VideoActivationSuccessPopup
            isOpen={isSuccessOpen}
            onClose={() => setIsSuccessOpen(false)}
            videoName={videoName}
          />
        </Suspense>
      </div>
    </div>
  );
};
