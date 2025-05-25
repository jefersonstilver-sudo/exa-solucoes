
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Monitor, 
  Check,
  AlertCircle
} from 'lucide-react';

interface Panel {
  id: string;
  code: string;
  status: string;
  resolucao?: string;
}

interface PanelAssignmentListProps {
  panels: Panel[];
  selectedPanels: string[];
  loading: boolean;
  onPanelToggle: (panelId: string) => void;
}

const PanelAssignmentList: React.FC<PanelAssignmentListProps> = ({
  panels,
  selectedPanels,
  loading,
  onPanelToggle
}) => {
  const getStatusBadge = (status: string) => {
    const configs = {
      online: 'bg-green-500 text-white',
      offline: 'bg-red-500 text-white',
      maintenance: 'bg-yellow-500 text-white'
    };
    return configs[status as keyof typeof configs] || 'bg-gray-500 text-white';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Monitor className="h-8 w-8 animate-pulse text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Carregando painéis disponíveis...</p>
        </div>
      </div>
    );
  }

  if (panels.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center space-y-3">
          <AlertCircle className="h-12 w-12 text-orange-400" />
          <div className="space-y-2">
            <p className="font-medium text-gray-900">Nenhum painel disponível</p>
            <p className="text-sm text-gray-500">
              Todos os painéis já estão atribuídos a prédios ou não há painéis cadastrados no sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {panels.map((panel) => (
        <Card 
          key={panel.id}
          className={`
            cursor-pointer transition-all duration-200
            ${selectedPanels.includes(panel.id) 
              ? 'ring-2 ring-indexa-purple bg-purple-50' 
              : 'hover:shadow-md'
            }
          `}
          onClick={() => onPanelToggle(panel.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4 text-gray-600" />
                <span className="font-medium">{panel.code}</span>
              </div>
              {selectedPanels.includes(panel.id) && (
                <Check className="h-5 w-5 text-indexa-purple" />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <Badge className={getStatusBadge(panel.status)}>
                {panel.status}
              </Badge>
              <div className="text-sm text-gray-500">
                {panel.resolucao || 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PanelAssignmentList;
