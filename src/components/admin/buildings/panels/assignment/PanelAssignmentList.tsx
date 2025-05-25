
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Panel {
  id: string;
  code: string;
  status: string;
  resolucao?: string;
  polegada?: string;
  orientacao?: string;
  sistema_operacional?: string;
  localizacao?: string;
}

interface PanelAssignmentListProps {
  panels: Panel[];
  selectedPanels: string[];
  onSelectPanel: (panelId: string) => void;
  onSelectAll: () => void;
  loading: boolean;
  disabled: boolean;
}

const PanelAssignmentList: React.FC<PanelAssignmentListProps> = ({
  panels,
  selectedPanels,
  onSelectPanel,
  onSelectAll,
  loading,
  disabled
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const isAllSelected = panels.length > 0 && selectedPanels.length === panels.length;
  const isSomeSelected = selectedPanels.length > 0 && selectedPanels.length < panels.length;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mr-3" />
        <span className="text-blue-500 font-medium">Carregando painéis disponíveis...</span>
      </div>
    );
  }

  if (panels.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
        <Monitor className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum painel disponível
        </h3>
        <p className="text-gray-500 max-w-md">
          Todos os painéis estão atualmente atribuídos a outros prédios ou não há painéis cadastrados no sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 border rounded-lg overflow-hidden">
      <div className="bg-gray-50 p-3 border-b flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Checkbox
            checked={isAllSelected}
            ref={(el) => {
              if (el) el.indeterminate = isSomeSelected;
            }}
            onCheckedChange={onSelectAll}
            disabled={disabled}
          />
          <span className="text-sm font-medium">
            {isAllSelected ? 'Desmarcar todos' : 'Selecionar todos'}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {panels.length} painéis disponíveis
        </span>
      </div>

      <ScrollArea className="h-96">
        <div className="divide-y">
          {panels.map((panel) => (
            <div
              key={panel.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                selectedPanels.includes(panel.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedPanels.includes(panel.id)}
                  onCheckedChange={() => onSelectPanel(panel.id)}
                  disabled={disabled}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <Monitor className="h-5 w-5 text-gray-500" />
                    <span className="font-medium text-gray-900">{panel.code}</span>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(panel.status)}`}></div>
                      <Badge variant="outline" className="text-xs">
                        {panel.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    {panel.resolucao && (
                      <div>
                        <span className="font-medium">Resolução:</span> {panel.resolucao}
                      </div>
                    )}
                    {panel.polegada && (
                      <div>
                        <span className="font-medium">Tamanho:</span> {panel.polegada}"
                      </div>
                    )}
                    {panel.orientacao && (
                      <div>
                        <span className="font-medium">Orientação:</span> {panel.orientacao}
                      </div>
                    )}
                    {panel.sistema_operacional && (
                      <div>
                        <span className="font-medium">SO:</span> {panel.sistema_operacional}
                      </div>
                    )}
                  </div>
                  
                  {panel.localizacao && (
                    <div className="mt-2 text-sm text-gray-500">
                      <span className="font-medium">Localização:</span> {panel.localizacao}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PanelAssignmentList;
