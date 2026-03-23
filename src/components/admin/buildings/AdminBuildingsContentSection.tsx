
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
  onViewPlaylist?: (building: any) => void;
}

const AdminBuildingsContentSection: React.FC<AdminBuildingsContentSectionProps> = ({
  buildings,
  searchTerm,
  userEmail,
  onView,
  onEdit,
  onImageManager,
  onDelete,
  onViewPlaylist
}) => {
  const filteredBuildings = buildings.filter(building =>
    building.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.bairro.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeBuildings = filteredBuildings.filter(b => b.status === 'ativo');
  const internalBuildings = filteredBuildings.filter(b => b.status === 'interno');
  const maintenanceBuildings = filteredBuildings.filter(b => b.status === 'manutenção');
  const installationBuildings = filteredBuildings.filter(b => b.status === 'instalação');
  const inactiveBuildings = filteredBuildings.filter(b => b.status === 'inativo');
  const buildingIds = filteredBuildings.map(b => b.id);
  const { counts: videoCounts } = useBuildingsVideoCount(buildingIds);

  return (
    <Card>
      <CardHeader>
        {/* Admin-only section: do NOT display these metrics publicly */}
        <CardTitle className="text-gray-900">Ativos em Prédios Cadastrados</CardTitle>
        <CardDescription className="text-gray-600">
          {filteredBuildings.length} prédios encontrados ({activeBuildings.length} ativos, {internalBuildings.length} internos, {inactiveBuildings.length} inativos)
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
                onViewPlaylist={onViewPlaylist}
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
