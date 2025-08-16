
import { create } from 'zustand';
import { BuildingStoreState } from './types';
import { defaultFilters } from './defaultFilters';
import { createBuildingStoreActions } from './buildingStoreActions';
import { createFilterActions } from './buildingStoreFilters';

export const useBuildingStore = create<BuildingStoreState>((set, get) => ({
  allBuildings: [],
  buildings: [],
  // CORREÇÃO: Unificar estados de loading - usar apenas isLoading
  isLoading: false,
  error: null,
  searchLocation: '',
  selectedLocation: null,
  isSearching: false,
  businessLocation: null,
  businessAddress: '',
  filters: { ...defaultFilters },
  disableFilters: false,
  initialized: false,

  // Sincronização Card ↔ Mapa
  hoveredBuildingId: null,
  selectedBuildingId: null,
  setHoveredBuilding: (id) => set(state => state.hoveredBuildingId === id ? state : { hoveredBuildingId: id }),
  setSelectedBuildingId: (id) => set({ selectedBuildingId: id }),
  
  // Combine all actions
  ...createBuildingStoreActions(set, get),
  ...createFilterActions(set, get)
}));

export default useBuildingStore;
