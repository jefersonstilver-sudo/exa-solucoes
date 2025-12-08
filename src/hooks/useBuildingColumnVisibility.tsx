import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BuildingColumn {
  key: string;
  label: string;
  category: 'basic' | 'contact' | 'notion' | 'metrics' | 'status';
  defaultVisible: boolean;
}

// All available building columns mapped from Notion + EXA
export const ALL_BUILDING_COLUMNS: BuildingColumn[] = [
  // Basic info
  { key: 'nome', label: 'Nome do Prédio', category: 'basic', defaultVisible: true },
  { key: 'endereco', label: 'Endereço', category: 'basic', defaultVisible: true },
  { key: 'bairro', label: 'Bairro', category: 'basic', defaultVisible: true },
  { key: 'numero_andares', label: 'Nº Andares', category: 'basic', defaultVisible: true },
  { key: 'numero_blocos', label: 'Nº Blocos', category: 'basic', defaultVisible: false },
  { key: 'numero_unidades', label: 'Unidades', category: 'basic', defaultVisible: true },
  { key: 'numero_elevadores', label: 'Elevadores Sociais', category: 'basic', defaultVisible: true },
  
  // Status
  { key: 'status', label: 'Status EXA', category: 'status', defaultVisible: true },
  { key: 'notion_status', label: 'Status Notion', category: 'status', defaultVisible: true },
  { key: 'notion_tipo', label: 'Tipo', category: 'status', defaultVisible: true },
  { key: 'notion_portaria', label: 'Portaria?', category: 'status', defaultVisible: false },
  { key: 'notion_internet', label: 'Internet', category: 'status', defaultVisible: false },
  
  // Metrics
  { key: 'publico_estimado', label: 'Público Aprox.', category: 'metrics', defaultVisible: true },
  { key: 'visualizacoes_mes', label: 'Visualizações/Mês', category: 'metrics', defaultVisible: false },
  { key: 'quantidade_telas', label: 'Qtd Telas', category: 'metrics', defaultVisible: true },
  
  // Contact
  { key: 'contato_sindico', label: 'Contato Síndico', category: 'contact', defaultVisible: false },
  { key: 'notion_email', label: 'E-mail', category: 'contact', defaultVisible: false },
  { key: 'notion_whatsapp_url', label: 'WhatsApp', category: 'contact', defaultVisible: false },
  
  // Notion specific
  { key: 'notion_oti', label: 'O.T.I', category: 'notion', defaultVisible: false },
  { key: 'notion_contrato_url', label: 'Contrato', category: 'notion', defaultVisible: false },
  { key: 'notion_fotos', label: 'Fotos', category: 'notion', defaultVisible: false },
  { key: 'notion_termo_aceite', label: 'Termo de Aceite', category: 'notion', defaultVisible: false },
  { key: 'notion_instalado', label: 'Data Instalado', category: 'notion', defaultVisible: false },
  { key: 'notion_data_trabalho', label: 'Data Trabalho', category: 'notion', defaultVisible: false },
  { key: 'notion_out_date', label: 'Out 2025', category: 'notion', defaultVisible: false },
  { key: 'notion_internal_id', label: 'ID Notion', category: 'notion', defaultVisible: false },
];

interface ColumnVisibility {
  column_key: string;
  is_visible: boolean;
  display_order: number;
}

export function useBuildingColumnVisibility() {
  const { user } = useAuth();
  const [visibilityMap, setVisibilityMap] = useState<Map<string, ColumnVisibility>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user's column visibility preferences
  const loadVisibility = useCallback(async () => {
    if (!user?.id) {
      // Use defaults if not logged in
      const defaultMap = new Map<string, ColumnVisibility>();
      ALL_BUILDING_COLUMNS.forEach((col, index) => {
        defaultMap.set(col.key, {
          column_key: col.key,
          is_visible: col.defaultVisible,
          display_order: index,
        });
      });
      setVisibilityMap(defaultMap);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('building_column_visibility')
        .select('column_key, is_visible, display_order')
        .eq('user_id', user.id);

      if (error) throw error;

      const newMap = new Map<string, ColumnVisibility>();
      
      // First, set defaults for all columns
      ALL_BUILDING_COLUMNS.forEach((col, index) => {
        newMap.set(col.key, {
          column_key: col.key,
          is_visible: col.defaultVisible,
          display_order: index,
        });
      });

      // Then override with user preferences
      data?.forEach((pref) => {
        newMap.set(pref.column_key, pref);
      });

      setVisibilityMap(newMap);
    } catch (error) {
      console.error('Error loading column visibility:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadVisibility();
  }, [loadVisibility]);

  // Toggle column visibility
  const toggleColumn = useCallback(async (columnKey: string) => {
    if (!user?.id) return;

    const current = visibilityMap.get(columnKey);
    const newVisibility = !current?.is_visible;

    // Optimistic update
    setVisibilityMap(prev => {
      const newMap = new Map(prev);
      newMap.set(columnKey, {
        column_key: columnKey,
        is_visible: newVisibility,
        display_order: current?.display_order ?? 0,
      });
      return newMap;
    });

    // Save to database
    try {
      const { error } = await supabase
        .from('building_column_visibility')
        .upsert({
          user_id: user.id,
          column_key: columnKey,
          is_visible: newVisibility,
          display_order: current?.display_order ?? 0,
        }, {
          onConflict: 'user_id,column_key'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving column visibility:', error);
      // Revert on error
      loadVisibility();
    }
  }, [user?.id, visibilityMap, loadVisibility]);

  // Show all columns
  const showAll = useCallback(async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      const updates = ALL_BUILDING_COLUMNS.map((col, index) => ({
        user_id: user.id,
        column_key: col.key,
        is_visible: true,
        display_order: index,
      }));

      const { error } = await supabase
        .from('building_column_visibility')
        .upsert(updates, { onConflict: 'user_id,column_key' });

      if (error) throw error;

      await loadVisibility();
    } catch (error) {
      console.error('Error showing all columns:', error);
    } finally {
      setSaving(false);
    }
  }, [user?.id, loadVisibility]);

  // Hide all columns (except nome which is always visible)
  const hideAll = useCallback(async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      const updates = ALL_BUILDING_COLUMNS.map((col, index) => ({
        user_id: user.id,
        column_key: col.key,
        is_visible: col.key === 'nome', // Keep nome always visible
        display_order: index,
      }));

      const { error } = await supabase
        .from('building_column_visibility')
        .upsert(updates, { onConflict: 'user_id,column_key' });

      if (error) throw error;

      await loadVisibility();
    } catch (error) {
      console.error('Error hiding all columns:', error);
    } finally {
      setSaving(false);
    }
  }, [user?.id, loadVisibility]);

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      // Delete all user preferences
      const { error: deleteError } = await supabase
        .from('building_column_visibility')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      await loadVisibility();
    } catch (error) {
      console.error('Error resetting to defaults:', error);
    } finally {
      setSaving(false);
    }
  }, [user?.id, loadVisibility]);

  // Get visible columns in order
  const getVisibleColumns = useCallback(() => {
    return ALL_BUILDING_COLUMNS
      .filter(col => visibilityMap.get(col.key)?.is_visible !== false)
      .sort((a, b) => {
        const orderA = visibilityMap.get(a.key)?.display_order ?? 0;
        const orderB = visibilityMap.get(b.key)?.display_order ?? 0;
        return orderA - orderB;
      });
  }, [visibilityMap]);

  // Check if column is visible
  const isColumnVisible = useCallback((columnKey: string) => {
    return visibilityMap.get(columnKey)?.is_visible !== false;
  }, [visibilityMap]);

  return {
    columns: ALL_BUILDING_COLUMNS,
    visibilityMap,
    loading,
    saving,
    toggleColumn,
    showAll,
    hideAll,
    resetToDefaults,
    getVisibleColumns,
    isColumnVisible,
  };
}
