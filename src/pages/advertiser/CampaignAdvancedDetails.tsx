import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar, Clock, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCampaignWithSchedule } from '@/hooks/useCampaignWithSchedule';
import { CampaignScheduleDetails } from '@/components/campaign/CampaignScheduleDetails';
import { Loader2 } from 'lucide-react';

const CampaignAdvancedDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { campaigns, loading } = useCampaignWithSchedule();

  const campaign = campaigns.find(c => c.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando detalhes da campanha...</span>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Campanha não encontrada</h1>
          <Button onClick={() => navigate('/anunciante/campanhas')}>
            Voltar para Campanhas
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'draft': { label: 'Rascunho', variant: 'secondary' as const },
      'active': { label: 'Ativa', variant: 'default' as const },
      'paused': { label: 'Pausada', variant: 'outline' as const },
      'completed': { label: 'Concluída', variant: 'secondary' as const },
      'cancelled': { label: 'Cancelada', variant: 'destructive' as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/anunciante/campanhas')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <p className="text-muted-foreground">
              Criada em {new Date(campaign.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge(campaign.status)}
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Campaign Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informações da Campanha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Período</label>
              <p className="text-sm">
                {new Date(campaign.start_date).toLocaleDateString()} até{' '}
                {new Date(campaign.end_date).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                {getStatusBadge(campaign.status)}
              </div>
            </div>
          </div>
          
          {campaign.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Descrição</label>
              <p className="text-sm mt-1">{campaign.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Detalhes do Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignScheduleDetails campaign={campaign} isExpanded={true} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignAdvancedDetails;