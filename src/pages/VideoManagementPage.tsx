
import React from 'react';
import { useParams } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { useOrderVideoManagement } from '@/hooks/useOrderVideoManagement';
import { VideoManagementLayout } from '@/components/video-management/VideoManagementLayout';
import { Loader2 } from 'lucide-react';

export const VideoManagementPage = () => {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const { user } = useUserSession();
  
  const {
    videoSlots,
    loading,
    uploading,
    uploadProgress,
    handleUpload,
    handleSelectForDisplay,
    handleRemove
  } = useOrderVideoManagement(pedidoId || '', user?.id);

  const handleDownload = (videoUrl: string, fileName: string) => {
    window.open(videoUrl, '_blank');
  };

  if (!pedidoId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            ID do pedido não encontrado
          </h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indexa-purple" />
          <span className="ml-2 text-lg">Carregando vídeos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <VideoManagementLayout
        videoSlots={videoSlots}
        uploading={uploading}
        uploadProgress={uploadProgress}
        onUpload={handleUpload}
        onSelectForDisplay={handleSelectForDisplay}
        onRemove={handleRemove}
        onDownload={handleDownload}
      />
    </div>
  );
};
