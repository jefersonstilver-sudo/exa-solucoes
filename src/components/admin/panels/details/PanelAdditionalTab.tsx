
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PanelAdditionalTabProps {
  panel: any;
}

const PanelAdditionalTab: React.FC<PanelAdditionalTabProps> = ({ panel }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Adicionais</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Observações</h4>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm">{panel.observacoes || 'Nenhuma observação registrada'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-gray-700">Data de Criação</h4>
              <p className="text-sm">
                {new Date(panel.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-700">ID do Painel</h4>
              <p className="text-sm font-mono text-xs">{panel.id}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PanelAdditionalTab;
