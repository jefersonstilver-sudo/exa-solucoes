
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UseOrderDetailsHandlersProps {
  userProfile: any;
  orderId: string;
  contractStatus: any;
  refetch: () => Promise<void>;
}

export const useOrderDetailsHandlers = ({
  userProfile,
  orderId,
  contractStatus,
  refetch
}: UseOrderDetailsHandlersProps) => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [videoName, setVideoName] = useState('');

  const handleVideoUpload = async (slotPosition: number, file: File) => {
    if (!userProfile?.id || !orderId) return;
    
    if (contractStatus.isExpired) {
      toast.error('Não é possível fazer upload de vídeos para contratos expirados');
      return;
    }
    
    setUploading(true);
    setUploadProgress(prev => ({ ...prev, [slotPosition]: 0 }));
    
    try {
      // Simular progress para melhor UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [slotPosition]: Math.min((prev[slotPosition] || 0) + 10, 90)
        }));
      }, 200);

      // TODO: Implementar upload real
      console.log('Uploading video for slot:', slotPosition);
      
      // Simular upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [slotPosition]: 100 }));
      
      setVideoName(file.name);
      setIsSuccessOpen(true);
      
      // Refresh data após upload
      await refetch();
      
      // Limpar progress após sucesso
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[slotPosition];
          return newProgress;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload do vídeo');
      // Limpar progress em caso de erro
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[slotPosition];
        return newProgress;
      });
    } finally {
      setUploading(false);
    }
  };

  const handleVideoAction = async (action: () => Promise<void>) => {
    if (contractStatus.isExpired) {
      toast.error('Não é possível realizar ações em contratos expirados');
      return;
    }
    
    try {
      await action();
      await refetch(); // Refresh data após ação
    } catch (error) {
      console.error('Erro na ação do vídeo:', error);
      toast.error('Erro ao processar ação');
    }
  };

  const handleVideoDownload = (videoUrl: string, fileName: string) => {
    window.open(videoUrl, '_blank');
  };

  return {
    uploading,
    uploadProgress,
    isSuccessOpen,
    videoName,
    setIsSuccessOpen,
    handleVideoUpload,
    handleVideoAction,
    handleVideoDownload
  };
};
