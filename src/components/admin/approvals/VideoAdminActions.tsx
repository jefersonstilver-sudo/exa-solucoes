import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Ban, 
  XCircle, 
  Trash2, 
  Settings, 
  AlertTriangle,
  Shield,
  ShieldX 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminActionModal from './AdminActionModal';

interface VideoAdminActionsProps {
  video: {
    pedido_video_id: string;
    video_id: string;
    video_name: string;
    pedido_id: string;
  };
  status: {
    primary_status: string;
    is_blocked: boolean;
    is_active: boolean;
  };
  onActionComplete: () => void;
}

const VideoAdminActions: React.FC<VideoAdminActionsProps> = ({ 
  video, 
  status, 
  onActionComplete 
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: 'block' | 'unblock' | 'unapprove' | 'delete';
    title: string;
    description: string;
    confirmText: string;
    requireReason: boolean;
  } | null>(null);

  const handleBlockVideo = async (reason: string) => {
    try {
      setActionLoading('block');
      
      const { data, error } = await supabase.rpc('admin_block_video', {
        p_pedido_video_id: video.pedido_video_id,
        p_block: true,
        p_reason: reason
      });

      if (error) throw error;

      toast.success('Vídeo bloqueado com sucesso');
      onActionComplete();
    } catch (error) {
      console.error('Erro ao bloquear vídeo:', error);
      toast.error('Erro ao bloquear vídeo');
    } finally {
      setActionLoading(null);
      setModalOpen(false);
    }
  };

  const handleUnblockVideo = async () => {
    try {
      setActionLoading('unblock');
      
      const { data, error } = await supabase.rpc('admin_block_video', {
        p_pedido_video_id: video.pedido_video_id,
        p_block: false,
        p_reason: 'Desbloqueio administrativo'
      });

      if (error) throw error;

      toast.success('Vídeo desbloqueado com sucesso');
      onActionComplete();
    } catch (error) {
      console.error('Erro ao desbloquear vídeo:', error);
      toast.error('Erro ao desbloquear vídeo');
    } finally {
      setActionLoading(null);
      setModalOpen(false);
    }
  };

  const handleUnapproveVideo = async (reason: string) => {
    try {
      setActionLoading('unapprove');
      
      const { data, error } = await supabase.rpc('admin_unapprove_video', {
        p_pedido_video_id: video.pedido_video_id,
        p_reason: reason
      });

      if (error) throw error;

      toast.success('Vídeo desaprovado. Cliente será notificado para enviar um novo vídeo.');
      onActionComplete();
    } catch (error) {
      console.error('Erro ao desaprovar vídeo:', error);
      toast.error('Erro ao desaprovar vídeo');
    } finally {
      setActionLoading(null);
      setModalOpen(false);
    }
  };

  const handleDeleteVideo = async (reason: string) => {
    try {
      setActionLoading('delete');
      
      const { error } = await supabase
        .from('pedido_videos')
        .delete()
        .eq('id', video.pedido_video_id);

      if (error) throw error;

      // Log da ação
      await supabase
        .from('log_eventos_sistema')
        .insert({
          tipo_evento: 'VIDEO_DELETED_ADMIN',
          descricao: `Admin deleted video ${video.video_id}. Reason: ${reason}`
        });

      toast.success('Vídeo excluído permanentemente');
      onActionComplete();
    } catch (error) {
      console.error('Erro ao excluir vídeo:', error);
      toast.error('Erro ao excluir vídeo');
    } finally {
      setActionLoading(null);
      setModalOpen(false);
    }
  };

  const openModal = (type: 'block' | 'unblock' | 'unapprove' | 'delete') => {
    const configs = {
      block: {
        title: 'Bloquear Vídeo',
        description: `Tem certeza que deseja bloquear o vídeo "${video.video_name}"? O vídeo será desativado mas permanecerá aprovado.`,
        confirmText: 'Bloquear Vídeo',
        requireReason: true
      },
      unblock: {
        title: 'Desbloquear Vídeo',
        description: `Tem certeza que deseja desbloquear o vídeo "${video.video_name}"?`,
        confirmText: 'Desbloquear Vídeo',
        requireReason: false
      },
      unapprove: {
        title: 'Desaprovar Vídeo',
        description: `Tem certeza que deseja desaprovar o vídeo "${video.video_name}"? O vídeo será rejeitado e o cliente precisará enviar um novo.`,
        confirmText: 'Desaprovar Vídeo',
        requireReason: true
      },
      delete: {
        title: 'Excluir Vídeo',
        description: `ATENÇÃO: Esta ação é irreversível! O vídeo "${video.video_name}" será excluído permanentemente do sistema.`,
        confirmText: 'Excluir Permanentemente',
        requireReason: true
      }
    };

    setModalConfig({ type, ...configs[type] });
    setModalOpen(true);
  };

  const handleModalConfirm = async (reason?: string) => {
    if (!modalConfig) return;

    switch (modalConfig.type) {
      case 'block':
        await handleBlockVideo(reason || '');
        break;
      case 'unblock':
        await handleUnblockVideo();
        break;
      case 'unapprove':
        await handleUnapproveVideo(reason || '');
        break;
      case 'delete':
        await handleDeleteVideo(reason || '');
        break;
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {status.is_blocked ? (
          <Button
            size="sm"
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            disabled={actionLoading === 'unblock'}
            onClick={() => openModal('unblock')}
          >
            <Shield className="h-4 w-4 mr-2" />
            {actionLoading === 'unblock' ? 'Desbloqueando...' : 'Desbloquear'}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
            disabled={actionLoading === 'block'}
            onClick={() => openModal('block')}
          >
            <Ban className="h-4 w-4 mr-2" />
            {actionLoading === 'block' ? 'Bloqueando...' : 'Bloquear'}
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
          disabled={actionLoading === 'unapprove'}
          onClick={() => openModal('unapprove')}
        >
          <XCircle className="h-4 w-4 mr-2" />
          {actionLoading === 'unapprove' ? 'Desaprovando...' : 'Desaprovar'}
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
          disabled={actionLoading === 'delete'}
          onClick={() => openModal('delete')}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {actionLoading === 'delete' ? 'Excluindo...' : 'Excluir'}
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          onClick={() => {
            window.open(`/admin/pedidos/${video.pedido_id}#video-scheduling`, '_blank');
          }}
        >
          <Settings className="h-4 w-4 mr-2" />
          Agendamento
        </Button>
      </div>

      {modalConfig && (
        <AdminActionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title={modalConfig.title}
          description={modalConfig.description}
          confirmText={modalConfig.confirmText}
          requireReason={modalConfig.requireReason}
          loading={actionLoading !== null}
          destructive={modalConfig.type === 'delete'}
          onConfirm={handleModalConfirm}
        />
      )}
    </>
  );
};

export default VideoAdminActions;