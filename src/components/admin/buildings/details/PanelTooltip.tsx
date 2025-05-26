
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Cpu, Wifi, Settings } from 'lucide-react';

interface PanelTooltipProps {
  panel: any;
  children: React.ReactNode;
}

const PanelTooltip: React.FC<PanelTooltipProps> = ({ panel, children }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'maintenance': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'maintenance': return 'Manutenção';
      default: return 'Desconhecido';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="right" className="w-80 p-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Monitor className="h-5 w-5 mr-2" />
                {panel.code}
                <span className={`ml-auto text-sm ${getStatusColor(panel.status)}`}>
                  {getStatusLabel(panel.status)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Polegadas</p>
                  <p>{panel.polegada || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Orientação</p>
                  <p>{panel.orientacao || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Resolução</p>
                  <p>{panel.resolucao || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Sistema</p>
                  <p>{panel.sistema_operacional || 'N/A'}</p>
                </div>
              </div>
              
              {(panel.modelo || panel.versao_firmware) && (
                <div className="border-t pt-3">
                  <div className="flex items-center mb-2">
                    <Cpu className="h-4 w-4 mr-2" />
                    <span className="font-medium text-gray-700">Hardware</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-sm">
                    {panel.modelo && <p>Modelo: {panel.modelo}</p>}
                    {panel.versao_firmware && <p>Firmware: {panel.versao_firmware}</p>}
                  </div>
                </div>
              )}
              
              {(panel.ip_interno || panel.mac_address) && (
                <div className="border-t pt-3">
                  <div className="flex items-center mb-2">
                    <Wifi className="h-4 w-4 mr-2" />
                    <span className="font-medium text-gray-700">Rede</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-sm">
                    {panel.ip_interno && <p>IP: {panel.ip_interno}</p>}
                    {panel.mac_address && <p>MAC: {panel.mac_address}</p>}
                  </div>
                </div>
              )}
              
              {(panel.codigo_anydesk || panel.localizacao) && (
                <div className="border-t pt-3">
                  <div className="flex items-center mb-2">
                    <Settings className="h-4 w-4 mr-2" />
                    <span className="font-medium text-gray-700">Outros</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-sm">
                    {panel.codigo_anydesk && <p>AnyDesk: {panel.codigo_anydesk}</p>}
                    {panel.localizacao && <p>Local: {panel.localizacao}</p>}
                  </div>
                </div>
              )}
              
              {panel.observacoes && (
                <div className="border-t pt-3">
                  <p className="font-medium text-gray-700 mb-1">Observações</p>
                  <p className="text-sm text-gray-600">{panel.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PanelTooltip;
