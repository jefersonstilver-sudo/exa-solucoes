
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
  Upload, 
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface OrderDetails {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio?: string;
  data_fim?: string;
}

interface VideoSlot {
  id?: string;
  slot_position: number;
  video_id?: string;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  video_data?: {
    nome: string;
    url: string;
    duracao: number;
    orientacao: string;
    tem_audio: boolean;
  };
  rejection_reason?: string;
}

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [videoSlots, setVideoSlots] = useState<VideoSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrderDetails();
      loadVideoSlots();
    }
  }, [id]);

  const loadOrderDetails = async () => {
    if (!id || !userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', id)
        .eq('client_id', userProfile.id)
        .single();

      if (error) throw error;
      setOrderDetails(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes do pedido:', error);
      toast.error('Erro ao carregar detalhes do pedido');
    }
  };

  const loadVideoSlots = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Buscar vídeos existentes para este pedido
      const { data: pedidoVideos, error } = await supabase
        .from('pedido_videos')
        .select(`
          id,
          slot_position,
          video_id,
          is_active,
          approval_status,
          rejection_reason,
          videos (
            nome,
            url,
            duracao,
            orientacao,
            tem_audio
          )
        `)
        .eq('pedido_id', id);

      if (error) throw error;

      // Criar slots de 1 a 4 com type casting adequado
      const slots: VideoSlot[] = [1, 2, 3, 4].map(position => {
        const existingVideo = pedidoVideos?.find(pv => pv.slot_position === position);
        
        return {
          id: existingVideo?.id,
          slot_position: position,
          video_id: existingVideo?.video_id,
          is_active: existingVideo?.is_active || false,
          approval_status: (existingVideo?.approval_status as 'pending' | 'approved' | 'rejected') || 'pending',
          video_data: existingVideo?.videos ? {
            nome: existingVideo.videos.nome,
            url: existingVideo.videos.url,
            duracao: existingVideo.videos.duracao,
            orientacao: existingVideo.videos.orientacao,
            tem_audio: existingVideo.videos.tem_audio
          } : undefined,
          rejection_reason: existingVideo?.rejection_reason
        };
      });

      setVideoSlots(slots);
    } catch (error) {
      console.error('Erro ao carregar slots de vídeo:', error);
      toast.error('Erro ao carregar vídeos');
    } finally {
      setLoading(false);
    }
  };

  const validateVideoFile = (file: File): Promise<{ valid: boolean; errors: string[]; videoData: any }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        const errors: string[] = [];
        const duration = Math.round(video.duration);
        const width = video.videoWidth;
        const height = video.videoHeight;
        const orientation = height > width ? 'vertical' : 'horizontal';
        
        // Validações
        if (duration > 15) {
          errors.push('Vídeo deve ter no máximo 15 segundos');
        }
        
        if (orientation !== 'horizontal') {
          errors.push('Vídeo deve estar em orientação horizontal');
        }
        
        // Simulação de detecção de áudio (em produção seria mais complexo)
        const hasAudio = file.size > (width * height * duration * 0.1); // Heurística simples
        if (hasAudio) {
          errors.push('Vídeo não deve conter áudio');
        }
        
        URL.revokeObjectURL(url);
        
        resolve({
          valid: errors.length === 0,
          errors,
          videoData: {
            duracao: duration,
            orientacao: orientation,
            largura: width,
            altura: height,
            tamanho_arquivo: file.size,
            formato: file.type,
            tem_audio: hasAudio
          }
        });
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          valid: false,
          errors: ['Erro ao processar vídeo'],
          videoData: null
        });
      };
      
      video.src = url;
    });
  };

  const handleVideoUpload = async (slotPosition: number, file: File) => {
    if (!userProfile?.id || !id) return;

    try {
      setUploading(true);

      // Validar vídeo
      const validation = await validateVideoFile(file);
      if (!validation.valid) {
        toast.error(validation.errors.join(', '));
        return;
      }

      // Criar registro do vídeo
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          client_id: userProfile.id,
          nome: file.name,
          url: 'pending_upload', // Em produção seria o URL real
          origem: 'cliente',
          status: 'ativo',
          ...validation.videoData
        })
        .select()
        .single();

      if (videoError) throw videoError;

      // Criar ou atualizar slot do vídeo
      const { error: slotError } = await supabase
        .from('pedido_videos')
        .upsert({
          pedido_id: id,
          video_id: videoData.id,
          slot_position: slotPosition,
          approval_status: 'pending'
        });

      if (slotError) throw slotError;

      toast.success('Vídeo enviado para aprovação!');
      loadVideoSlots();
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload do vídeo');
    } finally {
      setUploading(false);
    }
  };

  const activateVideo = async (slotId: string) => {
    if (!id) return;

    try {
      const { data, error } = await supabase.rpc('activate_video', {
        p_pedido_id: id,
        p_pedido_video_id: slotId
      });

      if (error) throw error;

      if (data) {
        toast.success('Vídeo ativado com sucesso!');
        loadVideoSlots();
      } else {
        toast.error('Apenas vídeos aprovados podem ser ativados');
      }
    } catch (error) {
      console.error('Erro ao ativar vídeo:', error);
      toast.error('Erro ao ativar vídeo');
    }
  };

  const removeVideo = async (slotId: string) => {
    if (!confirm('Tem certeza que deseja remover este vídeo?')) return;

    try {
      const { error } = await supabase
        .from('pedido_videos')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast.success('Vídeo removido com sucesso');
      loadVideoSlots();
    } catch (error) {
      console.error('Erro ao remover vídeo:', error);
      toast.error('Erro ao remover vídeo');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
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

  if (loading) {
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
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="font-medium">Criado em</p>
                <p className="text-lg">{formatDate(orderDetails.created_at)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="h-5 w-5 mr-2" />
            Gestão de Vídeos (4 Slots)
          </CardTitle>
          <p className="text-sm text-gray-600">
            Envie até 4 vídeos (máx. 15s, horizontal, sem áudio). Apenas 1 pode estar ativo por vez.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videoSlots.map((slot) => (
              <Card key={slot.slot_position} className={`border-2 ${slot.is_active ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">
                      Slot {slot.slot_position}
                      {slot.is_active && <span className="ml-2 text-green-600">(ATIVO)</span>}
                    </h4>
                    {slot.video_data && getStatusBadge(slot.approval_status)}
                  </div>

                  {slot.video_data ? (
                    <div className="space-y-3">
                      <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                      
                      <div className="text-sm">
                        <p className="font-medium truncate">{slot.video_data.nome}</p>
                        <p className="text-gray-600">
                          {slot.video_data.duracao}s • {slot.video_data.orientacao}
                        </p>
                      </div>

                      {slot.approval_status === 'rejected' && slot.rejection_reason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-red-800 text-sm">{slot.rejection_reason}</p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        {slot.approval_status === 'approved' && !slot.is_active && (
                          <Button
                            size="sm"
                            onClick={() => slot.id && activateVideo(slot.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Ativar
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => slot.id && removeVideo(slot.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-3">Clique para enviar vídeo</p>
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/avi"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleVideoUpload(slot.slot_position, file);
                          }
                        }}
                        className="hidden"
                        id={`upload-${slot.slot_position}`}
                        disabled={uploading}
                      />
                      <label 
                        htmlFor={`upload-${slot.slot_position}`}
                        className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Escolher Arquivo'}
                      </label>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetails;
