
import { useState, useEffect } from 'react';
import { VideoSlot } from '@/types/videoManagement';
import { 
  loadOrderVideos,
  uploadOrderVideo,
  selectVideoForDisplay,
  removeVideo
} from '@/services/videoManagementService';

export const useOrderVideoManagement = (orderId: string, userId?: string) => {
  const [videoSlots, setVideoSlots] = useState<VideoSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});

  const refreshSlots = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const slots = await loadOrderVideos(orderId);
      setVideoSlots(slots);
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!userId) {
      console.error('User ID não encontrado');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress({ 1: 0 });

      const success = await uploadOrderVideo(
        orderId,
        file,
        userId,
        (progress) => {
          setUploadProgress({ 1: progress });
        }
      );

      if (success) {
        // Limpar progresso após um tempo
        setTimeout(() => {
          setUploadProgress({});
        }, 2000);
        
        await refreshSlots();
      } else {
        setUploadProgress({});
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSelectForDisplay = async (slotId: string) => {
    const success = await selectVideoForDisplay(slotId, orderId);
    if (success) {
      await refreshSlots();
    }
  };

  const handleRemove = async (slotId: string) => {
    const success = await removeVideo(slotId);
    if (success) {
      await refreshSlots();
    }
  };

  useEffect(() => {
    refreshSlots();
  }, [orderId]);

  return {
    videoSlots,
    loading,
    uploading,
    uploadProgress,
    handleUpload,
    handleSelectForDisplay,
    handleRemove,
    refreshSlots
  };
};
