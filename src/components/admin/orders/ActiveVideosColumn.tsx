import { useState } from 'react';
import { Eye, EyeOff, Trash2, AlertTriangle, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useActiveVideosForAllOrders } from '@/hooks/useActiveVideosForAllOrders';
import { useOrderBlocking } from '@/hooks/useOrderBlocking';
import { BlockOrderModal } from './BlockOrderModal';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ActiveVideosColumnProps {
  orderId: string;
  orderStatus?: string;
}

interface ConfirmationDialog {
  isOpen: boolean;
  type: 'block' | 'delete' | null;
  videoId: string;
  videoName: string;
  pedidoVideoId: string;
}

interface BlockDialog {
  isOpen: boolean;
  videoName: string;
  pedidoVideoId: string;
  orderId: string;
}

export const ActiveVideosColumn = ({ orderId, orderStatus }: ActiveVideosColumnProps) => {
  const { activeVideos, loading, deleteVideo } = useActiveVideosForAllOrders();
  const { blockOrder, unblockOrder, isBlocking, isUnblocking } = useOrderBlocking();

  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    type: null,
    videoId: '',
    videoName: '',
    pedidoVideoId: ''
  });

  const [blockDialog, setBlockDialog] = useState<BlockDialog>({
    isOpen: false,
    videoName: '',
    pedidoVideoId: '',
    orderId: ''
  });

  // Filtrar vídeos para este pedido específico
  const orderVideos = activeVideos.filter(video => video.orderId === orderId);
  const isOrderBlocked = orderStatus === 'bloqueado';

  const handleUnblockClick = (video: any) => {
    setBlockDialog({
      isOpen: true,
      videoName: video.videoName,
      pedidoVideoId: video.pedidoVideoId,
      orderId: video.orderId
    });
  };

  const handleBlockClick = (video: any) => {
    setBlockDialog({
      isOpen: true,
      videoName: video.videoName,
      pedidoVideoId: video.pedidoVideoId,
      orderId: video.orderId
    });
  };

  const handleDeleteClick = (video: any) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      videoId: video.videoId,
      videoName: video.videoName,
      pedidoVideoId: video.pedidoVideoId
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.type) return;

    try {
      if (confirmDialog.type === 'delete') {
        await deleteVideo(confirmDialog.pedidoVideoId);
        toast({
          title: "Vídeo Removido",
          description: `O vídeo "${confirmDialog.videoName}" foi removido com sucesso.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || `Erro ao remover vídeo`,
        variant: "destructive"
      });
    }

    setConfirmDialog({
      isOpen: false,
      type: null,
      videoId: '',
      videoName: '',
      pedidoVideoId: ''
    });
  };

  const handleBlockConfirm = async (reason: string) => {
    try {
      let result;
      if (isOrderBlocked) {
        result = await unblockOrder(blockDialog.orderId, reason);
      } else {
        result = await blockOrder(blockDialog.orderId, reason);
      }
      
      if (result.success) {
        setBlockDialog({
          isOpen: false,
          videoName: '',
          pedidoVideoId: '',
          orderId: ''
        });
      }
    } catch (error: any) {
      console.error('Erro ao bloquear/desbloquear pedido:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Carregando...
        </div>
      </div>
    );
  }

  if (orderVideos.length === 0) {
    return (
      <div className="text-center py-4">
        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-300">
          <Clock className="h-3 w-3 mr-1" />
          Nenhum vídeo ativo
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Lista de Vídeos Ativos */}
      {orderVideos.map((video) => (
        <div key={video.videoId} className="border border-green-200 rounded-lg p-3 bg-green-50">
          {/* Header com Status */}
          <div className="flex items-center justify-between mb-2">
            <Badge variant="default" className={isOrderBlocked ? "bg-red-600 hover:bg-red-600" : "bg-green-600 hover:bg-green-600"}>
              <Eye className="h-3 w-3 mr-1" />
              {isOrderBlocked ? 'BLOQUEADO' : 'EM EXIBIÇÃO'}
            </Badge>
            {video.isScheduled && (
              <Badge variant="outline" className="border-blue-500 text-blue-700 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Agendado
              </Badge>
            )}
          </div>

          {/* Info do Vídeo */}
          <div className="text-sm font-medium text-gray-800 mb-3 truncate">
            {video.videoName}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2">
            {isOrderBlocked ? (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleUnblockClick(video)}
                className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                disabled={isUnblocking}
              >
                <Shield className="h-3 w-3 mr-1" />
                Desbloquear
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBlockClick(video)}
                className="h-7 px-2 text-xs"
                disabled={isBlocking}
              >
                <Shield className="h-3 w-3 mr-1" />
                Block
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteClick(video)}
              className="h-7 px-2 text-xs border-red-500 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ))}

      {/* Block Order Modal */}
      <BlockOrderModal
        isOpen={blockDialog.isOpen}
        onClose={() => setBlockDialog({
          isOpen: false,
          videoName: '',
          pedidoVideoId: '',
          orderId: ''
        })}
        onConfirm={handleBlockConfirm}
        isBlocking={isOrderBlocked ? isUnblocking : isBlocking}
        videoName={blockDialog.videoName}
        orderId={blockDialog.orderId}
        mode={isOrderBlocked ? 'unblock' : 'block'}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setConfirmDialog({
            isOpen: false,
            type: null,
            videoId: '',
            videoName: '',
            pedidoVideoId: ''
          });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Remover Vídeo
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover permanentemente o vídeo "{confirmDialog.videoName}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({
              isOpen: false,
              type: null,
              videoId: '',
              videoName: '',
              pedidoVideoId: ''
            })}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmAction}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};