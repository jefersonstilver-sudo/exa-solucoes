
import { BuildingStore, fetchBuildingsForStore } from '@/services/buildingStoreService';
import { getLocationCoordinates } from '@/services/geocoding';
import { BuildingFilters } from './types';
import { toast } from 'sonner';

export const createBuildingStoreActions = (set: any, get: any) => ({
  initializeStore: async () => {
    const state = get();
    if (state.initialized && !state.forceRefresh) {
      console.log('🔄 [BUILDING STORE] Store já inicializado, pulando...');
      return;
    }
    
    console.log('🚀 [BUILDING STORE] === INICIALIZANDO STORE ===');
    set({ initialized: true, forceRefresh: false });
    
    // CORREÇÃO CRÍTICA: Sempre carregar todos os prédios ativos na inicialização
    await get().fetchBuildings();
  },

  // NOVO: Método público para forçar refresh dos dados
  refreshBuildings: async () => {
    console.log('🔄 [BUILDING STORE] === REFRESH FORÇADO DOS PRÉDIOS ===');
    set({ isLoading: true, error: null });
    
    try {
      const buildings = await fetchBuildingsForStore();
      console.log('📊 [BUILDING STORE] Prédios atualizados:', buildings.length);
      
      const activeBuildings = buildings.filter(building => building.status === 'ativo');
      console.log('🔄 [BUILDING STORE] Prédios ativos após refresh:', activeBuildings.length);
      
      set({ 
        allBuildings: buildings as BuildingStore[],
        buildings: activeBuildings as BuildingStore[],
        isLoading: false
      });
      
      toast.success(`${activeBuildings.length} prédio${activeBuildings.length !== 1 ? 's' : ''} carregado${activeBuildings.length !== 1 ? 's' : ''}`, {
        description: "Dados atualizados com sucesso!"
      });
      
    } catch (error: any) {
      console.error('❌ [BUILDING STORE] Erro no refresh:', error);
      set({ 
        error: error.message || 'Erro ao atualizar prédios', 
        isLoading: false
      });
      toast.error('Erro ao atualizar prédios');
    }
  },

  // NOVO: Forçar re-inicialização completa
  forceReload: async () => {
    console.log('🔄 [BUILDING STORE] === FORÇANDO RELOAD COMPLETO ===');
    set({ initialized: false, forceRefresh: true });
    await get().initializeStore();
  },
  
  setSearchLocation: (location: string) => {
    console.log('🔄 [BUILDING STORE] setSearchLocation:', location);
    set({ searchLocation: location });
  },
  
  toggleFilters: () => {
    console.log('🔄 [BUILDING STORE] Alternando estado dos filtros');
    set((state: any) => {
      const newDisableState = !state.disableFilters;
      console.log(`🔄 [BUILDING STORE] Filtros ${newDisableState ? 'DESABILITADOS' : 'HABILITADOS'}`);
      return { disableFilters: newDisableState };
    });
    // CORREÇÃO: Aplicar filtros diretamente sem setTimeout
    get().applyFilters();
  },
  
  handleFilterChange: (newFilters: Partial<BuildingFilters>) => {
    console.log('🔄 [BUILDING STORE] Alterando filtros:', newFilters);
    set((state: any) => ({
      filters: { ...state.filters, ...newFilters }
    }));
    // CORREÇÃO: Aplicar filtros diretamente sem setTimeout
    get().applyFilters();
  },
  
  fetchBuildings: async (lat?: number, lng?: number) => {
    try {
      console.log('🔄 [BUILDING STORE] === INICIANDO BUSCA DE PRÉDIOS ===');
      console.log('🔄 [BUILDING STORE] Coordenadas fornecidas:', { lat, lng });
      set({ isLoading: true, error: null });
      
      // CORREÇÃO: Chamar sem argumentos, pois a função não aceita parâmetros
      const buildings = await fetchBuildingsForStore();
      console.log('📊 [BUILDING STORE] Prédios recebidos do service:', buildings.length);
      
      buildings.forEach((building, index) => {
        console.log(`📊 [BUILDING STORE] Prédio ${index + 1}: ${building.nome} (Status: ${building.status}, Público: ${building.publico_estimado})`);
      });
      
      // CORREÇÃO CRÍTICA: Garantir que o estado seja atualizado corretamente
      const activeBuildings = buildings.filter(building => building.status === 'ativo');
      console.log('🔄 [BUILDING STORE] Prédios ativos encontrados:', activeBuildings.length);
      
      set({ 
        allBuildings: buildings as BuildingStore[],
        buildings: activeBuildings as BuildingStore[],
        isLoading: false
      });
      
      console.log('✅ [BUILDING STORE] Estado atualizado com sucesso');
      
    } catch (error: any) {
      console.error('❌ [BUILDING STORE] Erro ao buscar prédios:', error);
      set({ 
        error: error.message || 'Failed to fetch buildings', 
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
      
      // CORREÇÃO: Chamar sem argumentos
      await get().fetchBuildings();
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
});
