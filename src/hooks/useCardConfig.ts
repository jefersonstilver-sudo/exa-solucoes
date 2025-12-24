import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CardConfigValue {
  value: number;
}

export const useCardConfig = (configKey: string, defaultValue: number = 3) => {
  const [value, setValue] = useState<number>(defaultValue);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exa_alerts_config')
        .select('config_value')
        .eq('config_key', configKey)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error(`[useCardConfig] Error fetching ${configKey}:`, error);
        return;
      }

      if (data?.config_value) {
        const parsed = data.config_value as unknown as CardConfigValue;
        setValue(parsed?.value ?? defaultValue);
      }
    } catch (err) {
      console.error(`[useCardConfig] Error:`, err);
    } finally {
      setLoading(false);
    }
  }, [configKey, defaultValue]);

  const updateValue = useCallback(async (newValue: number) => {
    try {
      const { error } = await supabase
        .from('exa_alerts_config')
        .upsert({
          config_key: configKey,
          config_value: { value: newValue },
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'config_key'
        });

      if (error) {
        console.error(`[useCardConfig] Error updating ${configKey}:`, error);
        return false;
      }

      setValue(newValue);
      return true;
    } catch (err) {
      console.error(`[useCardConfig] Error:`, err);
      return false;
    }
  }, [configKey]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { value, loading, updateValue, refetch: fetchConfig };
};
