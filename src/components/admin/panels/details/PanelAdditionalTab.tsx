
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PanelAdditionalTabProps {
  panel: any;
}

const PanelAdditionalTab: React.FC<PanelAdditionalTabProps> = ({ panel }) => {
  return (
    <Card className="glass-card border-module-border">
      <CardHeader>
        <CardTitle className="text-module-primary">Informações Adicionais</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-module-secondary mb-2">Observações</h4>
            <div className="p-3 bg-module-accent/10 rounded-lg border border-module-border">
              <p className="text-sm text-module-primary">{panel.observacoes || 'Nenhuma observação registrada'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-module-secondary">Data de Criação</h4>
              <p className="text-sm text-module-primary">
                {new Date(panel.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-module-secondary">ID do Painel</h4>
              <p className="text-sm font-mono text-xs text-module-primary">{panel.id}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PanelAdditionalTab;
