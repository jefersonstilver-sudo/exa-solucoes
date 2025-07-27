import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Eye, 
  Clock,
  Zap,
  Monitor,
  Video
} from 'lucide-react';
import { UnifiedCampaign } from '@/hooks/useUnifiedCampaigns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VideoPreview } from './VideoPreview';

interface UnifiedCampaignListProps {
  campaigns: UnifiedCampaign[];
  loading: boolean;
  onRefetch: () => void;
}

export const UnifiedCampaignList = ({ campaigns, loading, onRefetch }: UnifiedCampaignListProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string, type: 'advanced' | 'legacy') => {
    const statusMap: Record<string, { label: string; className: string }> = {
      // Status das campanhas avançadas
      draft: { label: 'Rascunho', className: 'bg-orange-100 text-orange-800 border border-orange-200' },
      active: { label: 'Ativa', className: 'bg-green-100 text-green-800 border border-green-200' },
      paused: { label: 'Pausada', className: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
      completed: { label: 'Concluída', className: 'bg-blue-100 text-blue-800 border border-blue-200' },
      cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-800 border border-red-200' },
      // Status das campanhas legadas
      ativo: { label: 'Ativa', className: 'bg-green-100 text-green-800 border border-green-200' },
      pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
      finalizado: { label: 'Finalizada', className: 'bg-blue-100 text-blue-800 border border-blue-200' },
      cancelado: { label: 'Cancelada', className: 'bg-red-100 text-red-800 border border-red-200' },
    };

    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800 border border-gray-200' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: 'advanced' | 'legacy') => {
    return type === 'advanced' ? (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
        <Zap className="h-3 w-3 mr-1" />
        Avançada
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Monitor className="h-3 w-3 mr-1" />
        Clássica
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleEdit = (campaign: UnifiedCampaign) => {
    if (campaign.type === 'advanced' && campaign.pedido_id) {
      navigate(`/anunciante/pedido/${campaign.pedido_id}`);
    } else if (campaign.type === 'legacy') {
      navigate(`/anunciante/campanhas/${campaign.id}`);
    }
  };

  const handleView = (campaign: UnifiedCampaign) => {
    if (campaign.type === 'advanced' && campaign.pedido_id) {
      navigate(`/anunciante/pedido/${campaign.pedido_id}`);
    } else if (campaign.type === 'legacy') {
      // Para campanhas legadas, pode mostrar detalhes ou editar
      navigate(`/anunciante/campanhas/${campaign.id}`);
    }
  };

  const handleToggleStatus = async (campaign: UnifiedCampaign) => {
    if (campaign.type === 'legacy') {
      toast.error('Funcionalidade não disponível para campanhas clássicas');
      return;
    }

    try {
      const newStatus = campaign.status === 'active' ? 'paused' : 'active';
      const { error } = await supabase
        .from('campaigns_advanced')
        .update({ status: newStatus })
        .eq('id', campaign.id);

      if (error) throw error;

      toast.success(`Campanha ${newStatus === 'active' ? 'ativada' : 'pausada'} com sucesso`);
      onRefetch();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status da campanha');
    }
  };

  const handleDelete = async (campaign: UnifiedCampaign) => {
    if (!confirm(`Tem certeza que deseja excluir a campanha "${campaign.name}"?`)) return;

    try {
      const table = campaign.type === 'advanced' ? 'campaigns_advanced' : 'campanhas';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', campaign.id);

      if (error) throw error;

      toast.success('Campanha excluída com sucesso');
      onRefetch();
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      toast.error('Erro ao excluir campanha');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Clock className="h-12 w-12 animate-spin text-indexa-purple" />
        <p className="ml-2 text-lg">Carregando campanhas...</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
            <Video className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">Nenhuma campanha encontrada</h3>
          <p className="text-gray-500 mb-6">
            Você ainda não criou nenhuma campanha. Comece criando sua primeira campanha para seus painéis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Todas as Campanhas ({campaigns.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <Card key={`${campaign.type}-${campaign.id}`} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg line-clamp-2">
                  {campaign.name}
                </CardTitle>
                <div className="flex flex-col gap-1">
                  {getStatusBadge(campaign.status, campaign.type)}
                  {getTypeBadge(campaign.type)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
              </div>
              
              {campaign.type === 'legacy' && campaign.painel_id && (
                <div className="flex items-center text-sm text-gray-600">
                  <Monitor className="h-4 w-4 mr-2" />
                  Painel: {campaign.painel_id.substring(0, 8)}...
                </div>
              )}

              {campaign.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
              )}

              {/* Video Preview Section */}
              {campaign.type === 'advanced' && campaign.videos && campaign.videos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {campaign.videos.length === 1 ? 'Vídeo' : `${campaign.videos.length} Vídeos`}
                    </span>
                  </div>
                  <VideoPreview 
                    video={campaign.videos[0]} 
                    className="w-full"
                    showDetails={true}
                  />
                  {campaign.videos.length > 1 && (
                    <p className="text-xs text-gray-500">
                      +{campaign.videos.length - 1} vídeo{campaign.videos.length - 1 > 1 ? 's' : ''} adicional{campaign.videos.length - 1 > 1 ? 'is' : ''}
                    </p>
                  )}
                </div>
              )}

              {campaign.type === 'legacy' && campaign.video && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Vídeo</span>
                  </div>
                  <VideoPreview 
                    video={campaign.video} 
                    className="w-full"
                    showDetails={true}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleView(campaign)}
                  className="flex-1 min-w-[80px]"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                
                {campaign.type === 'advanced' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleToggleStatus(campaign)}
                    className="flex-1 min-w-[80px]"
                  >
                    {campaign.status === 'active' ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pausar
                      </>
                    ) : campaign.status === 'draft' ? (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Ativar
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Ativar
                      </>
                    )}
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDelete(campaign)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};