import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Video, 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  Play,
  User,
  Calendar,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface VideoWithDetails {
  id: string;
  pedido_id: string;
  slot_position: number;
  approval_status: string;
  is_active: boolean;
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
  video: {
    id: string;
    nome: string;
    url: string;
    duracao: number;
    orientacao: string;
    tamanho_arquivo?: number;
    formato?: string;
    created_at: string;
  };
  client_email: string;
  client_name: string;
  pedido_valor: number;
}

const VideoManagement = () => {
  const [videos, setVideos] = useState<VideoWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState<VideoWithDetails | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('pedido_videos')
        .select(`
          id,
          pedido_id,
          slot_position,
          approval_status,
          is_active,
          rejection_reason,
          created_at,
          approved_at,
          videos (
            id,
            nome,
            url,
            duracao,
            orientacao,
            tamanho_arquivo,
            formato,
            created_at
          ),
          pedidos (
            valor_total,
            client_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar informações dos clientes
      const videosWithClientInfo = await Promise.all(
        data.map(async (video: any) => {
          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', video.pedidos.client_id)
            .single();

          const { data: authData } = await supabase.auth.admin.getUserById(video.pedidos.client_id);

          return {
            id: video.id,
            pedido_id: video.pedido_id,
            slot_position: video.slot_position,
            approval_status: video.approval_status,
            is_active: video.is_active,
            rejection_reason: video.rejection_reason,
            created_at: video.created_at,
            approved_at: video.approved_at,
            video: video.videos,
            client_email: userData?.email || authData.user?.email || 'Email não encontrado',
            client_name: authData.user?.user_metadata?.full_name || 'Nome não encontrado',
            pedido_valor: video.pedidos.valor_total
          };
        })
      );

      setVideos(videosWithClientInfo);
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
      toast.error('Erro ao carregar vídeos');
    } finally {
      setLoading(false);
    }
  };

  const approveVideo = async (videoId: string) => {
    try {
      setActionLoading(true);
      
      const { data, error } = await supabase.rpc('approve_video', {
        p_pedido_video_id: videoId,
        p_approved_by: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      toast.success('Vídeo aprovado com sucesso!');
      loadVideos();
    } catch (error) {
      console.error('Erro ao aprovar vídeo:', error);
      toast.error('Erro ao aprovar vídeo');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectVideo = async (videoId: string, reason: string) => {
    try {
      setActionLoading(true);
      
      const { data, error } = await supabase.rpc('reject_video', {
        p_pedido_video_id: videoId,
        p_approved_by: (await supabase.auth.getUser()).data.user?.id,
        p_rejection_reason: reason
      });

      if (error) throw error;

      toast.success('Vídeo rejeitado');
      setSelectedVideo(null);
      setRejectionReason('');
      loadVideos();
    } catch (error) {
      console.error('Erro ao rejeitar vídeo:', error);
      toast.error('Erro ao rejeitar vídeo');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.video.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || video.approval_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800">ATIVO</Badge>;
    }
    
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconhecido</Badge>;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-indexa-purple" />
        <p className="ml-2 text-lg text-gray-900">Carregando vídeos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Vídeos</h1>
            <p className="text-gray-600 mt-1">
              Gerencie todos os vídeos enviados pelos clientes
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome do vídeo, cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Vídeos */}
        <div className="grid gap-4">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    {/* Preview do Vídeo */}
                    <div className="w-24 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Play className="h-6 w-6 text-gray-600" />
                    </div>

                    {/* Informações do Vídeo */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900 truncate">{video.video.nome}</h3>
                        {getStatusIcon(video.approval_status)}
                        {getStatusBadge(video.approval_status, video.is_active)}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {video.client_name} ({video.client_email})
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(video.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span>Slot {video.slot_position}</span>
                          <span>{video.video.duracao}s</span>
                          <span>{formatFileSize(video.video.tamanho_arquivo)}</span>
                          <span>Pedido: {formatCurrency(video.pedido_valor)}</span>
                        </div>
                      </div>

                      {video.rejection_reason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                          <strong>Motivo da rejeição:</strong> {video.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(video.video.url, '_blank')}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>

                    {video.approval_status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => approveVideo(video.id)}
                          disabled={actionLoading}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aprovar
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedVideo(video)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejeitar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-white border-gray-200">
                            <DialogHeader>
                              <DialogTitle className="text-gray-900">Rejeitar Vídeo</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700">
                                  Motivo da rejeição:
                                </label>
                                <Textarea
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Explique o motivo da rejeição..."
                                  className="mt-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                                  rows={3}
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedVideo(null);
                                    setRejectionReason('');
                                  }}
                                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  onClick={() => selectedVideo && rejectVideo(selectedVideo.id, rejectionReason)}
                                  disabled={!rejectionReason.trim() || actionLoading}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Rejeitar Vídeo
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-12 text-center">
              <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum vídeo encontrado</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Nenhum vídeo foi enviado ainda.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VideoManagement;
