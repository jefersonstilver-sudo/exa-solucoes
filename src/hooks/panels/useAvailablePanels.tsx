
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
    if (!open) return;

    setLoading(true);
    try {
      console.log('🔍 [AVAILABLE PANELS] Buscando painéis disponíveis...');

      const { data, error } = await supabase
        .from('painels')
        .select('*')
        .is('building_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('✅ [AVAILABLE PANELS] Painéis encontrados:', data?.length || 0);
      setPanels(data || []);
    } catch (error) {
      console.error('💥 [AVAILABLE PANELS] Erro ao buscar painéis:', error);
      toast.error('Erro ao carregar painéis disponíveis');
      setPanels([]);
    } finally {
      setLoading(false);
    }
  }, [open]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = panels;

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

    setFilteredPanels(filtered);
  }, [panels, searchTerm, statusFilter, orientationFilter]);

  useEffect(() => {
    fetchAvailablePanels();
  }, [fetchAvailablePanels]);

  const clearFilters = useCallback(() => {
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
