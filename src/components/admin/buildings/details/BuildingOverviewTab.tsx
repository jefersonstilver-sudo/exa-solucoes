
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Activity,
  Users,
  Eye,
  DollarSign,
  Monitor
} from 'lucide-react';

interface BuildingOverviewTabProps {
  building: any;
  panels: any[];
}

const BuildingOverviewTab: React.FC<BuildingOverviewTabProps> = ({
  building,
  panels
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Localização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <strong>Endereço:</strong>
            <p className="text-gray-600">{building.endereco}</p>
          </div>
          <div>
            <strong>Bairro:</strong>
            <Badge variant="outline">{building.bairro}</Badge>
          </div>
          {building.latitude && building.longitude && (
            <div>
              <strong>Coordenadas:</strong>
              <p className="text-gray-600 text-sm">
                {building.latitude}, {building.longitude}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Métricas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{building.numero_unidades}</div>
              <div className="text-xs text-blue-600">Unidades</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Eye className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">{building.publico_estimado}</div>
              <div className="text-xs text-purple-600">Público</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <DollarSign className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <div className="text-lg font-bold text-green-600">{formatPrice(building.preco_base)}</div>
              <div className="text-xs text-green-600">Preço Base</div>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <Monitor className="h-6 w-6 mx-auto mb-1 text-indigo-600" />
              <div className="text-2xl font-bold text-indigo-600">{panels.length}</div>
              <div className="text-xs text-indigo-600">Painéis</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuildingOverviewTab;
