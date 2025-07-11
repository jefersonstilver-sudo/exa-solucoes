
import React from 'react';
import { Building, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PanelData {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
}

interface RealOrderPanelsCardProps {
  panels: PanelData[];
  order: {
    data_inicio?: string;
    data_fim?: string;
    plano_meses: number;
  };
}

export const RealOrderPanelsCard: React.FC<RealOrderPanelsCardProps> = ({ panels, order }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-gray-900 flex items-center">
          <Building className="h-5 w-5 mr-2 text-indexa-purple" />
          Locais Contratados
        </CardTitle>
        <CardDescription className="text-gray-600">
          {panels.length} {panels.length === 1 ? 'local contratado' : 'locais contratados'} para {order.plano_meses} {order.plano_meses === 1 ? 'mês' : 'meses'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {panels.length === 0 ? (
          <div className="text-center py-8">
            <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhum local encontrado para este pedido</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Informações do período */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <h3 className="font-medium text-blue-900">Período de Veiculação</h3>
              </div>
              <p className="text-blue-800">
                De {formatDate(order.data_inicio)} até {formatDate(order.data_fim)}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Duração: {order.plano_meses} {order.plano_meses === 1 ? 'mês' : 'meses'}
              </p>
            </div>

            {/* Lista de locais */}
            {panels.map((building) => (
              <div key={building.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indexa-purple/20 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-indexa-purple" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{building.nome}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-gray-500" />
                        <p className="text-sm text-gray-600">{building.bairro}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{building.endereco}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                    Ativo
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {building.id.substring(0, 8)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
