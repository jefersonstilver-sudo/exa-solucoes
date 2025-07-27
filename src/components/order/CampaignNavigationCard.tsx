import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CampaignNavigationCardProps {
  orderStatus: string;
}

export const CampaignNavigationCard: React.FC<CampaignNavigationCardProps> = ({ 
  orderStatus 
}) => {
  const navigate = useNavigate();
  
  const canCreateCampaign = orderStatus === 'video_aprovado' || orderStatus === 'ativo';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2" />
          Campanhas de Publicidade
        </CardTitle>
        <p className="text-sm text-gray-600">
          {canCreateCampaign 
            ? "Crie e gerencie suas campanhas de publicidade com vídeos aprovados."
            : "As campanhas ficam disponíveis após a aprovação dos vídeos."
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {canCreateCampaign ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => navigate('/anunciante/campanhas')}
              className="flex-1"
              variant="outline"
            >
              Ver Minhas Campanhas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              onClick={() => navigate('/anunciante/campanhas')}
              className="flex-1 bg-indexa-purple hover:bg-indexa-purple/90"
            >
              <Zap className="h-4 w-4 mr-2" />
              Criar Nova Campanha
            </Button>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Zap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 font-medium">Campanhas Bloqueadas</p>
            <p className="text-sm text-gray-500 mt-2">
              Envie e aprove seus vídeos primeiro para criar campanhas
            </p>
            <Button 
              onClick={() => navigate('/anunciante/campanhas')}
              variant="outline" 
              className="mt-4"
            >
              Ver Todas as Campanhas
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};