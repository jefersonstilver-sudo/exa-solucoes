
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Play, User, RefreshCw, Download, Eye } from 'lucide-react';
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
      console.log('✅ Buscando vídeos aprovados recentemente...');
      
      const { data, error } = await supabase.rpc('get_recently_approved_videos');

      if (error) {
        console.error('❌ Erro ao buscar vídeos aprovados:', error);
        throw error;
      }

      console.log('✅ Vídeos aprovados encontrados:', data?.length || 0);
      setApprovedVideos(data || []);
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
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#00FFAB]" />
            <span className="ml-3 text-white">Carregando vídeos aprovados...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="border-b border-slate-700/50">
          <CardTitle className="flex items-center text-white">
            <CheckCircle className="h-5 w-5 mr-2 text-[#00FFAB]" />
            Vídeos Aprovados Recentemente
          </CardTitle>
          <CardDescription className="text-slate-300">
            Vídeos aprovados nos últimos 30 dias - Pronto para ativação
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {approvedVideos.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhum vídeo aprovado recentemente
              </h3>
              <p className="text-slate-400">
                Vídeos aprovados aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedVideos.map((video) => (
                <Card key={video.id} className="bg-gradient-to-br from-[#00FFAB]/10 to-slate-800/50 border-[#00FFAB]/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-[#00FFAB] text-[#3C1361] font-semibold">
                          Aprovado
                        </Badge>
                        {video.is_active && (
                          <Badge className="bg-[#3C1361] text-white">
                            ATIVO
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-slate-400">
                        {formatDate(video.approved_at)}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-[#00FFAB]" />
                        <div>
                          <span className="font-medium text-white">{video.client_name}</span>
                          <div className="text-xs text-slate-400">{video.client_email}</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-slate-300 space-y-1">
                        <p><strong>Valor:</strong> {formatCurrency(video.pedido_valor)}</p>
                        <p><strong>Arquivo:</strong> {video.video_nome}</p>
                        <p><strong>Slot:</strong> {video.slot_position}</p>
                      </div>

                      {/* Preview do Vídeo */}
                      <div className="bg-slate-900 rounded-lg aspect-video flex items-center justify-center relative border border-slate-700/50">
                        <div className="text-center text-white">
                          <Play className="h-8 w-8 mx-auto mb-1" />
                          <p className="text-xs">Vídeo Aprovado</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(video.video_url, '_blank')}
                          className="absolute top-2 right-2 text-white hover:bg-white/20"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(video.video_url, '_blank')}
                        className="w-full border-[#00FFAB] text-[#00FFAB] hover:bg-[#00FFAB] hover:text-[#3C1361]"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      
                      {!video.is_active && (
                        <Button
                          onClick={() => activateVideo(video.pedido_id, video.id, video.client_name)}
                          disabled={actionLoading}
                          className="w-full bg-[#00FFAB] hover:bg-[#00FFAB]/80 text-[#3C1361] font-semibold"
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
