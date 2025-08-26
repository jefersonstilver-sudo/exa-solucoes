import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, RotateCcw, Trash2, ExternalLink, User, DollarSign, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RejectedVideo {
  id: string;
  pedido_id: string;
  video_id: string;
  slot_position: number;
  rejection_reason: string;
  approved_at: string;
  client_id: string;
  client_email: string;
  client_name: string;
  pedido_valor: number;
  video_nome: string;
  video_url: string;
  video_duracao: number;
  video_orientacao: string;
}

interface RealRejectedVideosSectionProps {
  loading: boolean;
  onRefresh: () => void;
}

const RealRejectedVideosSection: React.FC<RealRejectedVideosSectionProps> = ({ loading, onRefresh }) => {
  const [rejectedVideos, setRejectedVideos] = useState<RejectedVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRejectedVideos = async () => {
    try {
      setLoadingVideos(true);
      console.log('🔍 Buscando vídeos rejeitados...');
      
      const { data, error } = await supabase
        .from('pedido_videos')
        .select(`
          id,
          pedido_id,
          video_id,
          slot_position,
          rejection_reason,
          approved_at,
          pedidos!inner (
            id,
            client_id,
            valor_total,
            users!inner (
              id,
              email
            )
          ),
          videos!inner (
            id,
            nome,
            url,
            duracao,
            orientacao
          )
        `)
        .eq('approval_status', 'rejected')
        .order('approved_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar vídeos rejeitados:', error);
        toast.error('Erro ao carregar vídeos rejeitados');
        return;
      }

      console.log('✅ Vídeos rejeitados encontrados:', data?.length || 0);
      
      // Transformar os dados para o formato esperado
      const transformedData: RejectedVideo[] = (data || []).map(item => ({
        id: item.id,
        pedido_id: item.pedido_id,
        video_id: item.video_id,
        slot_position: item.slot_position,
        rejection_reason: item.rejection_reason || '',
        approved_at: item.approved_at || '',
        client_id: item.pedidos.client_id,
        client_email: item.pedidos.users.email,
        client_name: item.pedidos.users.email, // usando email como nome por enquanto
        pedido_valor: item.pedidos.valor_total,
        video_nome: item.videos.nome,
        video_url: item.videos.url,
        video_duracao: item.videos.duracao,
        video_orientacao: item.videos.orientacao
      }));
      
      setRejectedVideos(transformedData);
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      toast.error('Erro inesperado ao carregar dados');
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleRevertRejection = async (videoId: string) => {
    try {
      setActionLoading(true);
      console.log('🔄 Revertendo rejeição do vídeo:', videoId);

      const { error } = await supabase
        .from('pedido_videos')
        .update({
          approval_status: 'pending',
          rejection_reason: null,
          approved_at: null,
          approved_by: null
        })
        .eq('id', videoId);

      if (error) throw error;

      toast.success('Rejeição revertida! Vídeo voltou para análise');
      await fetchRejectedVideos();
      onRefresh();
    } catch (error) {
      console.error('❌ Erro ao reverter rejeição:', error);
      toast.error('Erro ao reverter rejeição');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      setActionLoading(true);
      console.log('🗑️ Excluindo vídeo definitivamente:', videoId);

      const { error } = await supabase
        .from('pedido_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast.success('Vídeo excluído definitivamente');
      await fetchRejectedVideos();
      onRefresh();
    } catch (error) {
      console.error('❌ Erro ao excluir vídeo:', error);
      toast.error('Erro ao excluir vídeo');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchRejectedVideos();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <Video className="h-5 w-5 mr-2" />
            Vídeos Rejeitados ({rejectedVideos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingVideos ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full mx-auto h-8 w-8 border-b-2 border-red-600"></div>
              <p className="text-gray-600 mt-2">Carregando vídeos rejeitados...</p>
            </div>
          ) : rejectedVideos.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">Nenhum vídeo rejeitado encontrado</p>
              <p className="text-gray-500">Todos os vídeos foram aprovados ou estão pendentes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rejectedVideos.map((video) => (
                <Card key={video.id} className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {video.video_nome}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {video.client_name || video.client_email}
                              </span>
                              <span className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {formatCurrency(video.pedido_valor)}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatDuration(video.video_duracao)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="destructive">Rejeitado</Badge>
                            <Badge variant="outline">{video.video_orientacao}</Badge>
                          </div>
                        </div>

                        <div className="bg-red-100 p-3 rounded-lg">
                          <p className="text-sm font-medium text-red-800 mb-1">Motivo da Rejeição:</p>
                          <p className="text-sm text-red-700">{video.rejection_reason}</p>
                        </div>

                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          Rejeitado em: {formatDate(video.approved_at)}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 lg:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(video.video_url, '_blank')}
                          className="flex items-center"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Ver Vídeo
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevertRejection(video.id)}
                          disabled={actionLoading}
                          className="flex items-center text-orange-600 hover:text-orange-700"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reverter
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading}
                              className="flex items-center text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Vídeo Definitivamente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O vídeo "{video.video_nome}" será removido permanentemente do sistema.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteVideo(video.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir Definitivamente
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealRejectedVideosSection;