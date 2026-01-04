import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Department } from '@/types/processos';

export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('process_departments')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      // Get process counts for each department
      const { data: processCounts } = await supabase
        .from('processes')
        .select('department_id')
        .eq('status', 'ativo');

      const countsMap = ((processCounts || []) as any[]).reduce((acc, p) => {
        acc[p.department_id] = (acc[p.department_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const departmentsWithCounts = ((data || []) as any[]).map(dept => ({
        ...dept,
        process_count: countsMap[dept.id] || 0
      })) as Department[];

      setDepartments(departmentsWithCounts);
    } catch (err: any) {
      console.error('[useDepartments] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDepartment = async (department: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('process_departments')
        .insert(department as any)
        .select()
        .single();

      if (error) throw error;

      await fetchDepartments();
      toast.success('Departamento criado com sucesso');
      return data;
    } catch (err: any) {
      console.error('[useDepartments] Create error:', err);
      toast.error('Erro ao criar departamento');
      throw err;
    }
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    try {
      const { error } = await supabase
        .from('process_departments')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);

      if (error) throw error;

      await fetchDepartments();
      toast.success('Departamento atualizado');
    } catch (err: any) {
      console.error('[useDepartments] Update error:', err);
      toast.error('Erro ao atualizar departamento');
      throw err;
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('process_departments')
        .update({ is_active: false, updated_at: new Date().toISOString() } as any)
        .eq('id', id);

      if (error) throw error;

      await fetchDepartments();
      toast.success('Departamento removido');
    } catch (err: any) {
      console.error('[useDepartments] Delete error:', err);
      toast.error('Erro ao remover departamento');
      throw err;
    }
  };

  const getDepartmentById = (id: string) => {
    return departments.find(d => d.id === id);
  };

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return {
    departments,
    loading,
    error,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentById
  };
};
