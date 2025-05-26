
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Wifi, WifiOff, Wrench } from 'lucide-react';
import PanelTooltip from './PanelTooltip';

interface AvailablePanelCardProps {
  panel: any;
  onAssign: (panelId: string, panelCode: string) => void;
  isAssigning: boolean;
}

const AvailablePanelCard: React.FC<AvailablePanelCardProps> = ({ 
  panel, 
  onAssign, 
  isAssigning 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="h-4 w-4 text-green-600" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-red-600" />;
      case 'maintenance': return <Wrench className="h-4 w-4 text-yellow-600" />;
      default: return <Monitor className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'border-l-green-500';
      case 'offline': return 'border-l-red-500';
      case 'maintenance': return 'border-l-yellow-500';
      default: return 'border-l-gray-500';
    }
  };

  const handleAssign = () => {
    onAssign(panel.id, panel.code);
  };

  return (
    <PanelTooltip panel={panel}>
      <Card className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${getStatusColor(panel.status)}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Monitor className="h-5 w-5 mr-2 text-gray-700" />
              <h4 className="font-semibold text-gray-900">{panel.code}</h4>
            </div>
            {getStatusIcon(panel.status)}
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Resolução:</span>
              <span className="font-medium">{panel.resolucao || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Polegadas:</span>
              <span className="font-medium">{panel.polegada || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sistema:</span>
              <span className="font-medium">{panel.sistema_operacional || 'N/A'}</span>
            </div>
          </div>
          
          <Button 
            onClick={handleAssign}
            disabled={isAssigning}
            className="w-full bg-indexa-purple hover:bg-indexa-purple-dark"
            size="sm"
          >
            {isAssigning ? 'Atribuindo...' : 'Atribuir'}
          </Button>
        </CardContent>
      </Card>
    </PanelTooltip>
  );
};

export default AvailablePanelCard;
