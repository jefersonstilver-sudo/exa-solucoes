
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Calendar, 
  Monitor, 
  DollarSign, 
  Video, 
  Loader2,
  AlertCircle,
  Star,
  CheckCircle,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useOrderVideoManagement } from '@/hooks/useOrderVideoManagement';
import { VideoSlotGrid } from '@/components/video-management/VideoSlotGrid';
import { VideoHealthDiagnostic } from '@/components/video-management/VideoHealthDiagnostic';

interface OrderDetails {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio?: string;
  data_fim?: string;
  client_id: string;
}

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    videoSlots,
    loading: videosLoading,
    loadError: videosLoadError,
    uploading,
    uploadProgress,
    selectVideoForDisplay,
    activateVideo,
    removeVideo,
    uploadVideo
  } = useOrderVideoManagement(id || '');

  useEffect(() => {
    if (id && userProfile?.id) {
      loadOrderDetails();
    } else {
      setLoading(false);
    }
  }, [id, userProfile]);

  const loadOrderDetails = async () => {
    if (!id || !userProfile?.id) return;

    try {
      const { data: userOrder, error: userError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', id)
        .eq('client_id', userProfile.id)
        .single();

      if (userError) throw userError;

      setOrderDetails(userOrder);
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      toast.error('Erro ao carregar detalhes do pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (slotPosition: number, file: File) => {
    if (!userProfile?.id || !id) return;
    await uploadVideo(slotPosition, file, userProfile.id);
  };

  const handleVideoDownload = (videoUrl: string, fileName: string) => {
    window.open(videoUrl, '_blank');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const hasSelectedVideo = videoSlots.some(slot => slot.video_data && slot.selected_for_display);
  const totalVideos = videoSlots.filter(slot => slot.video_data).length;
  const approvedSelectedVideo = videoSlots.find(slot => 
    slot.selected_for_display && slot.approval_status === 'approved'
  );

  if (loading || videosLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-indexa-purple" />
        <p className="ml-2 text-lg">Carregando detalhes...</p>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-xl font-medium mb-2">Pedido não encontrado</h3>
        <p className="text-gray-600 mb-4">
          Não foi possível carregar os detalhes do pedido.
        </p>
        <Button onClick={() => navigate('/anunciante/pedidos')}>
          Voltar aos Pedidos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/anunciante/pedidos')}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detalhes do Pedido</h1>
          <p className="text-gray-600 mt-1">#{orderDetails.id.substring(0, 8)}</p>
        </div>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-medium">Valor Total</p>
                <p className="text-lg">{formatCurrency(orderDetails.valor_total)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Monitor className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium">Painéis</p>
                <p className="text-lg">{orderDetails.lista_paineis?.length || 0} selecionados</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <p className="font-medium">Duração</p>
                <p className="text-lg">{orderDetails.plano_meses} meses</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-orange-500" />
              <div>
                <p className="font-medium">Criado em</p>
                <p className="text-lg">{formatDate(orderDetails.created_at)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error de carregamento de vídeos */}
      {videosLoadError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Erro ao Carregar Vídeos</h3>
                <p className="text-sm text-red-700 mt-1">{videosLoadError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Selection Status */}
      {totalVideos > 0 && (
        <Card className={`${approvedSelectedVideo ? 'border-green-200 bg-green-50' : hasSelectedVideo ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              {approvedSelectedVideo ? (
                <CheckCircle className="h-6 w-6 text-green-600 fill-current" />
              ) : hasSelectedVideo ? (
                <Star className="h-6 w-6 text-yellow-600 fill-current" />
              ) : (
                <Star className="h-6 w-6 text-red-600" />
              )}
              <div>
                <h3 className={`font-medium ${approvedSelectedVideo ? 'text-green-800' : hasSelectedVideo ? 'text-yellow-800' : 'text-red-800'}`}>
                  {approvedSelectedVideo 
                    ? 'Vídeo Aprovado e Pronto para Exibição!' 
                    : hasSelectedVideo 
                      ? 'Vídeo Selecionado - Aguardando Aprovação'
                      : 'Nenhum Vídeo Selecionado'
                  }
                </h3>
                <p className={`text-sm ${approvedSelectedVideo ? 'text-green-600' : hasSelectedVideo ? 'text-yellow-600' : 'text-red-600'}`}>
                  {approvedSelectedVideo 
                    ? 'Seu vídeo foi aprovado pelos administradores e está pronto para ser exibido nos painéis.'
                    : hasSelectedVideo 
                      ? 'Seu vídeo está selecionado e aguardando aprovação dos administradores.'
                      : 'Você deve selecionar qual dos seus vídeos será exibido nos painéis.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Video Management and Diagnostics */}
      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="videos" className="flex items-center space-x-2">
            <Video className="h-4 w-4" />
            <span>Gestão de Vídeos</span>
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Diagnóstico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Video className="h-5 w-5 mr-2" />
                Gestão de Vídeos (4 Slots)
              </CardTitle>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  Envie até 4 vídeos (máx. 15s, horizontal, 100MB). <strong>Você deve selecionar qual vídeo será exibido.</strong>
                </p>
                <p className="text-green-600 font-medium">
                  ✓ Áudio será automaticamente silenciado durante reprodução
                </p>
                <p className="text-blue-600">
                  ⭐ Use o botão "Selecionar para Exibição" para escolher qual vídeo será mostrado nos painéis
                </p>
                <p className="text-purple-600">
                  📁 Arquivos são salvos de forma segura no seu storage pessoal
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <VideoSlotGrid
                videoSlots={videoSlots}
                uploading={uploading}
                uploadProgress={uploadProgress}
                onUpload={handleVideoUpload}
                onActivate={activateVideo}
                onRemove={removeVideo}
                onSelectForDisplay={selectVideoForDisplay}
                onDownload={handleVideoDownload}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <VideoHealthDiagnostic orderId={id || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderDetails;
