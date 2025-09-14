
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SindicoInteressado, SindicosStats } from '@/components/admin/sindicos-interessados/types';

export const useSindicosData = () => {
  const [sindicos, setSindicos] = useState<SindicoInteressado[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSindicos = async () => {
    try {
      const { data, error } = await supabase.rpc('get_sindicos_interessados_secure');

      if (error) {
        console.error('Erro ao buscar síndicos:', error);
        toast.error('Erro ao carregar síndicos interessados');
      } else {
        setSindicos(data || []);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro inesperado ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { data, error } = await supabase.rpc('update_sindico_status_secure', {
        p_sindico_id: id,
        p_new_status: newStatus
      });

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast.error('Erro ao atualizar status');
      } else if ((data as any)?.success) {
        toast.success('Status atualizado com sucesso');
        fetchSindicos();
      } else {
        toast.error((data as any)?.error || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro inesperado');
    }
  };

  const calculateStats = (sindicos: SindicoInteressado[]): SindicosStats => {
    return {
      total: sindicos.length,
      novos: sindicos.filter(s => s.status === 'novo').length,
      contatados: sindicos.filter(s => s.status === 'contatado').length,
      interessados: sindicos.filter(s => s.status === 'interessado').length,
      instalados: sindicos.filter(s => s.status === 'instalado').length
    };
  };

  useEffect(() => {
    fetchSindicos();
  }, []);

  return {
    sindicos,
    loading,
    fetchSindicos,
    updateStatus,
    calculateStats
  };
};
