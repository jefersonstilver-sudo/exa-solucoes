
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BuildingHeader from './card/BuildingHeader';
import BuildingImageSection from './card/BuildingImageSection';
import BuildingInfoSection from './card/BuildingInfoSection';
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
            <BuildingInfoSection building={building} />
            <BuildingContactInfo building={building} />
          </div>
          
          <div className="lg:col-span-3 space-y-4">
            <BuildingMetrics building={building} />
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
