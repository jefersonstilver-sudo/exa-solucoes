
import React from 'react';
import BuildingHeader from './BuildingHeader';
import BuildingMetrics from './BuildingMetrics';
import BuildingContactInfo from './BuildingContactInfo';
import BuildingPriceSection from './BuildingPriceSection';
import BuildingActions from './BuildingActions';

interface BuildingInfoSectionProps {
  building: any;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
}

const BuildingInfoSection: React.FC<BuildingInfoSectionProps> = ({
  building,
  onView,
  onEdit,
  onImageManager,
  onDelete
}) => {
  // Calcular estatísticas dos painéis (simulado - seria buscado do backend)
  const getPanelStats = () => {
    const totalPanels = building.quantidade_telas || 0;
    // Simular distribuição de status dos painéis
    const online = Math.floor(totalPanels * 0.7);
    const offline = Math.floor(totalPanels * 0.2);
    const maintenance = totalPanels - online - offline;

    return { total: totalPanels, online, offline, maintenance };
  };

  const panelStats = getPanelStats();

  return (
    <div className="flex-1 p-6">
      <div className="flex flex-col h-full">
        <BuildingHeader building={building} />
        
        <BuildingMetrics building={building} panelStats={panelStats} />
        
        <BuildingContactInfo building={building} />
        
        <BuildingPriceSection building={building} />
        
        <BuildingActions
          building={building}
          onView={onView}
          onEdit={onEdit}
          onImageManager={onImageManager}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};

export default BuildingInfoSection;
