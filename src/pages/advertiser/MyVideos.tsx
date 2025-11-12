import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Video, Upload, Play, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useVideoActivityTracking } from '@/hooks/tracking/useVideoActivityTracking';

interface VideoData {
  id: string;
  nome: string;
  url: string;
  status: string;
  duracao?: number;
  origem: string;
  created_at: string;
}

const MyVideos = () => {
  const { userProfile } = useAuth();
  const { trackVideoView } = useVideoActivityTracking();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadVideos();
  }, [userProfile]);

  const loadVideos = async () => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('client_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVideos(data || []);
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
      toast.error('Erro ao carregar vídeos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Em Análise</Badge>;
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleUpload = () => {
    // Verificar se o usuário tem pedidos pagos primeiro
    checkPaidOrders();
  };

  const checkPaidOrders = async () => {
    if (!userProfile?.id) return;

    try {
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('client_id', userProfile.id)
        .eq('status', 'pago_pendente_video');

      if (error) throw error;

      if (!pedidos || pedidos.length === 0) {
        toast.error('Você precisa ter pelo menos um pedido pago pendente de vídeo para fazer upload');
        return;
      }

      // Se tem pedidos pagos pendentes, pode fazer upload
      toast.info('Funcionalidade de upload de vídeo em desenvolvimento');
    } catch (error) {
      console.error('Erro ao verificar pedidos:', error);
      toast.error('Erro ao verificar pedidos');
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) return;

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast.success('Vídeo excluído com sucesso');
      loadVideos();
    } catch (error) {
      console.error('Erro ao excluir vídeo:', error);
      toast.error('Erro ao excluir vídeo');
    }
  };

  const handlePreview = (videoId: string, videoUrl: string) => {
    trackVideoView(videoId);
    window.open(videoUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-exa-red" />
        <p className="ml-2 text-lg">Carregando vídeos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Vídeos</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os seus vídeos publicitários</p>
        </div>
        <Button onClick={handleUpload} className="bg-exa-red hover:bg-exa-red/90">
          <Upload className="h-4 w-4 mr-2" />
          Fazer Upload
        </Button>
      </div>

      {/* Vídeos */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg truncate">{video.nome}</CardTitle>
                  {getStatusBadge(video.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <Video className="h-12 w-12 text-gray-400" />
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Duração: {formatDuration(video.duracao)}
                  </div>
                  <div>
                    Origem: {video.origem}
                  </div>
                  <div>
                    Enviado em: {formatDate(video.created_at)}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handlePreview(video.id, video.url)}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Visualizar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteVideo(video.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
              <Video className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">Nenhum vídeo encontrado</h3>
            <p className="text-gray-500 mb-6">
              Você ainda não fez upload de nenhum vídeo. Comece enviando seus materiais criativos.
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={handleUpload} className="bg-exa-red hover:bg-exa-red/90">
                <Upload className="h-4 w-4 mr-2" />
                Fazer Primeiro Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyVideos;
