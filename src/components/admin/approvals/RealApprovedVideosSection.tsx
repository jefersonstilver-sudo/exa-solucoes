import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Play, User, RefreshCw, Download, Eye, UserCheck, Shield, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApprovedVideo {
  pedido_video_id: string;
  video_id: string;
  video_name: string;
  slot_position: number;
  approved_at: string;
  pedido_id: string;
  client_id: string;
  client_email: string;
  client_name: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio: string;
  data_fim: string;
  approved_by: string;
  approver_email: string;
  approver_name: string;
  created_at: string;
}

interface RealApprovedVideosSectionProps {
  loading: boolean;
  onRefresh: () => void;
}

const RealApprovedVideosSection: React.FC<RealApprovedVideosSectionProps> = ({ loading, onRefresh }) => {
  const [approvedVideos, setApprovedVideos] = useState<ApprovedVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchApprovedVideos = async () => {
    try {
      setLoadingVideos(true);
      
      // Usar função segura do banco para buscar dados completos
      const { data, error } = await supabase.rpc('get_approved_videos_with_details');

      if (error) {
        console.error('Erro ao buscar vídeos aprovados:', error);
        if (error.message.includes('Access denied')) {
          toast.error('Acesso negado: Apenas super admins podem visualizar esta seção');
        } else {
          toast.error('Erro ao carregar vídeos aprovados');
        }
        return;
      }

      if (!data || data.length === 0) {
        setApprovedVideos([]);
        return;
      }

      // Mapear dados da função para o formato esperado
      const mappedVideos: ApprovedVideo[] = data.map((item: any) => ({
        pedido_video_id: item.pedido_video_id,
        video_id: item.video_id,
        video_name: item.video_name || 'Vídeo sem nome',
        slot_position: item.slot_position,
        approved_at: item.approved_at,
        pedido_id: item.pedido_id,
        client_id: item.client_id,
        client_email: item.client_email,
        client_name: item.client_name,
        valor_total: item.valor_total,
        lista_paineis: item.lista_paineis || [],
        plano_meses: item.plano_meses,
        data_inicio: item.data_inicio,
        data_fim: item.data_fim,
        approved_by: item.approved_by,
        approver_email: item.approver_email,
        approver_name: item.approver_name,
        created_at: item.created_at,
      }));

      setApprovedVideos(mappedVideos);
    } catch (error) {
      console.error('Erro geral ao buscar vídeos aprovados:', error);
      toast.error('Erro ao carregar vídeos aprovados');
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchApprovedVideos();
  }, []);

  const activateVideo = async (pedidoId: string, pedidoVideoId: string) => {
    try {
      setActionLoading(pedidoVideoId);
      
      const { data, error } = await supabase.rpc('activate_video', {
        p_pedido_id: pedidoId,
        p_pedido_video_id: pedidoVideoId
      });

      if (error) {
        console.error('Erro ao ativar vídeo:', error);
        toast.error('Erro ao ativar vídeo');
        return;
      }

      if (data) {
        toast.success('Vídeo ativado com sucesso!');
        fetchApprovedVideos(); // Recarregar dados
        onRefresh(); // Atualizar estatísticas
      } else {
        toast.error('Falha ao ativar vídeo');
      }
    } catch (error) {
      console.error('Erro ao ativar vídeo:', error);
      toast.error('Erro ao ativar vídeo');
    } finally {
      setActionLoading(null);
    }
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

  if (loadingVideos || loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-600" />
            <span className="ml-3 text-gray-900">Carregando vídeos aprovados...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="flex items-center text-gray-900">
            <Shield className="h-5 w-5 mr-2 text-green-600" />
            Vídeos Aprovados Recentemente ({approvedVideos.length})
            <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
              Auditoria Segura
            </Badge>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Lista dos últimos vídeos aprovados com trilha de auditoria completa
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {approvedVideos.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum vídeo aprovado recentemente
              </h3>
              <p className="text-gray-600">
                Vídeos aprovados aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {approvedVideos.map((video) => (
                <Card key={video.pedido_video_id} className="bg-white border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                          <Play className="h-5 w-5 text-blue-600" />
                          {video.video_name}
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Slot {video.slot_position}
                          </Badge>
                        </CardTitle>
                        
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">Cliente:</span>
                              <span className="text-gray-900">{video.client_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">@</span>
                              <span className="text-gray-700">{video.client_email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="font-medium">Aprovado por:</span>
                              <span className="text-gray-900">{video.approver_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">@</span>
                              <span className="text-gray-700">{video.approver_email}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">Valor:</span>
                              <span className="text-gray-900">{formatCurrency(video.valor_total)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">Período:</span>
                              <span className="text-gray-900">{video.plano_meses} meses</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">Aprovado em:</span>
                              <span className="text-gray-900">{formatDate(video.approved_at)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {video.data_inicio && video.data_fim && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-blue-700">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">Período de Exibição:</span>
                              <span>{formatDate(video.data_inicio)} até {formatDate(video.data_fim)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          onClick={() => {
                            window.open(`/admin/video-preview/${video.video_id}`, '_blank');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `/admin/download-video/${video.video_id}`;
                            link.download = `${video.video_name}.mp4`;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        
                        <Button
                          size="sm"
                          className="bg-blue-600 text-white hover:bg-blue-700"
                          disabled={actionLoading === video.pedido_video_id}
                          onClick={() => activateVideo(video.pedido_id, video.pedido_video_id)}
                        >
                          {actionLoading === video.pedido_video_id ? (
                            <div className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Ativando...
                            </div>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Ativar Vídeo
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealApprovedVideosSection;