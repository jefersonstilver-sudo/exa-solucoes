import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Process, ProcessStatus } from '@/types/processos';

interface UseProcessesOptions {
  departmentId?: string;
  status?: ProcessStatus;
}

export const useProcesses = (options: UseProcessesOptions = {}) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProcesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('processes')
        .select(`
          *,
          department:process_departments(id, name, color, icon)
        `)
        .order('code', { ascending: true });

      if (options.departmentId) {
        query = query.eq('department_id', options.departmentId);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setProcesses((data || []) as any as Process[]);
    } catch (err: any) {
      console.error('[useProcesses] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [options.departmentId, options.status]);

  const generateCode = async (departmentName: string): Promise<string> => {
    const prefix: Record<string, string> = {
      'Vendas': 'VEN',
      'Marketing': 'MKT',
      'Operação': 'OPE',
      'Atendimento': 'ATE',
      'Tecnologia': 'TEC',
      'Financeiro': 'FIN',
      'Expansão': 'EXP',
      'IA & Automação': 'IAA',
      'Administrativo': 'ADM',
    };
    
    const codePrefix = prefix[departmentName] || 'GEN';

    // Get the highest existing code number for this prefix
    const { data } = await supabase
      .from('processes')
      .select('code')
      .like('code', `${codePrefix}-%`)
      .order('code', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastCode = (data[0] as any).code;
      const lastNumber = parseInt(lastCode.split('-')[1], 10);
      nextNumber = lastNumber + 1;
    }

    return `${codePrefix}-${String(nextNumber).padStart(2, '0')}`;
  };

  const createProcess = async (process: {
    department_id: string;
    name: string;
    description?: string;
    owner_id?: string;
    secondary_owners?: string[];
    tags?: string[];
  }) => {
    try {
      // Get department name for code generation
      const { data: dept } = await supabase
        .from('process_departments')
        .select('name')
        .eq('id', process.department_id)
        .single();

      const code = await generateCode((dept as any)?.name || '');

      const { data, error } = await supabase
        .from('processes')
        .insert({
          ...process,
          code,
          status: 'ativo',
          current_version: 1,
          secondary_owners: process.secondary_owners || [],
          tags: process.tags || [],
          metadata: {}
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Create initial version
      await supabase
        .from('process_versions')
        .insert({
          process_id: (data as any).id,
          version: 1,
          nodes_data: [],
          edges_data: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          changelog: 'Versão inicial'
        } as any);

      await fetchProcesses();
      toast.success('Processo criado com sucesso');
      return data;
    } catch (err: any) {
      console.error('[useProcesses] Create error:', err);
      toast.error('Erro ao criar processo');
      throw err;
    }
  };

  const updateProcess = async (id: string, updates: Partial<Process>) => {
    try {
      const { error } = await supabase
        .from('processes')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);

      if (error) throw error;

      await fetchProcesses();
      toast.success('Processo atualizado');
    } catch (err: any) {
      console.error('[useProcesses] Update error:', err);
      toast.error('Erro ao atualizar processo');
      throw err;
    }
  };

  const deleteProcess = async (id: string) => {
    try {
      const { error } = await supabase
        .from('processes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchProcesses();
      toast.success('Processo removido');
    } catch (err: any) {
      console.error('[useProcesses] Delete error:', err);
      toast.error('Erro ao remover processo');
      throw err;
    }
  };

  const getProcessById = async (id: string): Promise<Process | null> => {
    try {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          *,
          department:process_departments(id, name, color, icon)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as any as Process;
    } catch (err: any) {
      console.error('[useProcesses] GetById error:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  return {
    processes,
    loading,
    error,
    fetchProcesses,
    createProcess,
    updateProcess,
    deleteProcess,
    getProcessById,
    generateCode
  };
};
