
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Play, User, RefreshCw, Download, Eye, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApprovedVideo {
  id: string;
  pedido_id: string;
  video_id: string;
  slot_position: number;
  approved_at: string;
  is_active: boolean;
  client_email: string;
  client_name: string;
  pedido_valor: number;
  video_nome: string;
  video_url: string;
  approved_by_email?: string;
  approved_by_name?: string;
}

interface RealApprovedVideosSectionProps {
  loading: boolean;
  onRefresh: () => void;
}

const RealApprovedVideosSection: React.FC<RealApprovedVideosSectionProps> = ({ loading, onRefresh }) => {
  const [approvedVideos, setApprovedVideos] = useState<ApprovedVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApprovedVideos = async () => {
    try {
      setLoadingVideos(true);
      console.log('✅ Buscando vídeos aprovados com informações do aprovador...');
      
      // Query direta para buscar vídeos aprovados com informações do aprovador
      const { data, error } = await supabase
        .from('pedido_videos')
        .select(`
          id,
          pedido_id,
          video_id,
          slot_position,
          approved_at,
          is_active,
          approved_by,
          videos (
            nome,
            url
          ),
          pedidos (
            valor_total,
            client_id
          )
        `)
        .eq('approval_status', 'approved')
        .not('approved_at', 'is', null)
        .order('approved_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ Erro ao buscar vídeos aprovados:', error);
        throw error;
      }

      console.log('📊 Vídeos aprovados encontrados:', data?.length || 0);
      
      // Enriquecer com dados do cliente e aprovador
      const enrichedVideos = await Promise.all(
        (data || []).map(async (video: any) => {
          try {
            // Buscar dados do cliente
            const { data: clientData } = await supabase
              .from('users')
              .select('email')
              .eq('id', video.pedidos.client_id)
              .single();

            const { data: clientAuthData } = await supabase.auth.admin.getUserById(video.pedidos.client_id);

            // Buscar dados do aprovador
            let approvedByEmail = 'Admin não encontrado';
            let approvedByName = 'Admin não encontrado';
            
            if (video.approved_by) {
              const { data: approverAuthData } = await supabase.auth.admin.getUserById(video.approved_by);
              if (approverAuthData.user) {
                approvedByEmail = approverAuthData.user.email || 'Email não encontrado';
                approvedByName = approverAuthData.user.user_metadata?.full_name || 
                                approverAuthData.user.user_metadata?.name || 
                                approverAuthData.user.email || 'Nome não encontrado';
              }
            }

            return {
              id: video.id,
              pedido_id: video.pedido_id,
              video_id: video.video_id,
              slot_position: video.slot_position,
              approved_at: video.approved_at,
              is_active: video.is_active,
              client_email: clientData?.email || clientAuthData.user?.email || 'Email não encontrado',
              client_name: clientAuthData.user?.user_metadata?.full_name || 
                          clientAuthData.user?.user_metadata?.name || 
                          clientAuthData.user?.email || 'Nome não encontrado',
              pedido_valor: video.pedidos.valor_total,
              video_nome: video.videos.nome,
              video_url: video.videos.url,
              approved_by_email: approvedByEmail,
              approved_by_name: approvedByName
            };
          } catch (error) {
            console.warn(`Erro ao buscar dados do vídeo ${video.id}:`, error);
            return {
              id: video.id,
              pedido_id: video.pedido_id,
              video_id: video.video_id,
              slot_position: video.slot_position,
              approved_at: video.approved_at,
              is_active: video.is_active,
              client_email: 'Email não encontrado',
              client_name: 'Nome não encontrado',
              pedido_valor: video.pedidos?.valor_total || 0,
              video_nome: video.videos?.nome || 'Nome não encontrado',
              video_url: video.videos?.url || '',
              approved_by_email: 'Admin não encontrado',
              approved_by_name: 'Admin não encontrado'
            };
          }
        })
      );

      console.log('✅ Vídeos aprovados enriquecidos:', enrichedVideos.length);
      setApprovedVideos(enrichedVideos);
    } catch (error) {
      console.error('💥 Erro ao carregar vídeos aprovados:', error);
      toast.error('Erro ao carregar vídeos aprovados');
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchApprovedVideos();
  }, []);

  const activateVideo = async (pedidoId: string, videoId: string, clientName: string) => {
    try {
      setActionLoading(true);
      console.log(`🔄 Ativando vídeo ${videoId} para pedido ${pedidoId}...`);
      
      const { error } = await supabase.rpc('activate_video', {
        p_pedido_id: pedidoId,
        p_pedido_video_id: videoId
      });

      if (error) throw error;

      toast.success(`Vídeo de ${clientName} ativado com sucesso!`);
      fetchApprovedVideos();
      onRefresh(); // Refresh parent stats
    } catch (error) {
      console.error('Erro ao ativar vídeo:', error);
      toast.error('Erro ao ativar vídeo');
    } finally {
      setActionLoading(false);
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
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Vídeos Aprovados Recentemente ({approvedVideos.length})
          </CardTitle>
          <CardDescription className="text-gray-600">
            Vídeos aprovados nos últimos 30 dias - Pronto para ativação
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedVideos.map((video) => (
                <Card key={video.id} className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-100 text-green-800 font-semibold">
                          Aprovado
                        </Badge>
                        {video.is_active && (
                          <Badge className="bg-blue-100 text-blue-800">
                            ATIVO
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">
                        {formatDate(video.approved_at)}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Informações do Cliente */}
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-600" />
                        <div>
                          <span className="font-medium text-gray-900">{video.client_name}</span>
                          <div className="text-xs text-gray-600">{video.client_email}</div>
                        </div>
                      </div>
                      
                      {/* Informações do Aprovador */}
                      <div className="flex items-center">
                        <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                        <div>
                          <span className="font-medium text-green-600">Aprovado por:</span>
                          <div className="text-sm text-gray-900">{video.approved_by_name}</div>
                          <div className="text-xs text-gray-600">{video.approved_by_email}</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 space-y-1">
                        <p><strong>Valor:</strong> {formatCurrency(video.pedido_valor)}</p>
                        <p><strong>Arquivo:</strong> {video.video_nome}</p>
                        <p><strong>Slot:</strong> {video.slot_position}</p>
                      </div>

                      {/* Preview do Vídeo */}
                      <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center relative border border-gray-200">
                        <div className="text-center text-gray-700">
                          <Play className="h-8 w-8 mx-auto mb-1" />
                          <p className="text-xs">Vídeo Aprovado</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(video.video_url, '_blank')}
                          className="absolute top-2 right-2 text-gray-600 hover:bg-gray-200"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(video.video_url, '_blank')}
                        className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      
                      {!video.is_active && (
                        <Button
                          onClick={() => activateVideo(video.pedido_id, video.id, video.client_name)}
                          disabled={actionLoading}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativar Vídeo
                        </Button>
                      )}
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

export default RealApprovedVideosSection;
