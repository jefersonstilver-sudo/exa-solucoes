
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BuildingCard from './BuildingCard';
import BuildingsEmptyState from './BuildingsEmptyState';

interface BuildingsContentSectionProps {
  buildings: any[];
  searchTerm: string;
  userEmail?: string;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
}

const BuildingsContentSection: React.FC<BuildingsContentSectionProps> = ({
  buildings,
  searchTerm,
  userEmail,
  onView,
  onEdit,
  onImageManager,
  onDelete
}) => {
  const filteredBuildings = buildings.filter(building =>
    building.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.bairro.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">Lista de Prédios</CardTitle>
        <CardDescription className="text-gray-600">
          {filteredBuildings.length} prédios encontrados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredBuildings.length === 0 ? (
            <BuildingsEmptyState
              buildingsCount={buildings.length}
              searchTerm={searchTerm}
              userEmail={userEmail}
            />
          ) : (
            filteredBuildings.map((building) => (
              <BuildingCard
                key={building.id}
                building={building}
                onView={onView}
                onEdit={onEdit}
                onImageManager={onImageManager}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BuildingsContentSection;
