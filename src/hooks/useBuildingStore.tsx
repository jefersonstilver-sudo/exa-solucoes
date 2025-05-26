
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
  initialized: boolean;
  initializeStore: () => Promise<void>;
}

// CORREÇÃO: Filtros padrão mais permissivos para garantir que prédios apareçam
const defaultFilters: BuildingFilters = {
  radius: 50000, // 50km
  neighborhood: '',
  venueType: [], // Vazio = todos os tipos
  priceRange: [0, 10000], // Range amplo
  audienceMin: 0, // Zero = sem restrição de público
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
  initialized: false,
  
  initializeStore: async () => {
    const state = get();
    if (state.initialized) {
      console.log('🔄 [BUILDING STORE] Store já inicializado, pulando...');
      return;
    }
    
    console.log('🚀 [BUILDING STORE] === INICIALIZANDO STORE ===');
    set({ initialized: true });
    
    // CORREÇÃO CRÍTICA: Sempre carregar todos os prédios ativos na inicialização
    await get().fetchBuildings();
  },
  
  setSearchLocation: (location: string) => {
    console.log('🔄 [BUILDING STORE] setSearchLocation:', location);
    set({ searchLocation: location });
  },
  
  toggleFilters: () => {
    console.log('🔄 [BUILDING STORE] Alternando estado dos filtros');
    set(state => {
      const newDisableState = !state.disableFilters;
      console.log(`🔄 [BUILDING STORE] Filtros ${newDisableState ? 'DESABILITADOS' : 'HABILITADOS'}`);
      return { disableFilters: newDisableState };
    });
    setTimeout(() => get().applyFilters(), 0);
  },
  
  handleFilterChange: (newFilters: Partial<BuildingFilters>) => {
    console.log('🔄 [BUILDING STORE] Alterando filtros:', newFilters);
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
    setTimeout(() => get().applyFilters(), 0);
  },
  
  applyFilters: () => {
    const { allBuildings, filters, disableFilters } = get();
    
    console.log('🔍 [BUILDING STORE] === APLICANDO FILTROS ===');
    console.log('🔍 [BUILDING STORE] Total de prédios disponíveis:', allBuildings.length);
    console.log('🔍 [BUILDING STORE] Filtros desabilitados:', disableFilters);
    
    if (disableFilters || allBuildings.length === 0) {
      const activeBuildings = allBuildings.filter(building => building.status === 'ativo');
      console.log('✅ [BUILDING STORE] Mostrando todos os prédios ativos:', activeBuildings.length);
      set({ buildings: activeBuildings });
      return;
    }
    
    const hasActiveFilters = (
      filters.neighborhood.trim() !== '' ||
      filters.venueType.length > 0 ||
      filters.priceRange[0] > 0 || filters.priceRange[1] < 10000 ||
      filters.audienceMin > 0 ||
      filters.standardProfile.length > 0 ||
      filters.amenities.length > 0
    );
    
    if (!hasActiveFilters) {
      console.log('🟢 [BUILDING STORE] Nenhum filtro específico ativo - Mostrando todos os prédios ativos');
      const activeBuildings = allBuildings.filter(building => building.status === 'ativo');
      set({ buildings: activeBuildings });
      return;
    }
    
    const filteredBuildings = filterBuildings(allBuildings, filters);
    console.log('✅ [BUILDING STORE] Prédios após aplicar filtros:', filteredBuildings.length);
    
    set({ buildings: filteredBuildings });
  },
  
  fetchBuildings: async (lat?: number, lng?: number) => {
    try {
      console.log('🔄 [BUILDING STORE] === INICIANDO BUSCA DE PRÉDIOS ===');
      console.log('🔄 [BUILDING STORE] Coordenadas fornecidas:', { lat, lng });
      set({ loading: true, isLoading: true, error: null });
      
      const buildings = await fetchBuildingsForStore(lat, lng, get().filters.radius);
      console.log('📊 [BUILDING STORE] Prédios recebidos do service:', buildings.length);
      
      buildings.forEach((building, index) => {
        console.log(`📊 [BUILDING STORE] Prédio ${index + 1}: ${building.nome} (Status: ${building.status}, Público: ${building.publico_estimado})`);
      });
      
      // CORREÇÃO CRÍTICA: Garantir que o estado seja atualizado corretamente
      const activeBuildings = buildings.filter(building => building.status === 'ativo');
      console.log('🔄 [BUILDING STORE] Prédios ativos encontrados:', activeBuildings.length);
      
      set({ 
        allBuildings: buildings as BuildingStore[],
        buildings: activeBuildings as BuildingStore[], // CORREÇÃO: Definir buildings diretamente também
        loading: false, 
        isLoading: false 
      });
      
      console.log('✅ [BUILDING STORE] Estado atualizado com sucesso');
      
      // Log final do estado
      setTimeout(() => {
        const currentState = get();
        console.log('📊 [BUILDING STORE] === ESTADO FINAL ===');
        console.log('📊 [BUILDING STORE] allBuildings.length:', currentState.allBuildings.length);
        console.log('📊 [BUILDING STORE] buildings.length:', currentState.buildings.length);
        console.log('📊 [BUILDING STORE] loading:', currentState.loading);
        console.log('📊 [BUILDING STORE] isLoading:', currentState.isLoading);
      }, 100);
      
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
      console.log('🔍 [BUILDING STORE] Busca sem localização - carregando todos os prédios');
      await get().fetchBuildings();
      return;
    }
    
    try {
      console.log('🔍 [BUILDING STORE] Buscando localização:', location);
      set({ isSearching: true });
      
      const coordinates = await getLocationCoordinates(location);
      
      if (!coordinates) {
        console.warn('⚠️ [BUILDING STORE] Coordenadas não encontradas - carregando todos os prédios');
        await get().fetchBuildings();
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
      await get().fetchBuildings();
      set({ isSearching: false });
    }
  },
  
  handleClearLocation: () => {
    console.log('🧹 [BUILDING STORE] Limpando localização e recarregando todos os prédios');
    set({ 
      selectedLocation: null,
      searchLocation: ''
    });
    get().fetchBuildings();
  }
}));

export default useBuildingStore;
