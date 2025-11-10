
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
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Prédios Cadastrados</CardTitle>
            <CardDescription className="mt-1">
              {buildings.length} {buildings.length === 1 ? 'prédio' : 'prédios'} • {activeBuildings.length} {activeBuildings.length === 1 ? 'ativo' : 'ativos'} • {inactiveBuildings.length} {inactiveBuildings.length === 1 ? 'inativo' : 'inativos'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {buildings.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum prédio encontrado</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Ajuste os filtros de busca ou cadastre o primeiro prédio do sistema.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
