
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import BuildingCard from './BuildingCard';

interface BuildingsListProps {
  buildings: any[];
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
}

const BuildingsList: React.FC<BuildingsListProps> = ({
  buildings,
  onView,
  onEdit,
  onImageManager,
  onDelete
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prédios Cadastrados ({buildings.length})</CardTitle>
        <CardDescription>
          Sistema completo com todas as funcionalidades implementadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {buildings.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum prédio encontrado</h3>
            <p className="text-gray-500">
              Tente ajustar os filtros de busca ou comece criando seu primeiro prédio.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {buildings.map((building) => (
              <BuildingCard
                key={building.id}
                building={building}
                onView={onView}
                onEdit={onEdit}
                onImageManager={onImageManager}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BuildingsList;
