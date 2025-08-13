
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BuildingInfo {
  id: string;
  nome: string;
}

export const useBuildingNames = (listaPaineis: string[], listaPredios?: string[]) => {
  const [buildingNames, setBuildingNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Cache local para evitar recarregamentos desnecessários
  const [cachedData, setCachedData] = useState<{[key: string]: string[]}>({});

  const createCacheKey = useCallback(() => {
    const prediosKey = listaPredios?.sort().join(',') || '';
    const paineisKey = listaPaineis?.sort().join(',') || '';
    return `predios:${prediosKey}|paineis:${paineisKey}`;
  }, [listaPredios, listaPaineis]);

  const fetchBuildingNames = useCallback(async (isRetry = false) => {
    const cacheKey = createCacheKey();
    
    console.log('🔍 [BUILDING_NAMES] Iniciando busca', {
      paineis: listaPaineis,
      predios: listaPredios,
      isRetry,
      retryCount,
      cacheKey
    });

    // Verificar cache primeiro
    if (!isRetry && cachedData[cacheKey]) {
      console.log('💾 [BUILDING_NAMES] Usando dados do cache:', cachedData[cacheKey]);
      setBuildingNames(cachedData[cacheKey]);
      setLoading(false);
      return;
    }
    
    // Priorizar lista_predios se disponível
    if (listaPredios && listaPredios.length > 0) {
      console.log('📍 [BUILDING_NAMES] Usando lista_predios (nova coluna)');
      
      try {
        setLoading(true);
        setError(null);

        console.log('🔗 [BUILDING_NAMES] Tentando conectar ao Supabase...');
        
        const { data: buildings, error: buildingsError } = await supabase
          .from('buildings')
          .select('id, nome')
          .in('id', listaPredios);

        console.log('📊 [BUILDING_NAMES] Resposta do Supabase:', {
          data: buildings,
          error: buildingsError,
          prediosConsultados: listaPredios
        });

        if (buildingsError) {
          console.error('❌ [BUILDING_NAMES] Erro ao buscar prédios:', {
            error: buildingsError,
            message: buildingsError.message,
            code: buildingsError.code,
            details: buildingsError.details
          });
          throw buildingsError;
        }

        console.log('🏢 [BUILDING_NAMES] Prédios encontrados via lista_predios:', buildings);

        if (!buildings || buildings.length === 0) {
          console.warn('⚠️ [BUILDING_NAMES] Nenhum prédio encontrado para os IDs:', listaPredios);
          const fallbackNames = ['Prédios não encontrados no sistema'];
          setBuildingNames(fallbackNames);
          setCachedData(prev => ({ ...prev, [cacheKey]: fallbackNames }));
          setLoading(false);
          return;
        }

        const names = buildings.map(b => b.nome || 'Nome não disponível');
        console.log('📝 [BUILDING_NAMES] Nomes finais dos prédios:', names);
        
        setBuildingNames(names);
        setCachedData(prev => ({ ...prev, [cacheKey]: names }));
        setLoading(false);
        setRetryCount(0); // Reset retry count on success
        return;
      } catch (error) {
        console.error('💥 [BUILDING_NAMES] Erro ao buscar via lista_predios:', {
          error,
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          predios: listaPredios,
          retryCount
        });
        
        // Tentar novamente se for a primeira tentativa
        if (!isRetry && retryCount < 2) {
          console.log('🔄 [BUILDING_NAMES] Tentando novamente em 2 segundos...');
          setRetryCount(prev => prev + 1);
          setTimeout(() => fetchBuildingNames(true), 2000);
          return;
        }
        
        // Continuar com fallback para lista_paineis se todas as tentativas falharam
        console.log('🔄 [BUILDING_NAMES] Tentativas esgotadas, usando fallback para painéis');
      }
    }

    // Fallback para lista_paineis (método antigo)
    if (!listaPaineis || listaPaineis.length === 0) {
      console.log('⚠️ [BUILDING_NAMES] Nenhuma lista disponível, retornando estado vazio');
      setBuildingNames([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📡 [BUILDING_NAMES] Fallback: buscando painéis pelos IDs:', listaPaineis);

      // Buscar painéis pelos IDs
      const { data: painels, error: painelsError } = await supabase
        .from('painels')
        .select('building_id')
        .in('id', listaPaineis);

      console.log('📊 [BUILDING_NAMES] Resposta painéis:', {
        data: painels,
        error: painelsError,
        paineisConsultados: listaPaineis
      });

      if (painelsError) {
        console.error('❌ [BUILDING_NAMES] Erro ao buscar painéis:', {
          error: painelsError,
          message: painelsError.message,
          code: painelsError.code
        });
        throw painelsError;
      }

      console.log('✅ [BUILDING_NAMES] Painéis encontrados:', painels);

      if (!painels || painels.length === 0) {
        console.log('⚠️ [BUILDING_NAMES] Nenhum painel encontrado no banco');
        const fallbackNames = ['Painéis não encontrados no sistema'];
        setBuildingNames(fallbackNames);
        setCachedData(prev => ({ ...prev, [cacheKey]: fallbackNames }));
        setLoading(false);
        return;
      }

      // Extrair building_ids únicos
      const buildingIds = [...new Set(painels.map(p => p.building_id).filter(Boolean))];
      console.log('🏢 [BUILDING_NAMES] IDs dos prédios únicos:', buildingIds);

      if (buildingIds.length === 0) {
        console.log('⚠️ [BUILDING_NAMES] Nenhum prédio vinculado aos painéis');
        const fallbackNames = ['Prédios não vinculados aos painéis'];
        setBuildingNames(fallbackNames);
        setCachedData(prev => ({ ...prev, [cacheKey]: fallbackNames }));
        setLoading(false);
        return;
      }

      // Buscar nomes dos prédios
      const { data: buildings, error: buildingsError } = await supabase
        .from('buildings')
        .select('id, nome')
        .in('id', buildingIds);

      console.log('📊 [BUILDING_NAMES] Resposta prédios (fallback):', {
        data: buildings,
        error: buildingsError,
        buildingIds
      });

      if (buildingsError) {
        console.error('❌ [BUILDING_NAMES] Erro ao buscar prédios:', buildingsError);
        throw buildingsError;
      }

      console.log('🏢 [BUILDING_NAMES] Prédios encontrados:', buildings);

      const names = buildings?.map(b => b.nome || 'Nome não disponível') || ['Nomes dos prédios não encontrados'];
      console.log('📝 [BUILDING_NAMES] Nomes finais dos prédios:', names);
      
      setBuildingNames(names);
      setCachedData(prev => ({ ...prev, [cacheKey]: names }));
      setRetryCount(0); // Reset retry count on success

    } catch (error) {
      console.error('💥 [BUILDING_NAMES] Erro geral ao buscar nomes dos prédios:', {
        error,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        retryCount,
        isRetry
      });
      
      // Tentar novamente se for a primeira tentativa
      if (!isRetry && retryCount < 2) {
        console.log('🔄 [BUILDING_NAMES] Tentando novamente em 3 segundos...');
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchBuildingNames(true), 3000);
        return;
      }
      
      setError(`Erro ao carregar informações dos locais (tentativa ${retryCount + 1})`);
      setBuildingNames(['Erro ao carregar locais']);
    } finally {
      setLoading(false);
    }
  }, [listaPaineis, listaPredios, retryCount, cachedData, createCacheKey]);

  useEffect(() => {
    fetchBuildingNames();
  }, [fetchBuildingNames]);

  return { buildingNames, loading, error };
};
