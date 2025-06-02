
export interface BuildingFilters {
  radius: number;
  neighborhood: string;
  venueType: string[];
  priceRange: [number, number];
  audienceMin: number;
  standardProfile: string[];
  amenities: string[];
  sortBy: string;
}

export interface BuildingStoreState {
  allBuildings: any[];
  buildings: any[];
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  selectedLocation: { lat: number, lng: number } | null;
  isSearching: boolean;
  filters: BuildingFilters;
  handleFilterChange: (newFilters: Partial<BuildingFilters>) => void;
  fetchBuildings: (lat?: number, lng?: number) => Promise<void>;
  handleSearch: (location: string) => Promise<void>;
  handleClearLocation: () => void;
  applyFilters: () => void;
  disableFilters: boolean;
  toggleFilters: () => void;
  initialized: boolean;
  initializeStore: () => Promise<void>;
}

