import React, { useState } from 'react';
import { Play, Shield, Trash2, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useActiveVideosForAllOrders } from '@/hooks/useActiveVideosForAllOrders';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ActiveVideosColumnProps {
  orderId: string;
}

interface ConfirmationDialog {
  isOpen: boolean;
  type: 'block' | 'delete' | null;
  videoId: string;
  videoName: string;
  pedidoVideoId: string;
}

const ActiveVideosColumn: React.FC<ActiveVideosColumnProps> = ({ orderId }) => {
  const { activeVideos, loading, blockVideo, deleteVideo } = useActiveVideosForAllOrders();
  const [confirmation, setConfirmation] = useState<ConfirmationDialog>({
    isOpen: false,
    type: null,
    videoId: '',
    videoName: '',
    pedidoVideoId: ''
  });

  // Filtrar vídeos para este pedido específico
  const orderVideos = activeVideos.filter(video => video.orderId === orderId);

  const handleAction = (
    type: 'block' | 'delete', 
    videoId: string, 
    videoName: string, 
    pedidoVideoId: string
  ) => {
    setConfirmation({
      isOpen: true,
      type,
      videoId,
      videoName,
      pedidoVideoId
    });
  };

  const executeAction = async () => {
    if (!confirmation.type || !confirmation.pedidoVideoId) return;

    try {
      if (confirmation.type === 'block') {
        await blockVideo(confirmation.pedidoVideoId);
        toast.success('Vídeo bloqueado com sucesso');
      } else if (confirmation.type === 'delete') {
        await deleteVideo(confirmation.pedidoVideoId);
        toast.success('Vídeo removido com sucesso');
      }
    } catch (error) {
      toast.error(`Erro ao ${confirmation.type === 'block' ? 'bloquear' : 'remover'} vídeo`);
    } finally {
      setConfirmation({
        isOpen: false,
        type: null,
        videoId: '',
        videoName: '',
        pedidoVideoId: ''
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (orderVideos.length === 0) {
    return (
      <div className="text-center py-2">
        <Badge variant="outline" className="border-gray-300 text-gray-500">
          <Clock className="h-3 w-3 mr-1" />
          Nenhum vídeo ativo
        </Badge>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {orderVideos.map((video) => (
          <div key={video.videoId} className="border border-green-200 rounded-lg p-3 bg-green-50">
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-2">
              <Badge variant="default" className="bg-green-600 text-white">
                <Play className="h-3 w-3 mr-1" />
                EM EXIBIÇÃO
              </Badge>
              {video.isScheduled && (
                <Badge variant="outline" className="border-blue-500 text-blue-700 text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Agendado
                </Badge>
              )}
            </div>

            {/* Video Info */}
            <div className="text-sm text-gray-700 mb-2 font-medium truncate">
              {video.videoName}
            </div>

            {/* Actions */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('block', video.videoId, video.videoName, video.pedidoVideoId)}
                className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 text-xs px-2 py-1 h-auto"
              >
                <Shield className="h-3 w-3 mr-1" />
                Bloquear
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('delete', video.videoId, video.videoName, video.pedidoVideoId)}
                className="border-red-500 text-red-700 hover:bg-red-50 text-xs px-2 py-1 h-auto"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remover
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmation.isOpen} onOpenChange={(open) => 
        setConfirmation(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Ação de Segurança
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              {confirmation.type === 'block' 
                ? 'Tem certeza que deseja bloquear este vídeo? Esta ação pode ser desfeita posteriormente.'
                : 'Tem certeza que deseja remover este vídeo permanentemente? Esta ação NÃO pode ser desfeita.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Vídeo:</div>
            <div className="font-medium text-gray-900">{confirmation.videoName}</div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
            >
              Cancelar
            </Button>
            <Button
              variant={confirmation.type === 'delete' ? 'destructive' : 'default'}
              onClick={executeAction}
              className={confirmation.type === 'block' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
            >
              {confirmation.type === 'block' ? 'Bloquear Vídeo' : 'Remover Permanentemente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActiveVideosColumn;