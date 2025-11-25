import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface NotificationPreferences {
  panel_alerts_enabled: boolean;
  panel_alerts_sound: boolean;
  panel_alerts_volume: number;
}

export const useNotificationPreferences = () => {
  const { user, isLoggedIn } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    panel_alerts_enabled: true,
    panel_alerts_sound: true,
    panel_alerts_volume: 0.5,
  });
  const [loading, setLoading] = useState(true);

  // Carregar preferências
  useEffect(() => {
    if (!isLoggedIn || !user) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar preferências:', error);
      }

      if (data) {
        setPreferences({
          panel_alerts_enabled: data.panel_alerts_enabled,
          panel_alerts_sound: data.panel_alerts_sound,
          panel_alerts_volume: data.panel_alerts_volume,
        });
      }
      
      setLoading(false);
    };

    loadPreferences();
  }, [user, isLoggedIn]);

  // Salvar preferências
  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) return;

    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        panel_alerts_enabled: updatedPreferences.panel_alerts_enabled,
        panel_alerts_sound: updatedPreferences.panel_alerts_sound,
        panel_alerts_volume: updatedPreferences.panel_alerts_volume,
      });

    if (error) {
      console.error('Erro ao salvar preferências:', error);
    }
  };

  return {
    preferences,
    loading,
    updatePreferences,
  };
};
