import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ElegantPeriodType } from '@/components/admin/dashboard/ElegantPeriodButton';
import type { Json } from '@/integrations/supabase/types';

interface DashboardPreferences {
  period_filter?: ElegantPeriodType;
  save_period?: boolean;
  cards_order?: string[];
}

const DEFAULT_CARDS_ORDER = ['proposals', 'panels', 'sellers', 'contracts', 'alerts'];

export const useDashboardPreferences = () => {
  const [savedPeriod, setSavedPeriod] = useState<ElegantPeriodType | null>(null);
  const [savePeriodEnabled, setSavePeriodEnabled] = useState(false);
  const [cardsOrder, setCardsOrder] = useState<string[]>(DEFAULT_CARDS_ORDER);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session?.user?.id) {
          setLoading(false);
          return;
        }

        setUserId(session.session.user.id);

        const { data, error } = await supabase
          .from('users')
          .select('dashboard_preferences')
          .eq('id', session.session.user.id)
          .single();

        if (error) {
          console.error('Error fetching dashboard preferences:', error);
          setLoading(false);
          return;
        }

        const prefs = data?.dashboard_preferences as DashboardPreferences | null;
        if (prefs) {
          if (prefs.save_period && prefs.period_filter) {
            setSavedPeriod(prefs.period_filter);
            setSavePeriodEnabled(true);
          }
          if (prefs.cards_order && Array.isArray(prefs.cards_order)) {
            setCardsOrder(prefs.cards_order);
          }
        }
      } catch (err) {
        console.error('Error in fetchPreferences:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Save preferences to database
  const savePreferences = useCallback(async (period: ElegantPeriodType, enabled: boolean, order?: string[]) => {
    if (!userId) return;

    const prefs: DashboardPreferences = {
      period_filter: period,
      save_period: enabled,
      cards_order: order || cardsOrder
    };

    try {
      const { error } = await supabase
        .from('users')
        .update({ dashboard_preferences: prefs as Json })
        .eq('id', userId);

      if (error) {
        console.error('Error saving dashboard preferences:', error);
      }
    } catch (err) {
      console.error('Error in savePreferences:', err);
    }
  }, [userId, cardsOrder]);

  // Save cards order
  const saveCardsOrder = useCallback(async (order: string[]) => {
    if (!userId) return;
    
    setCardsOrder(order);

    const prefs: DashboardPreferences = {
      period_filter: savedPeriod || undefined,
      save_period: savePeriodEnabled,
      cards_order: order
    };

    try {
      const { error } = await supabase
        .from('users')
        .update({ dashboard_preferences: prefs as Json })
        .eq('id', userId);

      if (error) {
        console.error('Error saving cards order:', error);
      }
    } catch (err) {
      console.error('Error in saveCardsOrder:', err);
    }
  }, [userId, savedPeriod, savePeriodEnabled]);

  // Update save period enabled and persist
  const updateSavePeriodEnabled = useCallback((enabled: boolean, currentPeriod: ElegantPeriodType) => {
    setSavePeriodEnabled(enabled);
    if (enabled) {
      savePreferences(currentPeriod, true);
    } else {
      // Clear saved preference when disabled
      savePreferences(currentPeriod, false);
    }
  }, [savePreferences]);

  // Save period when changed (only if saving is enabled)
  const savePeriodPreference = useCallback((period: ElegantPeriodType) => {
    if (savePeriodEnabled) {
      setSavedPeriod(period);
      savePreferences(period, true);
    }
  }, [savePeriodEnabled, savePreferences]);

  return {
    savedPeriod,
    savePeriodEnabled,
    cardsOrder,
    loading,
    updateSavePeriodEnabled,
    savePeriodPreference,
    saveCardsOrder
  };
};
