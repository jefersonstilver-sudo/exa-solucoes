
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BuildingHeader from './card/BuildingHeader';
import BuildingImageSection from './card/BuildingImageSection';
import BuildingContactInfo from './card/BuildingContactInfo';
import BuildingMetrics from './card/BuildingMetrics';
import BuildingPriceSection from './card/BuildingPriceSection';
import BuildingActions from './card/BuildingActions';

interface AdminBuildingCardProps {
  building: any;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
}

const AdminBuildingCard: React.FC<AdminBuildingCardProps> = ({
  building,
  onView,
  onEdit,
  onImageManager,
  onDelete
}) => {
  const getStatusBadge = (status: string) => {
    if (status === 'ativo') {
      return (
        <Badge className="bg-green-500 text-white">
          ✅ Ativo
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-orange-500 text-white">
          ⚠️ Inativo
        </Badge>
      );
    }
  };

  // Calculate panel stats for the building
  const getPanelStats = () => {
    const totalPanels = building.quantidade_telas || 0;
    // Simulate panel status distribution - would come from backend in real scenario
    const online = Math.floor(totalPanels * 0.7);
    const offline = Math.floor(totalPanels * 0.2);
    const maintenance = totalPanels - online - offline;

    return { total: totalPanels, online, offline, maintenance };
  };

  const panelStats = getPanelStats();

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg ${
      building.status === 'inativo' ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'
    }`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <BuildingHeader building={building} />
          <div className="flex items-center space-x-2">
            {getStatusBadge(building.status)}
            {building.status === 'inativo' && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Em Manutenção na Loja
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <BuildingImageSection building={building} />
          </div>
          
          <div className="lg:col-span-6 space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informações Básicas</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Endereço:</span> {building.endereco}</p>
                  <p><span className="font-medium">Bairro:</span> {building.bairro}</p>
                  <p><span className="font-medium">Público:</span> {building.padrao_publico}</p>
                </div>
              </div>
            </div>
            <BuildingContactInfo building={building} />
          </div>
          
          <div className="lg:col-span-3 space-y-4">
            <BuildingMetrics building={building} panelStats={panelStats} />
            <BuildingPriceSection building={building} />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <BuildingActions
            building={building}
            onView={onView}
            onEdit={onEdit}
            onImageManager={onImageManager}
            onDelete={onDelete}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminBuildingCard;
