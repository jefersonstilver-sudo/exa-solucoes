
import { useState, useEffect } from 'react';
import { BuildingStore, fetchBuildingsForStore } from '@/services/buildingStoreService';
import { toast } from 'sonner';

export const useSimpleBuildingStore = () => {
  const [buildings, setBuildings] = useState<BuildingStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBuildings = async () => {
    try {
      console.log('🏢 [SIMPLE STORE] === CARREGANDO PRÉDIOS ===');
      setIsLoading(true);
      setError(null);
      
      const data = await fetchBuildingsForStore();
      console.log('🏢 [SIMPLE STORE] Prédios recebidos:', data.length);
      
      if (data.length === 0) {
        console.warn('⚠️ [SIMPLE STORE] Nenhum prédio encontrado');
        toast.error('Nenhum prédio encontrado');
      } else {
        console.log('✅ [SIMPLE STORE] Prédios carregados com sucesso');
        data.forEach((building, index) => {
          console.log(`🏢 [SIMPLE STORE] Prédio ${index + 1}: ${building.nome} (${building.bairro})`);
        });
      }
      
      setBuildings(data);
    } catch (err: any) {
      console.error('❌ [SIMPLE STORE] Erro ao carregar prédios:', err);
      setError(err.message || 'Erro ao carregar prédios');
      toast.error('Erro ao carregar prédios');
      setBuildings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBuildings();
  }, []);

  return {
    buildings,
    isLoading,
    error,
    refetch: loadBuildings
  };
};
