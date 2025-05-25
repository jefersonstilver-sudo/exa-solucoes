
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PanelTechnicalTabProps {
  panel: any;
}

const PanelTechnicalTab: React.FC<PanelTechnicalTabProps> = ({ panel }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Especificações Técnicas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-gray-700">Modelo</h4>
              <p className="text-sm">{panel.modelo || 'Não informado'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-700">Tamanho</h4>
              <p className="text-sm">{panel.polegada ? `${panel.polegada}"` : 'Não informado'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-700">Orientação</h4>
              <p className="text-sm capitalize">{panel.orientacao || 'Não informado'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-gray-700">Resolução</h4>
              <p className="text-sm">{panel.resolucao || 'Não informado'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-700">Sistema Operacional</h4>
              <p className="text-sm capitalize">{panel.sistema_operacional || 'Não informado'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-700">Versão do Firmware</h4>
              <p className="text-sm">{panel.versao_firmware || 'Não informado'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PanelTechnicalTab;
