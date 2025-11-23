
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
    <Card>
      <CardHeader>
        <CardTitle>Especificações Técnicas</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma especificação técnica registrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {panel.modelo && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Modelo</h4>
                  <p className="text-sm">{panel.modelo}</p>
                </div>
              )}
              {panel.polegada && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Tamanho</h4>
                  <p className="text-sm">{panel.polegada}"</p>
                </div>
              )}
              {panel.orientacao && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Orientação</h4>
                  <p className="text-sm capitalize">{panel.orientacao}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {panel.resolucao && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Resolução</h4>
                  <p className="text-sm">{panel.resolucao}</p>
                </div>
              )}
              {panel.sistema_operacional && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Sistema Operacional</h4>
                  <p className="text-sm capitalize">{panel.sistema_operacional}</p>
                </div>
              )}
              {panel.versao_firmware && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Versão do Firmware</h4>
                  <p className="text-sm">{panel.versao_firmware}</p>
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
