
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Play, User, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PendingVideo {
  id: string;
  created_at: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  client_id: string;
  client_email?: string;
  video_url?: string;
  log_pagamento?: any;
}

interface PendingVideosSectionProps {
  loading: boolean;
  onRefresh: () => void;
}

const PendingVideosSection: React.FC<PendingVideosSectionProps> = ({ loading, onRefresh }) => {
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});

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
      
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('status', 'video_enviado')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar vídeos pendentes:', error);
        throw error;
      }

      console.log('✅ Vídeos pendentes encontrados:', data?.length || 0);
      
      // Enriquecer com dados do cliente
      const enrichedVideos = await Promise.all(
        (data || []).map(async (video) => {
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('email')
              .eq('id', video.client_id)
              .single();

            return {
              ...video,
              client_email: userData?.email || 'Email não encontrado'
            };
          } catch (error) {
            console.warn(`Erro ao buscar dados do cliente ${video.client_id}:`, error);
            return {
              ...video,
              client_email: 'Email não encontrado'
            };
          }
        })
      );

      setPendingVideos(enrichedVideos);
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

  const approveVideo = async (videoId: string, clientEmail: string) => {
    try {
      console.log(`✅ Aprovando vídeo ${videoId}...`);
      
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          status: 'video_aprovado',
          log_pagamento: {
            ...pendingVideos.find(v => v.id === videoId)?.log_pagamento,
            approved_at: new Date().toISOString(),
            approved_by: 'admin'
          }
        })
        .eq('id', videoId);

      if (error) throw error;

      toast.success(`Vídeo de ${clientEmail} aprovado com sucesso!`);
      onRefresh();
      fetchPendingVideos();
    } catch (error) {
      console.error('Erro ao aprovar vídeo:', error);
      toast.error('Erro ao aprovar vídeo');
    }
  };

  const rejectVideo = async (videoId: string, clientEmail: string) => {
    const reason = rejectionReason[videoId];
    if (!reason) {
      toast.error('Por favor, selecione um motivo para rejeição');
      return;
    }

    try {
      console.log(`❌ Rejeitando vídeo ${videoId}...`);
      
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          status: 'video_rejeitado',
          log_pagamento: {
            ...pendingVideos.find(v => v.id === videoId)?.log_pagamento,
            rejected_at: new Date().toISOString(),
            rejected_by: 'admin',
            rejection_reason: reason
          }
        })
        .eq('id', videoId);

      if (error) throw error;

      toast.success(`Vídeo de ${clientEmail} rejeitado. Cliente será notificado.`);
      onRefresh();
      fetchPendingVideos();
      setRejectionReason(prev => ({ ...prev, [videoId]: '' }));
    } catch (error) {
      console.error('Erro ao rejeitar vídeo:', error);
      toast.error('Erro ao rejeitar vídeo');
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
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#9C1E1E]" />
            <span className="ml-3 text-gray-600">Carregando vídeos para aprovação...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
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
                <Card key={video.id} className="border-red-200 bg-red-50">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Informações do Cliente e Pedido */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-red-100 text-red-800">
                            Aguardando Aprovação
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Enviado em: {formatDate(video.created_at)}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="font-medium">{video.client_email}</span>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <p><strong>Valor:</strong> {formatCurrency(video.valor_total)}</p>
                            <p><strong>Painéis:</strong> {video.lista_paineis?.length || 0} selecionados</p>
                            <p><strong>Duração:</strong> {video.plano_meses} meses</p>
                          </div>
                        </div>

                        {/* Player de Vídeo Placeholder */}
                        <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
                          <div className="text-center text-white">
                            <Play className="h-12 w-12 mx-auto mb-2" />
                            <p className="text-sm">Vídeo do Cliente</p>
                            <p className="text-xs text-gray-300">15 segundos • Horizontal</p>
                          </div>
                        </div>
                      </div>

                      {/* Painel de Aprovação/Rejeição */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Análise CONAR</h3>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-medium text-yellow-800 mb-2">Verificar:</h4>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Conteúdo adequado para ambiente familiar</li>
                            <li>• Ausência de propaganda inadequada</li>
                            <li>• Linguagem apropriada</li>
                            <li>• Imagens não violentas</li>
                            <li>• Conformidade com regulamentações</li>
                          </ul>
                        </div>

                        {/* Motivos de Rejeição */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Motivo da rejeição (se aplicável):
                          </label>
                          <select
                            value={rejectionReason[video.id] || ''}
                            onChange={(e) => setRejectionReason(prev => ({
                              ...prev,
                              [video.id]: e.target.value
                            }))}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
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
                            className="text-sm"
                            onChange={(e) => setRejectionReason(prev => ({
                              ...prev,
                              [video.id]: `Outro motivo: ${e.target.value}`
                            }))}
                          />
                        )}

                        {/* Botões de Ação */}
                        <div className="flex space-x-3 pt-4">
                          <Button
                            onClick={() => approveVideo(video.id, video.client_email!)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                          </Button>
                          
                          <Button
                            onClick={() => rejectVideo(video.id, video.client_email!)}
                            variant="destructive"
                            className="flex-1"
                            disabled={!rejectionReason[video.id]}
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

export default PendingVideosSection;
