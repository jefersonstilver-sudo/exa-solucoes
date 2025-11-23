
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, MapPin, Calendar, Monitor, Wifi, WifiOff, Settings } from 'lucide-react';

interface PanelStatusCardProps {
  panel: any;
  statusInfo: {
    variant: any;
    label: string;
    icon: any;
    color: string;
  };
}

const PanelStatusCard: React.FC<PanelStatusCardProps> = ({ panel, statusInfo }) => {
  const StatusIcon = statusInfo.icon === 'Wifi' ? Wifi : statusInfo.icon === 'WifiOff' ? WifiOff : Settings;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Status Atual</span>
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Prédio</p>
              <p className="text-xs text-gray-500">{panel.buildings?.nome || 'N/A'}</p>
            </div>
          </div>
          {panel.localizacao && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Localização</p>
                <p className="text-xs text-gray-500">{panel.localizacao}</p>
              </div>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Última Sync</p>
              <p className="text-xs text-gray-500">
                {panel.ultima_sync 
                  ? new Date(panel.ultima_sync).toLocaleString('pt-BR')
                  : 'Nunca'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Monitor className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Código</p>
              <p className="text-xs text-gray-500">{panel.code}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PanelStatusCard;
