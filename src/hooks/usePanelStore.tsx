
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Panel, PanelWithDistance } from '@/types/panel';
import { ensureArray, unwrapData } from '@/utils/supabaseUtils';

interface PanelStoreState {
  panels: Panel[];
  loading: boolean;
  error: string | null;
  selectedPanels: string[];
  searchRadius: number;
  setSearchRadius: (radius: number) => void;
  fetchPanels: (lat: number, lng: number) => Promise<void>;
  togglePanelSelection: (panelId: string) => void;
  clearSelectedPanels: () => void;
  isPanelSelected: (panelId: string) => boolean;
  getSelectedPanelCount: () => number;
  getSelectedPanels: () => Panel[];
}

export const usePanelStore = create<PanelStoreState>((set, get) => ({
  panels: [],
  loading: false,
  error: null,
  selectedPanels: [],
  searchRadius: 500,
  
  setSearchRadius: (radius: number) => {
    set({ searchRadius: radius });
  },
  
  fetchPanels: async (lat: number, lng: number) => {
    try {
      set({ loading: true, error: null });
      
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
      
      set({ panels, loading: false });
      
    } catch (error: any) {
      console.error('Error fetching panels:', error);
      set({ error: error.message || 'Failed to fetch panels', loading: false });
    }
  },
  
  togglePanelSelection: (panelId: string) => {
    set((state) => {
      if (state.selectedPanels.includes(panelId)) {
        return {
          selectedPanels: state.selectedPanels.filter(id => id !== panelId)
        };
      } else {
        return {
          selectedPanels: [...state.selectedPanels, panelId]
        };
      }
    });
  },
  
  clearSelectedPanels: () => {
    set({ selectedPanels: [] });
  },
  
  isPanelSelected: (panelId: string) => {
    return get().selectedPanels.includes(panelId);
  },
  
  getSelectedPanelCount: () => {
    return get().selectedPanels.length;
  },
  
  getSelectedPanels: () => {
    return get().panels.filter(panel => get().selectedPanels.includes(panel.id));
  }
}));

export default usePanelStore;
