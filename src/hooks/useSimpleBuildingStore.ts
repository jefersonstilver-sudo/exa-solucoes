
import { useState, useEffect } from 'react';
import { fetchActiveBuildings, SimpleBuildingStore } from '@/services/simpleBuildingService';
import { toast } from 'sonner';

export const useSimpleBuildingStore = () => {
  const [buildings, setBuildings] = useState<SimpleBuildingStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBuildings = async (forceRefresh = false) => {
    try {
      console.log('🏢 [SIMPLE STORE] === CARREGANDO PRÉDIOS ===');
      if (forceRefresh) {
        console.log('🔄 [SIMPLE STORE] Forçando refresh dos dados');
      }
      setIsLoading(true);
      setError(null);
      
      const data = await fetchActiveBuildings();
      console.log('🏢 [SIMPLE STORE] Prédios recebidos:', data.length);
      
      if (data.length === 0) {
        console.warn('⚠️ [SIMPLE STORE] Nenhum prédio encontrado');
        toast.error('Nenhum prédio ativo encontrado');
      } else {
        console.log('✅ [SIMPLE STORE] Prédios carregados com sucesso');
        data.forEach((building, index) => {
          console.log(`🏢 [SIMPLE STORE] Prédio ${index + 1}: ${building.nome} (${building.bairro}) - R$ ${building.preco_base}`);
          // Log específico para Rio Negro
          if (building.nome === 'Rio Negro') {
            console.log(`🎯 [SIMPLE STORE] RIO NEGRO - Preço atual: R$ ${building.preco_base}`);
          }
        });
        toast.success(`${data.length} prédio${data.length !== 1 ? 's' : ''} carregado${data.length !== 1 ? 's' : ''} com sucesso`);
      }
      
      setBuildings(data);
    } catch (err: any) {
      console.error('❌ [SIMPLE STORE] Erro ao carregar prédios:', err);
      setError(err.message || 'Erro ao carregar prédios');
      toast.error('Erro ao carregar prédios: ' + (err.message || 'Erro desconhecido'));
      setBuildings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 [SIMPLE STORE] Iniciando carregamento automático dos prédios');
    loadBuildings();
  }, []);

  return {
    buildings,
    isLoading,
    error,
    refetch: loadBuildings,
    forceRefresh: () => loadBuildings(true)
  };
};
