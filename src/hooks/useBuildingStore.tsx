
import { create } from 'zustand';
import { BuildingStore, fetchBuildingsForStore } from '@/services/buildingStoreService';
import { getLocationCoordinates } from '@/services/geocoding';
import { filterBuildings } from '@/services/buildingFilterService';

export interface BuildingFilters {
  radius: number;
  neighborhood: string;
  venueType: string[];
  priceRange: [number, number];
  audienceMin: number;
  standardProfile: string[];
  amenities: string[];
}

interface BuildingStoreState {
  allBuildings: BuildingStore[];
  buildings: BuildingStore[];
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
}

// AJUSTADO: Filtros padrão mais permissivos
const defaultFilters: BuildingFilters = {
  radius: 10000, // Aumentado para 10km
  neighborhood: '',
  venueType: [], // Vazio = todos os tipos
  priceRange: [0, 5000], // Range muito amplo
  audienceMin: 0, // Zero = sem filtro de público
  standardProfile: [], // Vazio = todos os padrões
  amenities: [] // Vazio = todas as amenities
};

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
  
  setSearchLocation: (location: string) => {
    set({ searchLocation: location });
  },
  
  toggleFilters: () => {
    console.log('🔄 [BUILDING STORE] Alternando estado dos filtros');
    set(state => {
      const newDisableState = !state.disableFilters;
      console.log(`🔄 [BUILDING STORE] Filtros ${newDisableState ? 'DESABILITADOS' : 'HABILITADOS'}`);
      return { disableFilters: newDisableState };
    });
    // Reaplicar filtros após mudança
    setTimeout(() => get().applyFilters(), 0);
  },
  
  handleFilterChange: (newFilters: Partial<BuildingFilters>) => {
    console.log('🔄 [BUILDING STORE] Alterando filtros:', newFilters);
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
    // Aplicar filtros imediatamente após mudança
    setTimeout(() => get().applyFilters(), 0);
  },
  
  applyFilters: () => {
    const { allBuildings, filters, disableFilters } = get();
    
    console.log('🔍 [BUILDING STORE] === APLICANDO FILTROS ===');
    console.log('🔍 [BUILDING STORE] Total de prédios disponíveis:', allBuildings.length);
    console.log('🔍 [BUILDING STORE] Filtros desabilitados:', disableFilters);
    console.log('🔍 [BUILDING STORE] Configuração atual dos filtros:', filters);
    
    if (disableFilters) {
      // Mostrar todos os prédios ativos quando filtros estão desabilitados
      const activeBuildings = allBuildings.filter(building => building.status === 'ativo');
      console.log('✅ [BUILDING STORE] Filtros desabilitados - Mostrando todos os prédios ativos:', activeBuildings.length);
      set({ buildings: activeBuildings });
      return;
    }
    
    const filteredBuildings = filterBuildings(allBuildings, filters);
    console.log('✅ [BUILDING STORE] Prédios após aplicar filtros:', filteredBuildings.length);
    
    set({ buildings: filteredBuildings });
  },
  
  fetchBuildings: async (lat?: number, lng?: number) => {
    try {
      console.log('🔄 [BUILDING STORE] Iniciando busca de prédios...');
      console.log('🔄 [BUILDING STORE] Coordenadas:', { lat, lng });
      set({ loading: true, isLoading: true, error: null });
      
      const buildings = await fetchBuildingsForStore(lat, lng, get().filters.radius);
      console.log('📊 [BUILDING STORE] Prédios recebidos do service:', buildings.length);
      console.log('📊 [BUILDING STORE] Primeiros 3 prédios:', buildings.slice(0, 3).map(b => ({
        id: b.id,
        nome: b.nome,
        status: b.status,
        preco_base: b.preco_base
      })));
      
      set({ 
        allBuildings: buildings as BuildingStore[],
        loading: false, 
        isLoading: false 
      });
      
      // Aplicar filtros aos novos dados
      get().applyFilters();
      
    } catch (error: any) {
      console.error('❌ [BUILDING STORE] Erro ao buscar prédios:', error);
      set({ 
        error: error.message || 'Failed to fetch buildings', 
        loading: false, 
        isLoading: false 
      });
    }
  },
  
  handleSearch: async (location: string) => {
    if (!location.trim()) {
      return;
    }
    
    try {
      console.log('🔍 [BUILDING STORE] Buscando localização:', location);
      set({ isSearching: true });
      
      const coordinates = await getLocationCoordinates(location);
      
      if (!coordinates) {
        console.warn('⚠️ [BUILDING STORE] Coordenadas não encontradas');
        set({ isSearching: false });
        return;
      }
      
      console.log('📍 [BUILDING STORE] Coordenadas encontradas:', coordinates);
      set({ 
        selectedLocation: coordinates,
        searchLocation: location
      });
      
      await get().fetchBuildings(coordinates.lat, coordinates.lng);
      
      set({ isSearching: false });
    } catch (error) {
      console.error("❌ [BUILDING STORE] Erro na busca:", error);
      set({ isSearching: false });
    }
  },
  
  handleClearLocation: () => {
    console.log('🧹 [BUILDING STORE] Limpando localização');
    set({ 
      selectedLocation: null,
      searchLocation: '',
      allBuildings: [],
      buildings: []
    });
  }
}));

export default useBuildingStore;
