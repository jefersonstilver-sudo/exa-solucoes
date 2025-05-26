
import { create } from 'zustand';
import { BuildingStoreState } from './types';
import { defaultFilters } from './defaultFilters';
import { createBuildingStoreActions } from './buildingStoreActions';
import { createFilterActions } from './buildingStoreFilters';

export const useBuildingStore = create<BuildingStoreState>((set, get) => ({
  allBuildings: [],
  buildings: [],
  loading: false,
  isLoading: false,
  error: null,
  searchLocation: '',
  selectedLocation: null,
  isSearching: false,
  filters: { ...defaultFilters },
  disableFilters: false,
  initialized: false,
  
  // Combine all actions
  ...createBuildingStoreActions(set, get),
  ...createFilterActions(set, get)
}));

export default useBuildingStore;
