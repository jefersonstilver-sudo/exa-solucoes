import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface CampaignScheduleEditProps {
  campaignId: string;
  isAdvanced: boolean;
  onScheduleUpdate?: () => void;
}

const CampaignScheduleEdit: React.FC<CampaignScheduleEditProps> = ({
  campaignId,
  isAdvanced,
  onScheduleUpdate
}) => {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Horários de Veiculação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Os horários de veiculação são definidos globalmente nas configurações da campanha 
          (data/hora de início e fim). Todas as campanhas seguem esses horários globais.
        </p>
      </CardContent>
    </Card>
  );
};

export default CampaignScheduleEdit;