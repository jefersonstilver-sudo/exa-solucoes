
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useBuildingsData } from '@/hooks/useBuildingsData';
import { useAuth } from '@/hooks/useAuth';
import BuildingFormDialog from '@/components/admin/buildings/BuildingFormDialog';
import BuildingsPageHeader from '@/components/admin/buildings/BuildingsPageHeader';
import BuildingsConnectionStatus from '@/components/admin/buildings/BuildingsConnectionStatus';
import BuildingsMainStats from '@/components/admin/buildings/BuildingsMainStats';
import BuildingSearchSection from '@/components/admin/buildings/BuildingSearchSection';
import BuildingsContentSection from '@/components/admin/buildings/BuildingsContentSection';

const BuildingsPage = () => {
  const { buildings, stats, loading, refetch } = useBuildingsData();
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const handleNewBuilding = () => {
    setSelectedBuilding(null);
    setShowFormDialog(true);
  };

  const handleEditBuilding = (building: any) => {
    setSelectedBuilding(building);
    setShowFormDialog(true);
  };

  const handleViewBuilding = (building: any) => {
    console.log('Ver detalhes do prédio:', building);
  };

  const handleImageManager = (building: any) => {
    console.log('Gerenciar imagens do prédio:', building);
  };

  const handleDeleteBuilding = (building: any) => {
    console.log('Excluir prédio:', building);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
          <span className="ml-2 text-indexa-purple">Carregando prédios...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BuildingsPageHeader
        loading={loading}
        onRefresh={refetch}
        onNewBuilding={handleNewBuilding}
      />

      <BuildingsConnectionStatus
        buildingsCount={buildings.length}
        userEmail={userProfile?.email}
      />

      <BuildingsMainStats stats={stats} />

      <BuildingSearchSection
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <BuildingsContentSection
        buildings={buildings}
        searchTerm={searchTerm}
        userEmail={userProfile?.email}
        onView={handleViewBuilding}
        onEdit={handleEditBuilding}
        onImageManager={handleImageManager}
        onDelete={handleDeleteBuilding}
      />

      <BuildingFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        building={selectedBuilding}
        onSuccess={refetch}
      />
    </div>
  );
};

export default BuildingsPage;
