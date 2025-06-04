
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monitor, Wifi, WifiOff, Wrench, Eye, X } from 'lucide-react';

interface AssignedPanelCardProps {
  panel: any;
  onViewDetails: (panel: any) => void;
  onUnassign: (panel: any) => void;
  isUnassigning: boolean;
}

const AssignedPanelCard: React.FC<AssignedPanelCardProps> = ({
  panel,
  onViewDetails,
  onUnassign,
  isUnassigning
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'online':
        return {
          label: 'Online',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: Wifi
        };
      case 'offline':
        return {
          label: 'Offline',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: WifiOff
        };
      case 'maintenance':
        return {
          label: 'Manutenção',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Wrench
        };
      default:
        return {
          label: status || 'Desconhecido',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Monitor
        };
    }
  };

  const statusConfig = getStatusConfig(panel.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-indexa-purple" />
              <span className="font-semibold text-gray-900">{panel.code}</span>
            </div>
            <Badge className={`${statusConfig.color} border flex items-center space-x-1`}>
              <StatusIcon className="h-3 w-3" />
              <span>{statusConfig.label}</span>
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            {panel.resolucao && (
              <div className="flex justify-between">
                <span className="text-gray-500">Resolução:</span>
                <span className="font-medium">{panel.resolucao}</span>
              </div>
            )}
            {panel.polegada && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tamanho:</span>
                <span className="font-medium">{panel.polegada}"</span>
              </div>
            )}
            {panel.localizacao && (
              <div className="flex justify-between">
                <span className="text-gray-500">Localização:</span>
                <span className="font-medium">{panel.localizacao}</span>
              </div>
            )}
            {panel.sistema_operacional && (
              <div className="flex justify-between">
                <span className="text-gray-500">Sistema:</span>
                <span className="font-medium capitalize">{panel.sistema_operacional}</span>
              </div>
            )}
            {panel.ip_interno && (
              <div className="flex justify-between">
                <span className="text-gray-500">IP:</span>
                <span className="font-medium font-mono text-xs">{panel.ip_interno}</span>
              </div>
            )}
            {panel.ultima_sync && (
              <div className="flex justify-between">
                <span className="text-gray-500">Última Sync:</span>
                <span className="font-medium text-xs">
                  {new Date(panel.ultima_sync).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </div>

          {panel.observacoes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-600">
                <strong>Obs:</strong> {panel.observacoes}
              </p>
            </div>
          )}

          <div className="pt-2 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onViewDetails(panel)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onUnassign(panel)}
              disabled={isUnassigning}
            >
              <X className="h-4 w-4 mr-2" />
              {isUnassigning ? 'Desatribuindo...' : 'Desatribuir'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignedPanelCard;
