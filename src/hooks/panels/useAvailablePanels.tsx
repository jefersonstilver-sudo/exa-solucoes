
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Panel {
  id: string;
  code: string;
  status: string;
  building_id: string | null;
  resolucao?: string;
  polegada?: string;
  orientacao?: string;
  sistema_operacional?: string;
  localizacao?: string;
  created_at: string;
}

interface UseAvailablePanelsProps {
  open: boolean;
}

export const useAvailablePanels = ({ open }: UseAvailablePanelsProps) => {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [filteredPanels, setFilteredPanels] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orientationFilter, setOrientationFilter] = useState('all');

  const fetchAvailablePanels = useCallback(async () => {
    if (!open) {
      console.log('🚫 [AVAILABLE PANELS] Dialog fechado, não buscando painéis');
      return;
    }

    setLoading(true);
    console.log('🔍 [AVAILABLE PANELS] Iniciando busca de painéis disponíveis...');

    try {
      // Verificar se o usuário está autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ [AVAILABLE PANELS] Usuário não autenticado:', userError);
        throw new Error('Usuário não autenticado');
      }

      console.log('👤 [AVAILABLE PANELS] Usuário autenticado:', user.email);

      // Buscar painéis que não estão atribuídos a nenhum prédio
      console.log('📊 [AVAILABLE PANELS] Executando query...');
      const { data, error } = await supabase
        .from('painels')
        .select('*')
        .is('building_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [AVAILABLE PANELS] Erro na consulta:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ [AVAILABLE PANELS] Query executada com sucesso');
      console.log('📊 [AVAILABLE PANELS] Painéis encontrados:', {
        total: data?.length || 0,
        painelCodes: data?.map(p => p.code) || []
      });
      
      setPanels(data || []);

      if (data && data.length > 0) {
        console.log('🔍 [AVAILABLE PANELS] Detalhes dos primeiros painéis:');
        data.slice(0, 3).forEach((panel, index) => {
          console.log(`Panel ${index + 1}:`, {
            id: panel.id,
            code: panel.code,
            status: panel.status,
            building_id: panel.building_id,
            polegada: panel.polegada,
            resolucao: panel.resolucao
          });
        });
      }

    } catch (error: any) {
      console.error('💥 [AVAILABLE PANELS] Erro crítico:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      
      let errorMessage = 'Erro ao carregar painéis disponíveis';
      if (error?.message?.includes('permission denied')) {
        errorMessage = 'Erro de permissão: Verifique se você tem acesso para visualizar painéis';
      } else if (error?.message) {
        errorMessage = `Erro ao carregar painéis: ${error.message}`;
      }
      
      toast.error(errorMessage);
      setPanels([]);
    } finally {
      setLoading(false);
      console.log('🏁 [AVAILABLE PANELS] Busca finalizada');
    }
  }, [open]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = panels;

    console.log('🔍 [AVAILABLE PANELS] Aplicando filtros:', {
      totalPanels: panels.length,
      searchTerm,
      statusFilter,
      orientationFilter
    });

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(panel =>
        panel.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        panel.localizacao?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(panel => panel.status === statusFilter);
    }

    // Filtro de orientação
    if (orientationFilter !== 'all') {
      filtered = filtered.filter(panel => panel.orientacao === orientationFilter);
    }

    console.log('📋 [AVAILABLE PANELS] Filtros aplicados:', {
      filteredCount: filtered.length,
      filteredCodes: filtered.map(p => p.code)
    });

    setFilteredPanels(filtered);
  }, [panels, searchTerm, statusFilter, orientationFilter]);

  useEffect(() => {
    fetchAvailablePanels();
  }, [fetchAvailablePanels]);

  const clearFilters = useCallback(() => {
    console.log('🧹 [AVAILABLE PANELS] Limpando filtros');
    setSearchTerm('');
    setStatusFilter('all');
    setOrientationFilter('all');
  }, []);

  return {
    panels: filteredPanels,
    allPanels: panels,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    orientationFilter,
    setOrientationFilter,
    refetch: fetchAvailablePanels,
    clearFilters
  };
};
