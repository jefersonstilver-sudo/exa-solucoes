import React, { useState } from 'react';
import { SimpleBuildingStore } from '@/services/simpleBuildingService';
import PanelStoreMapSidebar from './PanelStoreMapSidebar';
import SimpleBuildingGrid from '@/components/building-store/SimpleBuildingGrid';
import MobileBuildingGrid from '@/components/building-store/MobileBuildingGrid';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';

// Simple interface for map compatibility
interface MapBuilding {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
  venue_type: string;
  location_type: string;
  status: string;
  preco_base: number;
}

interface PanelStoreLayoutProps {
  buildings: SimpleBuildingStore[];
  isLoading: boolean;
  adaptBuildingForMobileGrid: (building: any) => any;
}

const PanelStoreLayout: React.FC<PanelStoreLayoutProps> = ({
  buildings,
  isLoading,
  adaptBuildingForMobileGrid
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isMobile } = useMobileBreakpoints();

  const handleSidebarToggle = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // Convert SimpleBuildingStore to MapBuilding format for map
  const buildingsForMap: MapBuilding[] = buildings.map(building => ({
    id: building.id,
    nome: building.nome,
    endereco: building.endereco || '',
    bairro: building.bairro || '',
    cidade: building.cidade || 'Foz do Iguaçu',
    estado: building.estado || 'PR',
    latitude: building.latitude || 0,
    longitude: building.longitude || 0,
    venue_type: building.venue_type || 'Residencial',
    location_type: 'residential',
    status: building.status || 'ativo',
    preco_base: building.preco_base || 0
  }));

  if (isMobile) {
    return (
      <div className="space-y-6">
        <div className="text-center px-2">
          <h1 className="text-2xl font-bold text-[#3C1361] mb-2">
            Prédios Disponíveis
          </h1>
          <p className="text-sm text-gray-600">
            Toque para ver os painéis
          </p>
        </div>
        
        <MobileBuildingGrid 
          buildings={buildings.map(adaptBuildingForMobileGrid)}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop Layout with Map Sidebar */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-[#3C1361] mb-2">
          Loja de Prédios
        </h1>
        <p className="text-gray-600">
          Selecione um prédio para ver os painéis disponíveis
        </p>
      </div>

      <div className="flex gap-6">
        {/* Map Sidebar */}
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-80'}`}>
          <PanelStoreMapSidebar
            buildings={buildingsForMap}
            isCollapsed={sidebarCollapsed}
            onToggle={handleSidebarToggle}
            isLoading={isLoading}
          />
        </div>

        {/* Buildings Grid */}
        <div className="flex-1 min-w-0">
          <SimpleBuildingGrid 
            buildings={buildings}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default PanelStoreLayout;