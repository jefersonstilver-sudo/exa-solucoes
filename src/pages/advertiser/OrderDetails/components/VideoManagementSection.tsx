
import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VideoManagementCard = React.lazy(() => 
  import('@/components/order/VideoManagementCard').then(module => ({
    default: module.VideoManagementCard
  }))
);

interface VideoManagementSectionProps {
  contractStatus: any;
  videoSlots: any[];
  uploading: boolean;
  uploadProgress: { [key: number]: number };
  onUpload: (slotPosition: number, file: File) => Promise<void>;
  onVideoAction: (action: () => Promise<void>) => Promise<void>;
  onDownload: (videoUrl: string, fileName: string) => void;
}

export const VideoManagementSection: React.FC<VideoManagementSectionProps> = ({
  contractStatus,
  videoSlots,
  uploading,
  uploadProgress,
  onUpload,
  onVideoAction,
  onDownload
}) => {
  const navigate = useNavigate();

  if (contractStatus.isExpired) {
    return (
      <div className="bg-gray-100 p-8 rounded-lg border-2 border-gray-300">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            Gestão de Vídeos Bloqueada
          </h3>
          <p className="text-gray-600 mb-4">
            O contrato expirou. Para reativar a gestão de vídeos, renove seu contrato.
          </p>
          <Button onClick={() => navigate('/anunciante/pedidos')} variant="outline">
            Ver Outros Pedidos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
      <VideoManagementCard
        videoSlots={videoSlots}
        uploading={uploading}
        uploadProgress={uploadProgress}
        onUpload={onUpload}
        onActivate={(slotId) => onVideoAction(async () => {
          console.log('Activating video:', slotId);
          // TODO: Implementar ativação
        })}
        onRemove={(slotId) => onVideoAction(async () => {
          console.log('Removing video:', slotId);
          // TODO: Implementar remoção
        })}
        onSelectForDisplay={(slotId) => onVideoAction(async () => {
          console.log('Selecting for display:', slotId);
          // TODO: Implementar seleção
        })}
        onDownload={onDownload}
      />
    </Suspense>
  );
};
