import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Play, 
  Pause, 
  Trash2, 
  Eye, 
  Clock,
  Video 
} from "lucide-react";
import { CampaignAdvanced } from "@/types/campaignScheduling";
import { useCampaignScheduling } from "@/hooks/useCampaignScheduling";

interface CampaignListProps {
  pedidoId: string;
  onCampaignSelect?: (campaignId: string) => void;
}

export const CampaignList = ({ pedidoId, onCampaignSelect }: CampaignListProps) => {
  const { campaigns, loading, updateCampaignStatus, deleteCampaign } = useCampaignScheduling(pedidoId);

  const getStatusBadge = (status: CampaignAdvanced['status']) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const },
      active: { label: 'Ativa', variant: 'default' as const },
      paused: { label: 'Pausada', variant: 'outline' as const },
      completed: { label: 'Concluída', variant: 'outline' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleStatusToggle = async (campaign: CampaignAdvanced) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    await updateCampaignStatus(campaign.id, newStatus);
  };

  const handleDelete = async (campaignId: string, campaignName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a campanha "${campaignName}"?`)) {
      await deleteCampaign(campaignId);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-5 w-5 animate-spin mr-2" />
            Carregando campanhas...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma campanha criada ainda.</p>
            <p className="text-sm mt-2">
              Crie sua primeira campanha para começar a agendar vídeos.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Campanhas Criadas ({campaigns.length})
      </h3>

      {campaigns.map((campaign) => (
        <Card key={campaign.id} className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{campaign.name}</CardTitle>
              {getStatusBadge(campaign.status)}
            </div>
            {campaign.description && (
              <p className="text-sm text-muted-foreground">
                {campaign.description}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Campaign Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Período:</strong><br />
                  {formatDate(campaign.start_date)} a {formatDate(campaign.end_date)}
                </div>
                <div>
                  <strong>Criada em:</strong><br />
                  {formatDate(campaign.created_at)}
                </div>
                <div>
                  <strong>Última atualização:</strong><br />
                  {formatDate(campaign.updated_at)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCampaignSelect?.(campaign.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>

                {campaign.status !== 'completed' && campaign.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusToggle(campaign)}
                  >
                    {campaign.status === 'active' ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Ativar
                      </>
                    )}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(campaign.id, campaign.name)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};