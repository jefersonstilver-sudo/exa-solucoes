import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IncidentCategory {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
  is_default: boolean;
  sort_order: number;
}

export interface DeviceIncident {
  id: string;
  device_id: string;
  started_at: string;
  resolved_at: string | null;
  category_id: string | null;
  causa: string | null;
  resolucao: string | null;
  registrado_por: string | null;
  registrado_por_nome: string | null;
  registrado_em: string | null;
  status: 'pendente' | 'causa_registrada' | 'resolvido';
  auto_resolved: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  category?: IncidentCategory;
}

export function useIncidentCategories() {
  const [categories, setCategories] = useState<IncidentCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('incident_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = async (cat: Partial<IncidentCategory>) => {
    const { error } = await (supabase as any)
      .from('incident_categories')
      .insert([{ ...cat, sort_order: categories.length + 1 }]);
    if (error) { toast.error('Erro ao criar categoria'); throw error; }
    toast.success('Categoria criada!');
    await fetchCategories();
  };

  const updateCategory = async (id: string, updates: Partial<IncidentCategory>) => {
    const { error } = await (supabase as any)
      .from('incident_categories')
      .update(updates)
      .eq('id', id);
    if (error) { toast.error('Erro ao atualizar categoria'); throw error; }
    toast.success('Categoria atualizada!');
    await fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await (supabase as any)
      .from('incident_categories')
      .delete()
      .eq('id', id);
    if (error) { toast.error('Erro ao excluir categoria'); throw error; }
    toast.success('Categoria excluída!');
    await fetchCategories();
  };

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  return { categories, loading, fetchCategories, createCategory, updateCategory, deleteCategory };
}

export function useDeviceIncidents(deviceId: string | null) {
  const [activeIncident, setActiveIncident] = useState<DeviceIncident | null>(null);
  const [history, setHistory] = useState<DeviceIncident[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActiveIncident = useCallback(async () => {
    if (!deviceId) return;
    try {
      const { data, error } = await (supabase as any)
        .from('device_offline_incidents')
        .select('*, category:incident_categories(*)')
        .eq('device_id', deviceId)
        .in('status', ['pendente', 'causa_registrada'])
        .is('resolved_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;

      if (data) {
        setActiveIncident(data);
      } else {
        // Device offline sem incidente registrado (já estava offline antes da migration)
        // Criar incidente sob demanda
        const { data: deviceData } = await supabase
          .from('devices')
          .select('status')
          .eq('id', deviceId)
          .single();

        if (deviceData?.status === 'offline') {
          const { data: newIncident, error: insertError } = await (supabase as any)
            .from('device_offline_incidents')
            .insert([{
              device_id: deviceId,
              started_at: new Date().toISOString(),
              status: 'pendente',
            }])
            .select('*, category:incident_categories(*)')
            .single();

          if (!insertError && newIncident) {
            setActiveIncident(newIncident);
          } else {
            setActiveIncident(null);
          }
        } else {
          setActiveIncident(null);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar incidente ativo:', err);
    }
  }, [deviceId]);

  const fetchHistory = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('device_offline_incidents')
        .select('*, category:incident_categories(*)')
        .eq('device_id', deviceId)
        .order('started_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  const registerCause = async (
    incidentId: string,
    categoryId: string,
    causa: string,
    resolucao?: string
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userName = userData?.user?.user_metadata?.name || userData?.user?.email || 'Desconhecido';

      const { error } = await (supabase as any)
        .from('device_offline_incidents')
        .update({
          category_id: categoryId,
          causa,
          resolucao: resolucao || null,
          registrado_por: userData?.user?.id,
          registrado_por_nome: userName,
          registrado_em: new Date().toISOString(),
          status: 'causa_registrada',
          updated_at: new Date().toISOString(),
        })
        .eq('id', incidentId);

      if (error) throw error;
      toast.success('Causa registrada com sucesso!');
      await fetchActiveIncident();
      await fetchHistory();
    } catch (err) {
      console.error('Erro ao registrar causa:', err);
      toast.error('Erro ao registrar causa');
    }
  };

  useEffect(() => {
    if (deviceId) {
      fetchActiveIncident();
      fetchHistory();
    }
  }, [deviceId, fetchActiveIncident, fetchHistory]);

  return { activeIncident, history, loading, registerCause, fetchActiveIncident, fetchHistory };
}

/**
 * Hook leve para buscar incidentes pendentes de múltiplos devices (para badges na lista)
 */
export function usePendingIncidents(deviceIds: string[]) {
  const [pendingMap, setPendingMap] = useState<Record<string, DeviceIncident>>({});

  useEffect(() => {
    if (!deviceIds.length) return;

    const fetch = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('device_offline_incidents')
          .select('*, category:incident_categories(*)')
          .in('device_id', deviceIds)
          .in('status', ['pendente', 'causa_registrada'])
          .is('resolved_at', null);
        if (error) throw error;

        const map: Record<string, DeviceIncident> = {};
        (data || []).forEach((inc: DeviceIncident) => {
          map[inc.device_id] = inc;
        });
        setPendingMap(map);
      } catch (err) {
        console.error('Erro ao buscar incidentes pendentes:', err);
      }
    };

    fetch();
  }, [deviceIds.join(',')]);

  return pendingMap;
}
