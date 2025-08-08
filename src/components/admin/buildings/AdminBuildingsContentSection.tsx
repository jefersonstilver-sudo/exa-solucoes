
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminBuildingCard from './AdminBuildingCard';
import BuildingsEmptyState from './BuildingsEmptyState';
import { useBuildingsVideoCount } from '@/hooks/useBuildingsVideoCount';

interface AdminBuildingsContentSectionProps {
  buildings: any[];
  searchTerm: string;
  userEmail?: string;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
}

const AdminBuildingsContentSection: React.FC<AdminBuildingsContentSectionProps> = ({
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

  const activeBuildings = filteredBuildings.filter(b => b.status === 'ativo');
  const inactiveBuildings = filteredBuildings.filter(b => b.status === 'inativo');
  const buildingIds = filteredBuildings.map(b => b.id);
  const { counts: videoCounts } = useBuildingsVideoCount(buildingIds);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">Lista Administrativa de Prédios</CardTitle>
        <CardDescription className="text-gray-600">
          {filteredBuildings.length} prédios encontrados ({activeBuildings.length} ativos, {inactiveBuildings.length} inativos)
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
              <AdminBuildingCard
                key={building.id}
                building={building}
                onView={onView}
                onEdit={onEdit}
                onImageManager={onImageManager}
                onDelete={onDelete}
                videoCount={videoCounts[building.id] ?? 0}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminBuildingsContentSection;
