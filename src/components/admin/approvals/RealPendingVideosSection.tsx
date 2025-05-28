
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Play, User, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      console.log('🎥 Buscando vídeos pendentes de aprovação...');
      
      const { data, error } = await supabase.rpc('get_pending_approval_videos');

      if (error) {
        console.error('❌ Erro ao buscar vídeos pendentes:', error);
        throw error;
      }

      console.log('✅ Vídeos pendentes encontrados:', data?.length || 0);
      setPendingVideos(data || []);
    } catch (error) {
      console.error('💥 Erro ao carregar vídeos pendentes:', error);
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
      console.log(`✅ Aprovando vídeo ${videoId}...`);
      
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
      console.log(`❌ Rejeitando vídeo ${videoId}...`);
      
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

  if (loadingVideos || loading) {
    return (
      <Card className="bg-white border-[#3C1361]/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#3C1361]" />
            <span className="ml-3 text-gray-600">Carregando vídeos para aprovação...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-[#3C1361]/20">
        <CardHeader>
          <CardTitle className="flex items-center text-[#3C1361]">
            <AlertTriangle className="h-5 w-5 mr-2 text-[#00FFAB]" />
            Vídeos Aguardando Aprovação
          </CardTitle>
          <CardDescription>
            Analise os vídeos conforme diretrizes CONAR - Conteúdo familiar adequado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingVideos.length === 0 ? (
            <div className="text-center py-12">
              <Play className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum vídeo para aprovação
              </h3>
              <p className="text-gray-500">
                Todos os vídeos enviados foram processados
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {pendingVideos.map((video) => (
                <Card key={video.id} className="border-[#3C1361]/30 bg-gradient-to-br from-[#3C1361]/5 to-white">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Informações do Cliente e Pedido */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-[#3C1361] text-white">
                            Aguardando Aprovação
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Enviado em: {formatDate(video.created_at)}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-[#3C1361]" />
                            <div>
                              <span className="font-medium text-[#3C1361]">{video.client_name}</span>
                              <div className="text-sm text-gray-600">{video.client_email}</div>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Valor:</strong> {formatCurrency(video.pedido_valor)}</p>
                            <p><strong>Arquivo:</strong> {video.video_nome}</p>
                            <p><strong>Duração:</strong> {video.video_duracao}s • {video.video_orientacao}</p>
                          </div>
                        </div>

                        {/* Player de Vídeo */}
                        <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative">
                          <div className="text-center text-white">
                            <Play className="h-12 w-12 mx-auto mb-2" />
                            <p className="text-sm">Vídeo do Cliente</p>
                            <p className="text-xs text-gray-300">{video.video_duracao}s • {video.video_orientacao}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(video.video_url, '_blank')}
                            className="absolute top-2 right-2 text-white hover:bg-white/20"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Painel de Aprovação/Rejeição */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-[#3C1361]">Análise CONAR</h3>
                        
                        <div className="bg-[#00FFAB]/10 border border-[#00FFAB]/30 rounded-lg p-4">
                          <h4 className="font-medium text-[#3C1361] mb-2">Verificar:</h4>
                          <ul className="text-sm text-[#3C1361] space-y-1">
                            <li>• Conteúdo adequado para ambiente familiar</li>
                            <li>• Ausência de propaganda inadequada</li>
                            <li>• Linguagem apropriada</li>
                            <li>• Imagens não violentas</li>
                            <li>• Conformidade com regulamentações</li>
                          </ul>
                        </div>

                        {/* Motivos de Rejeição */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[#3C1361]">
                            Motivo da rejeição (se aplicável):
                          </label>
                          <select
                            value={rejectionReason[video.id] || ''}
                            onChange={(e) => setRejectionReason(prev => ({
                              ...prev,
                              [video.id]: e.target.value
                            }))}
                            className="w-full p-2 border border-[#3C1361]/30 rounded-md text-sm focus:border-[#3C1361] focus:ring-[#3C1361]"
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
                            className="text-sm border-[#3C1361]/30 focus:border-[#3C1361] focus:ring-[#3C1361]"
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
                            className="flex-1 bg-[#00FFAB] hover:bg-[#00FFAB]/80 text-[#3C1361] font-semibold"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                          </Button>
                          
                          <Button
                            onClick={() => rejectVideo(video.id, video.client_name)}
                            variant="outline"
                            className="flex-1 border-[#3C1361] text-[#3C1361] hover:bg-[#3C1361] hover:text-white"
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
