
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusConfig } from './PanelStatusConfig';

interface PanelCardHeaderProps {
  panelCode: string;
  statusConfig: StatusConfig;
}

const PanelCardHeader: React.FC<PanelCardHeaderProps> = ({
  panelCode,
  statusConfig
}) => {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg font-bold flex items-center space-x-2">
          {statusConfig.icon}
          <span>{panelCode}</span>
        </CardTitle>
        <Badge className={`${statusConfig.badge} shadow-md`}>
          {statusConfig.label}
        </Badge>
      </div>
    </CardHeader>
  );
};

export default PanelCardHeader;
