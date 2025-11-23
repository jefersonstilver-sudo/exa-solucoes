
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PanelTechnicalTabProps {
  panel: any;
}

const PanelTechnicalTab: React.FC<PanelTechnicalTabProps> = ({ panel }) => {
  // Verificar se há dados técnicos preenchidos
  const hasData = panel.modelo || panel.polegada || panel.orientacao || 
                  panel.resolucao || panel.sistema_operacional || panel.versao_firmware;

  return (
    <Card className="glass-card border-module-border">
      <CardHeader>
        <CardTitle className="text-module-primary">Especificações Técnicas</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-8 text-module-secondary">
            <p>Nenhuma especificação técnica registrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {panel.modelo && (
                <div>
                  <h4 className="font-medium text-sm text-module-secondary">Modelo</h4>
                  <p className="text-sm text-module-primary">{panel.modelo}</p>
                </div>
              )}
              {panel.polegada && (
                <div>
                  <h4 className="font-medium text-sm text-module-secondary">Tamanho</h4>
                  <p className="text-sm text-module-primary">{panel.polegada}"</p>
                </div>
              )}
              {panel.orientacao && (
                <div>
                  <h4 className="font-medium text-sm text-module-secondary">Orientação</h4>
                  <p className="text-sm capitalize text-module-primary">{panel.orientacao}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {panel.resolucao && (
                <div>
                  <h4 className="font-medium text-sm text-module-secondary">Resolução</h4>
                  <p className="text-sm text-module-primary">{panel.resolucao}</p>
                </div>
              )}
              {panel.sistema_operacional && (
                <div>
                  <h4 className="font-medium text-sm text-module-secondary">Sistema Operacional</h4>
                  <p className="text-sm capitalize text-module-primary">{panel.sistema_operacional}</p>
                </div>
              )}
              {panel.versao_firmware && (
                <div>
                  <h4 className="font-medium text-sm text-module-secondary">Versão do Firmware</h4>
                  <p className="text-sm text-module-primary">{panel.versao_firmware}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PanelTechnicalTab;
