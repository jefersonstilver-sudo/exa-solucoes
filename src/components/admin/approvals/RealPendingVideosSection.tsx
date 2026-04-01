import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, User, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VideoPlayer } from '@/components/video-management/VideoPlayer';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';

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

// Overlay de feedback animado
const ActionFeedbackOverlay: React.FC<{ result: 'approved' | 'rejected'; onDone: () => void }> = ({ result, onDone }) => {
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    const exitTimer = setTimeout(() => setPhase('exit'), 1200);
    const doneTimer = setTimeout(onDone, 1700);
    return () => { clearTimeout(exitTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  const isApproved = result === 'approved';

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center rounded-xl transition-all duration-500 ${
        phase === 'enter' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      } ${isApproved ? 'bg-emerald-500/90' : 'bg-red-500/90'}`}
    >
      {isApproved ? (
        <CheckCircle className="h-16 w-16 text-white mb-3 animate-scale-in" />
      ) : (
        <XCircle className="h-16 w-16 text-white mb-3 animate-scale-in" />
      )}
      <span className="text-white text-xl font-bold animate-fade-in">
        {isApproved ? 'Aprovado!' : 'Rejeitado'}
      </span>
    </div>
  );
};

const RealPendingVideosSection: React.FC<RealPendingVideosSectionProps> = ({ loading, onRefresh }) => {
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ [key: string]: 'approved' | 'rejected' }>({});
  const { isMobile } = useAdvancedResponsive();

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
      
      console.log('🔍 [PENDING VIDEOS] Buscando vídeos pendentes...');
      
      const { data: pendingData, error: pendingError } = await supabase
        .from('pedido_videos')
        .select(`
          id,
          pedido_id,
          video_id,
          slot_position,
          created_at,
          pedidos (
            id,
            valor_total,
            client_id
          ),
          videos (
            id,
            nome,
            url,
            duracao,
            orientacao
          )
        `)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });
      
      console.log('📊 [PENDING VIDEOS] Resultado:', pendingData?.length || 0, 'vídeos encontrados');
      
      if (pendingError) throw pendingError;

      if (!pendingData || pendingData.length === 0) {
        setPendingVideos([]);
        return;
      }

      const clientIds = [...new Set(pendingData.map(pv => pv.pedidos.client_id))];
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', clientIds);

      if (usersError) {
        console.warn('Erro ao buscar usuários:', usersError);
      }

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

  const handleAnimationDone = useCallback((videoId: string) => {
    setActionResult(prev => {
      const next = { ...prev };
      delete next[videoId];
      return next;
    });
    fetchPendingVideos();
    onRefresh();
  }, [onRefresh]);

  const approveVideo = async (videoId: string, clientName: string) => {
    try {
      setActionLoading(true);
      
      console.log('✅ [APPROVE] Aprovando vídeo:', videoId);
      
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.rpc('approve_video' as any, {
        p_pedido_video_id: videoId,
        p_approved_by: userData.user?.id
      });

      if (error) {
        console.error('💥 [APPROVE] Erro na RPC:', error);
        throw error;
      }
      
      console.log('✅ [APPROVE] RPC retornou:', data);
      
      if (data !== true) {
        console.error('💥 [APPROVE] Aprovação falhou - RPC retornou false');
        throw new Error('Vídeo não pôde ser aprovado. Pode já estar aprovado ou não encontrado.');
      }
      
      console.log('✅ [APPROVE] Vídeo aprovado com sucesso no banco!');

      const { data: videoData } = await supabase
        .from('pedido_videos')
        .select('video_id, pedido_id, videos(nome)')
        .eq('id', videoId)
        .single();

      if (videoData?.pedido_id) {
        try {
          console.log('🔍 [APPROVE] Verificando se é o primeiro vídeo aprovado...');
          const { data: approvedVideos } = await supabase
            .from('pedido_videos')
            .select('id')
            .eq('pedido_id', videoData.pedido_id)
            .eq('approval_status', 'approved');

          const isFirstVideo = approvedVideos && approvedVideos.length === 1;
          console.log(`📊 [APPROVE] Total de vídeos aprovados: ${approvedVideos?.length || 0}, É primeiro? ${isFirstVideo}`);

          if (isFirstVideo) {
            console.log('🎯 [APPROVE] É o primeiro vídeo! Ativando automaticamente via API externa...');
            
            const { data: activationData, error: activationError } = await supabase.functions.invoke(
              'auto-activate-first-video',
              { body: { pedido_video_id: videoId } }
            );

            if (activationError) {
              console.error('❌ [APPROVE] Erro ao ativar primeiro vídeo:', activationError);
              toast.warning('Vídeo aprovado, mas houve erro na ativação automática.');
            } else if (activationData?.success) {
              console.log('✅ [APPROVE] Primeiro vídeo ativado automaticamente:', activationData);
              toast.success('🎉 Primeiro vídeo aprovado e ativado automaticamente!');
            } else if (activationData?.skipped) {
              console.log('⚠️ [APPROVE] Ativação não necessária:', activationData.message);
            } else {
              console.warn('⚠️ [APPROVE] Ativação parcial:', activationData);
              toast.warning('Vídeo aprovado, mas ativação parcial.');
            }
          }
        } catch (activationErr: any) {
          console.error('💥 [APPROVE] Exceção ao tentar ativar primeiro vídeo:', activationErr);
          toast.warning('Vídeo aprovado, mas houve problema na ativação automática.');
        }
      }

      if (videoData?.pedido_id) {
        try {
          console.log('📧 [APPROVE] Enviando email de aprovação...');
          const { error: emailError } = await supabase.functions.invoke('video-notification-service', {
            body: {
              action: 'video_approved',
              pedido_id: videoData.pedido_id,
              video_title: (videoData.videos as any)?.nome || 'Seu Vídeo'
            }
          });

          if (emailError) {
            console.warn('⚠️ [APPROVE] Erro ao enviar email:', emailError);
          } else {
            console.log('✅ [APPROVE] Email de aprovação enviado!');
          }
        } catch (emailErr) {
          console.warn('⚠️ [APPROVE] Falha ao enviar email:', emailErr);
        }
      }

      try {
        console.log('📤 [APPROVE] Enviando vídeo para API externa...');
        const { data: externalApiData, error: externalApiError } = await supabase.functions.invoke(
          'upload-video-to-external-api',
          {
            body: { pedido_video_id: videoId }
          }
        );

        if (externalApiError || !externalApiData?.success) {
          const errorMsg = externalApiData?.error || externalApiError?.message || 'Erro desconhecido';
          console.error('❌ [APPROVE] Falha na API externa:', errorMsg);
          
          console.log('🔄 [APPROVE] Revertendo aprovação devido a falha na API externa...');
          const { error: rejectError } = await supabase.rpc('reject_video', {
            p_pedido_video_id: videoId,
            p_approved_by: userData.user?.id,
            p_rejection_reason: `Erro técnico: Falha ao sincronizar com sistema externo - ${errorMsg}`
          });

          if (rejectError) {
            console.error('💥 [APPROVE] Erro ao reverter aprovação:', rejectError);
            toast.error('Erro crítico: Falha na aprovação e na reversão.');
          } else {
            console.log('✅ [APPROVE] Aprovação revertida com sucesso');
            toast.error(`Erro ao aprovar: ${errorMsg}. Aprovação foi revertida.`);
          }
          
          onRefresh();
          fetchPendingVideos();
          return;
        }

        console.log('✅ [APPROVE] Vídeo enviado para API externa com sucesso:', externalApiData);
        
      } catch (externalError: any) {
        console.error('💥 [APPROVE] Erro ao processar API externa:', externalError);
        
        console.log('🔄 [APPROVE] Revertendo aprovação devido a exceção...');
        const { error: rejectError } = await supabase.rpc('reject_video', {
          p_pedido_video_id: videoId,
          p_approved_by: userData.user?.id,
          p_rejection_reason: `Erro técnico: Exceção ao sincronizar - ${externalError.message}`
        });

        if (rejectError) {
          console.error('💥 [APPROVE] Erro ao reverter aprovação:', rejectError);
        }
        
        toast.error(`Erro crítico: ${externalError.message}`);
        onRefresh();
        fetchPendingVideos();
        return;
      }

      // Mostrar animação de sucesso
      setActionResult(prev => ({ ...prev, [videoId]: 'approved' }));
      toast.success(`✅ Vídeo de ${clientName} aprovado e sincronizado!`);

    } catch (error: any) {
      console.error('💥 [APPROVE] Erro ao aprovar vídeo:', error);
      toast.error(`Erro ao aprovar vídeo: ${error.message || 'Erro desconhecido'}`);
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

      const { data: videoData } = await supabase
        .from('pedido_videos')
        .select('video_id, pedido_id, videos(nome)')
        .eq('id', videoId)
        .single();

      if (videoData?.pedido_id) {
        try {
          console.log('📧 [REJECT] Enviando email de rejeição...');
          const { error: emailError } = await supabase.functions.invoke('video-notification-service', {
            body: {
              action: 'video_rejected',
              pedido_id: videoData.pedido_id,
              video_title: (videoData.videos as any)?.nome || 'Seu Vídeo',
              rejection_reason: reason
            }
          });

          if (emailError) {
            console.warn('⚠️ [REJECT] Erro ao enviar email:', emailError);
          } else {
            console.log('✅ [REJECT] Email de rejeição enviado!');
          }
        } catch (emailErr) {
          console.warn('⚠️ [REJECT] Falha ao enviar email:', emailErr);
        }
      }

      // Mostrar animação de rejeição
      setActionResult(prev => ({ ...prev, [videoId]: 'rejected' }));
      toast.success(`Vídeo de ${clientName} rejeitado. Cliente será notificado.`);
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
      <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-3 text-foreground text-sm">Carregando vídeos para aprovação...</span>
        </div>
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {pendingVideos.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-6 text-center shadow-sm">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="text-sm font-medium text-foreground mb-1">
              Nenhum vídeo para aprovação
            </h3>
            <p className="text-xs text-muted-foreground">
              Todos os vídeos foram processados
            </p>
          </div>
        ) : (
          pendingVideos.map((video) => (
            <div 
              key={video.id} 
              className={`relative bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-3 shadow-sm space-y-3 transition-all duration-500 overflow-hidden ${
                actionResult[video.id] ? 'pointer-events-none' : ''
              }`}
            >
              {/* Overlay de feedback */}
              {actionResult[video.id] && (
                <ActionFeedbackOverlay
                  result={actionResult[video.id]}
                  onDone={() => handleAnimationDone(video.id)}
                />
              )}

              {/* Header */}
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 font-medium">
                  Aguardando
                </Badge>
                <span className="text-[10px] text-muted-foreground">{formatDate(video.created_at)}</span>
              </div>

              {/* Client Info */}
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-medium truncate">{video.client_name}</span>
              </div>

              {/* Video Preview */}
              <div className="aspect-video rounded-lg overflow-hidden bg-black/5">
                <VideoPlayer
                  src={video.video_url}
                  title={video.video_nome}
                  className="w-full h-full"
                  muted={true}
                  controls={true}
                  onDownload={() => handleDownload(video.video_url, video.video_nome)}
                />
              </div>

              {/* Video Info */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-600 font-semibold">{formatCurrency(video.pedido_valor)}</span>
                <span className="text-muted-foreground">{video.video_duracao}s • {video.video_orientacao}</span>
              </div>

              {/* CONAR Checklist - Compact */}
              <div className="bg-muted/30 rounded-lg p-2">
                <p className="text-[10px] font-medium text-foreground mb-1">Verificar CONAR:</p>
                <p className="text-[9px] text-muted-foreground leading-relaxed">
                  Conteúdo familiar • Linguagem apropriada • Sem violência
                </p>
              </div>

              {/* Rejection Reason Selector */}
              <select
                value={rejectionReason[video.id] || ''}
                onChange={(e) => setRejectionReason(prev => ({
                  ...prev,
                  [video.id]: e.target.value
                }))}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white text-foreground"
              >
                <option value="">Motivo rejeição (se aplicável)...</option>
                {conarViolations.map((violation) => (
                  <option key={violation} value={violation}>
                    {violation}
                  </option>
                ))}
              </select>

              {rejectionReason[video.id] === 'Outro motivo (especificar)' && (
                <Textarea
                  placeholder="Especifique o motivo..."
                  className="text-xs h-16"
                  onChange={(e) => setRejectionReason(prev => ({
                    ...prev,
                    [video.id]: `Outro motivo: ${e.target.value}`
                  }))}
                />
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => approveVideo(video.id, video.client_name)}
                  disabled={actionLoading}
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-9"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Aprovar
                </Button>
                <Button
                  onClick={() => rejectVideo(video.id, video.client_name)}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-9"
                  disabled={!rejectionReason[video.id] || actionLoading}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Rejeitar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-6">
      <Card className="bg-card border">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center text-foreground">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
            Vídeos Aguardando Aprovação
          </CardTitle>
          <CardDescription>
            Analise os vídeos conforme diretrizes CONAR - Conteúdo familiar adequado
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {pendingVideos.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum vídeo para aprovação
              </h3>
              <p className="text-muted-foreground">
                Todos os vídeos enviados foram processados
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {pendingVideos.map((video) => (
                <Card 
                  key={video.id} 
                  className={`relative bg-card border hover:shadow-md transition-all duration-500 overflow-hidden ${
                    actionResult[video.id] ? 'pointer-events-none' : ''
                  }`}
                >
                  {/* Overlay de feedback */}
                  {actionResult[video.id] && (
                    <ActionFeedbackOverlay
                      result={actionResult[video.id]}
                      onDone={() => handleAnimationDone(video.id)}
                    />
                  )}

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Informações do Cliente e Pedido */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-amber-100 text-amber-800">
                            Aguardando Aprovação
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Enviado em: {formatDate(video.created_at)}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            <div>
                              <span className="font-medium text-foreground">{video.client_name}</span>
                              <div className="text-sm text-muted-foreground">{video.client_email}</div>
                            </div>
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
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
                        <h3 className="font-semibold text-foreground">Análise CONAR</h3>
                        
                        <div className="bg-muted/30 border rounded-lg p-4">
                          <h4 className="font-medium text-foreground mb-2">Verificar:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Conteúdo adequado para ambiente familiar</li>
                            <li>• Ausência de propaganda inadequada</li>
                            <li>• Linguagem apropriada</li>
                            <li>• Imagens não violentas</li>
                            <li>• Conformidade com regulamentações</li>
                          </ul>
                        </div>

                        {/* Motivos de Rejeição */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            Motivo da rejeição (se aplicável):
                          </label>
                          <select
                            value={rejectionReason[video.id] || ''}
                            onChange={(e) => setRejectionReason(prev => ({
                              ...prev,
                              [video.id]: e.target.value
                            }))}
                            className="w-full p-2 border rounded-md text-sm bg-background text-foreground"
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
                            onClick={() => approveVideo(video.id, video.client_name)}
                            disabled={actionLoading}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                          </Button>
                          
                          <Button
                            onClick={() => rejectVideo(video.id, video.client_name)}
                            variant="outline"
                            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
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
