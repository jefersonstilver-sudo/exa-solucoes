
import { Building } from './buildingsDataService';

export interface BuildingStats {
  total: number;
  active: number;
  inactive: number;
  totalPanels: number;
}

export const calculateBuildingStats = (buildings: Building[]): BuildingStats => {
  const total = buildings.length;
  const active = buildings.filter(b => b.status === 'ativo').length;
  const inactive = buildings.filter(b => b.status === 'inativo').length;
  const totalPanels = buildings.reduce((sum, building) => 
    sum + (building.quantidade_telas || 0), 0
  );

  return { 
    total, 
    active, 
    inactive, 
    totalPanels 
  };
};
