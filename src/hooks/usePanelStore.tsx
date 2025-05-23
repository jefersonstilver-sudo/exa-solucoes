import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Panel } from '@/types/panel';
import { ensureArray, unwrapData } from '@/utils/supabaseUtils';
import { useToast } from '@/hooks/use-toast';
import { FilterOptions } from '@/types/filter';
import { getLocationCoordinates } from '@/services/geocoding';

interface PanelStoreState {
  panels: Panel[];
  loading: boolean;
  isLoading: boolean; // Alias for loading to maintain API compatibility
  error: string | null;
  selectedPanels: string[];
  searchRadius: number;
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  selectedLocation: { lat: number, lng: number } | null;
  isSearching: boolean;
  filters: FilterOptions;
  handleFilterChange: (newFilters: Partial<FilterOptions>) => void;
  setSearchRadius: (radius: number) => void;
  fetchPanels: (lat: number, lng: number) => Promise<void>;
  togglePanelSelection: (panelId: string) => void;
  clearSelectedPanels: () => void;
  isPanelSelected: (panelId: string) => boolean;
  getSelectedPanelCount: () => number;
  getSelectedPanels: () => Panel[];
  handleSearch: (location: string) => Promise<void>;
  handleClearLocation: () => void;
}

// Default filter options
const defaultFilters: FilterOptions = {
  status: 'all',
  resolution: 'all',
  sort: 'distance',
  priceRange: { min: 0, max: 10000 }
};

export const usePanelStore = create<PanelStoreState>((set, get) => ({
  panels: [],
  loading: false,
  isLoading: false, // Alias for loading
  error: null,
  selectedPanels: [], // FIXED: Initialize as empty array instead of string
  searchRadius: 500,
  searchLocation: '',
  selectedLocation: null,
  isSearching: false,
  filters: { ...defaultFilters },
  
  setSearchLocation: (location: string) => {
    set({ searchLocation: location });
  },
  
  handleFilterChange: (newFilters: Partial<FilterOptions>) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },
  
  setSearchRadius: (radius: number) => {
    set({ searchRadius: radius });
  },
  
  fetchPanels: async (lat: number, lng: number) => {
    try {
      set({ loading: true, isLoading: true, error: null });
      
      const { data: responseData, error } = await supabase.rpc('get_panels_by_location', {
        lat,
        lng, 
        radius_meters: get().searchRadius
      });
      
      if (error) throw error;
      
      // Ensure we have data as array and type assert it
      const dataArray = ensureArray(responseData);
      
      // Map and convert the buildings property to the expected type
      const panels = dataArray.map((item: any) => ({
        id: item.id,
        code: item.code,
        building_id: item.building_id,
        status: item.status,
        ultima_sync: item.ultima_sync,
        resolucao: item.resolucao,
        modo: item.modo,
        buildings: item.buildings
      })) as Panel[];
      
      set({ panels, loading: false, isLoading: false });
      
    } catch (error: any) {
      console.error('Error fetching panels:', error);
      set({ error: error.message || 'Failed to fetch panels', loading: false, isLoading: false });
    }
  },
  
  togglePanelSelection: (panelId: string) => {
    set((state) => {
      const currentSelection = Array.isArray(state.selectedPanels) ? state.selectedPanels : [];
      if (currentSelection.includes(panelId)) {
        return {
          selectedPanels: currentSelection.filter(id => id !== panelId)
        };
      } else {
        return {
          selectedPanels: [...currentSelection, panelId]
        };
      }
    });
  },
  
  clearSelectedPanels: () => {
    set({ selectedPanels: [] });
  },
  
  isPanelSelected: (panelId: string) => {
    const selectedPanels = get().selectedPanels;
    return Array.isArray(selectedPanels) ? selectedPanels.includes(panelId) : false;
  },
  
  getSelectedPanelCount: () => {
    const selectedPanels = get().selectedPanels;
    return Array.isArray(selectedPanels) ? selectedPanels.length : 0;
  },
  
  getSelectedPanels: () => {
    const selectedPanels = get().selectedPanels;
    const panels = get().panels;
    return Array.isArray(selectedPanels) ? panels.filter(panel => selectedPanels.includes(panel.id)) : [];
  },
  
  handleSearch: async (location: string) => {
    if (!location.trim()) {
      return;
    }
    
    try {
      set({ isSearching: true });
      
      // Get coordinates from address using geocoding service
      const coordinates = await getLocationCoordinates(location);
      
      if (!coordinates) {
        set({ isSearching: false });
        return;
      }
      
      // Update selected location
      set({ 
        selectedLocation: coordinates,
        searchLocation: location
      });
      
      // Fetch panels using the coordinates
      await get().fetchPanels(coordinates.lat, coordinates.lng);
      
      set({ isSearching: false });
    } catch (error) {
      console.error("Error searching location:", error);
      set({ isSearching: false });
    }
  },
  
  handleClearLocation: () => {
    set({ 
      selectedLocation: null,
      searchLocation: '',
      panels: []
    });
  }
}));

export default usePanelStore;
