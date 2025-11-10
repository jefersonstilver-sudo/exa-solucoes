
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import AdminBuildingCard from './AdminBuildingCard';
import { useBuildingsVideoCount } from '@/hooks/useBuildingsVideoCount';

interface AdminBuildingsListProps {
  buildings: any[];
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
  onViewCampaigns?: (building: any) => void;
}

const AdminBuildingsList: React.FC<AdminBuildingsListProps> = ({
  buildings,
  onView,
  onEdit,
  onImageManager,
  onDelete,
  onViewCampaigns
}) => {
  const buildingIds = buildings.map(b => b.id);
  
  console.log('🏗️ [ADMIN BUILDINGS LIST] Total de prédios:', buildings.length);
  console.log('🏗️ [ADMIN BUILDINGS LIST] Building IDs:', buildingIds.map(id => id.slice(0, 8)).join(', '));
  
  const { counts: videoCounts, loading: videoCountsLoading } = useBuildingsVideoCount(buildingIds);
  
  console.log('📊 [ADMIN BUILDINGS LIST] Video counts recebidos:', Object.keys(videoCounts).length, 'prédios');
  const prediosComVideo = Object.entries(videoCounts).filter(([_, count]) => count > 0);
  if (prediosComVideo.length > 0) {
    console.log('✅ [ADMIN BUILDINGS LIST] Prédios com vídeos:', prediosComVideo.map(([id, count]) => `${id.slice(0, 8)} (${count})`).join(', '));
  }
  
  const activeBuildings = buildings.filter(b => b.status === 'ativo');
  const maintenanceBuildings = buildings.filter(b => b.status === 'manutenção');
  const installationBuildings = buildings.filter(b => b.status === 'instalação');
  const inactiveBuildings = buildings.filter(b => b.status === 'inativo');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prédios Cadastrados ({buildings.length})</CardTitle>
        <CardDescription>
          Sistema administrativo completo - {activeBuildings.length} ativos, {maintenanceBuildings.length} em manutenção, {installationBuildings.length} em instalação, {inactiveBuildings.length} inativos
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
              <AdminBuildingCard
                key={building.id}
                building={building}
                onView={onView}
                onEdit={onEdit}
                onImageManager={onImageManager}
                onDelete={onDelete}
                onViewCampaigns={onViewCampaigns}
                videoCount={videoCounts[building.id] ?? 0}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminBuildingsList;
