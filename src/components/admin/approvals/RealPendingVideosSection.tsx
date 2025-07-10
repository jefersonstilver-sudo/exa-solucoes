
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, User, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VideoPlayer } from '@/components/video-management/VideoPlayer';

interface PendingVideo {
  id: string;
  pedido_id: string;
  video_id: string;
  slot_position: number;
  created_at: string;
  client_email: string;
  client_name: string;
  pedido_valor: number;
  video_nome: string;
  video_url: string;
  video_duracao: number;
  video_orientacao: string;
}

interface RealPendingVideosSectionProps {
  loading: boolean;
  onRefresh: () => void;
}

const RealPendingVideosSection: React.FC<RealPendingVideosSectionProps> = ({ loading, onRefresh }) => {
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [actionLoading, setActionLoading] = useState(false);
  

  const conarViolations = [
    'Conteúdo inadequado para crianças',
    'Propaganda de cigarro/bebidas alcoólicas',
    'Conteúdo de balada/festa inadequado',
    'Linguagem inapropriada',
    'Imagens violentas ou perturbadoras',
    'Propaganda enganosa',
    'Conteúdo sexual explícito',
    'Discriminação ou preconceito',
    'Outro motivo (especificar)'
  ];

  const fetchPendingVideos = async () => {
    try {
      setLoadingVideos(true);
      
      const { data: pendingData, error: pendingError } = await supabase
        .from('pedido_videos')
        .select(`
          id,
          pedido_id,
          video_id,
          slot_position,
          created_at,
          pedidos!inner (
            id,
            valor_total,
            client_id
          ),
          videos!inner (
            id,
            nome,
            url,
            duracao,
            orientacao
          )
        `)
        .eq('approval_status', 'pending');

      if (pendingError) throw pendingError;

      if (!pendingData || pendingData.length === 0) {
        setPendingVideos([]);
        return;
      }

      // Buscar informações dos clientes
      const clientIds = [...new Set(pendingData.map(pv => pv.pedidos.client_id))];
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', clientIds);

      if (usersError) {
        console.warn('Erro ao buscar usuários:', usersError);
      }

      // Transformar dados
      const transformedVideos = pendingData.map(pv => {
        const userData = usersData?.find(u => u.id === pv.pedidos.client_id);
        
        return {
          id: pv.id,
          pedido_id: pv.pedido_id,
          video_id: pv.video_id,
          slot_position: pv.slot_position,
          created_at: pv.created_at,
          client_email: userData?.email || 'Email não encontrado',
          client_name: userData?.email?.split('@')[0] || 'Nome não disponível',
          pedido_valor: pv.pedidos.valor_total,
          video_nome: pv.videos.nome,
          video_url: pv.videos.url,
          video_duracao: pv.videos.duracao,
          video_orientacao: pv.videos.orientacao
        };
      });
      
      setPendingVideos(transformedVideos);
    } catch (error) {
      console.error('Erro ao carregar vídeos pendentes:', error);
      toast.error('Erro ao carregar vídeos pendentes');
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchPendingVideos();
  }, []);

  const approveVideo = async (videoId: string, clientName: string) => {
    try {
      setActionLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.rpc('approve_video', {
        p_pedido_video_id: videoId,
        p_approved_by: userData.user?.id
      });

      if (error) throw error;

      toast.success(`Vídeo de ${clientName} aprovado com sucesso!`);
      onRefresh();
      fetchPendingVideos();
    } catch (error) {
      console.error('Erro ao aprovar vídeo:', error);
      toast.error('Erro ao aprovar vídeo');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectVideo = async (videoId: string, clientName: string) => {
    const reason = rejectionReason[videoId];
    if (!reason) {
      toast.error('Por favor, selecione um motivo para rejeição');
      return;
    }

    try {
      setActionLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.rpc('reject_video', {
        p_pedido_video_id: videoId,
        p_approved_by: userData.user?.id,
        p_rejection_reason: reason
      });

      if (error) throw error;

      toast.success(`Vídeo de ${clientName} rejeitado. Cliente será notificado.`);
      onRefresh();
      fetchPendingVideos();
      setRejectionReason(prev => ({ ...prev, [videoId]: '' }));
    } catch (error) {
      console.error('Erro ao rejeitar vídeo:', error);
      toast.error('Erro ao rejeitar vídeo');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleDownload = (videoUrl: string, fileName: string) => {
    window.open(videoUrl, '_blank');
  };

  if (loadingVideos || loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#00FFAB]" />
            <span className="ml-3 text-black">Carregando vídeos para aprovação...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="flex items-center text-black">
            <AlertTriangle className="h-5 w-5 mr-2 text-[#00FFAB]" />
            Vídeos Aguardando Aprovação
          </CardTitle>
          <CardDescription className="text-gray-600">
            Analise os vídeos conforme diretrizes CONAR - Conteúdo familiar adequado
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {pendingVideos.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-black mb-2">
                Nenhum vídeo para aprovação
              </h3>
              <p className="text-gray-600">
                Todos os vídeos enviados foram processados
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {pendingVideos.map((video) => (
                <Card key={video.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Informações do Cliente e Pedido */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Aguardando Aprovação
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Enviado em: {formatDate(video.created_at)}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-[#00FFAB]" />
                            <div>
                              <span className="font-medium text-black">{video.client_name}</span>
                              <div className="text-sm text-gray-600">{video.client_email}</div>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-700 space-y-1">
                            <p><strong>Valor:</strong> {formatCurrency(video.pedido_valor)}</p>
                            <p><strong>Arquivo:</strong> {video.video_nome}</p>
                            <p><strong>Duração:</strong> {video.video_duracao}s • {video.video_orientacao}</p>
                          </div>
                        </div>

                        {/* Player de Vídeo */}
                        <div className="aspect-video rounded-lg overflow-hidden bg-black">
                          <VideoPlayer
                            src={video.video_url}
                            title={video.video_nome}
                            className="w-full h-full"
                            muted={true}
                            controls={true}
                            onDownload={() => handleDownload(video.video_url, video.video_nome)}
                          />
                        </div>
                      </div>

                      {/* Painel de Aprovação/Rejeição */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-black">Análise CONAR</h3>
                        
                        <div className="bg-[#00FFAB]/10 border border-[#00FFAB]/30 rounded-lg p-4">
                          <h4 className="font-medium text-black mb-2">Verificar:</h4>
                          <ul className="text-sm text-gray-700 space-y-1">
                            <li>• Conteúdo adequado para ambiente familiar</li>
                            <li>• Ausência de propaganda inadequada</li>
                            <li>• Linguagem apropriada</li>
                            <li>• Imagens não violentas</li>
                            <li>• Conformidade com regulamentações</li>
                          </ul>
                        </div>

                        {/* Motivos de Rejeição */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-black">
                            Motivo da rejeição (se aplicável):
                          </label>
                          <select
                            value={rejectionReason[video.id] || ''}
                            onChange={(e) => setRejectionReason(prev => ({
                              ...prev,
                              [video.id]: e.target.value
                            }))}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-black focus:border-[#00FFAB] focus:ring-[#00FFAB]"
                          >
                            <option value="">Selecione um motivo...</option>
                            {conarViolations.map((violation) => (
                              <option key={violation} value={violation}>
                                {violation}
                              </option>
                            ))}
                          </select>
                        </div>

                        {rejectionReason[video.id] === 'Outro motivo (especificar)' && (
                          <Textarea
                            placeholder="Especifique o motivo da rejeição..."
                            className="text-sm border-gray-300 bg-white text-black focus:border-[#00FFAB] focus:ring-[#00FFAB]"
                            onChange={(e) => setRejectionReason(prev => ({
                              ...prev,
                              [video.id]: `Outro motivo: ${e.target.value}`
                            }))}
                          />
                        )}

                        {/* Botões de Ação */}
                        <div className="flex space-x-3 pt-4">
                          <Button
                            onClick={() => approveVideo(video.id, video.client_name)}
                            disabled={actionLoading}
                            className="flex-1 bg-[#00FFAB] hover:bg-[#00FFAB]/80 text-black font-semibold"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                          </Button>
                          
                          <Button
                            onClick={() => rejectVideo(video.id, video.client_name)}
                            variant="outline"
                            className="flex-1 border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                            disabled={!rejectionReason[video.id] || actionLoading}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeitar
                          </Button>
                        </div>
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

export default RealPendingVideosSection;
