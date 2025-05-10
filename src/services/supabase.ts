
// Using the supabase client from the project
import { supabase as supabaseClient } from '@/integrations/supabase/client';

// Re-export the supabase client
export const supabase = supabaseClient;

// Type definitions
export interface Campaign {
  id: string;
  title: string;
  description: string;
  client_id: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export interface Video {
  id: string;
  campaign_id: string;
  url: string;
  title: string;
  duration: number;
  created_at: string;
}

export interface Panel {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  last_heartbeat: string;
}

export interface PanelLog {
  id: string;
  panel_id: string;
  event_type: string;
  details: Record<string, any>;
  created_at: string;
}

// Helper functions for Supabase operations

/**
 * Fetches campaigns for a specific client
 */
export const getClientCampaigns = async (clientId: string) => {
  const { data, error } = await supabase
    .from('campanhas')
    .select('*')
    .eq('client_id', clientId);
    
  if (error) throw error;
  return data || [];
};

/**
 * Fetches videos for a specific campaign
 */
export const getCampaignVideos = async (campaignId: string) => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('client_id', campaignId);
    
  if (error) throw error;
  return data || [];
};

/**
 * Logs panel events
 */
export const logPanelEvent = async (
  panelId: string,
  eventType: string,
  details: Record<string, any>
): Promise<void> => {
  const { error } = await supabase
    .from('painel_logs')
    .insert([
      {
        painel_id: panelId,
        status_sincronizacao: eventType,
        uso_cpu: details.cpuUsage,
        temperatura: details.temperature
      }
    ]);
    
  if (error) throw error;
};

/**
 * Logs user actions for audit trail
 */
export const logUserAction = async (
  userId: string,
  action: string,
  details: Record<string, any>
): Promise<void> => {
  const { error } = await supabase
    .from('webhook_logs')
    .insert([
      {
        origem: 'user_action',
        status: 'success',
        payload: {
          user_id: userId,
          action,
          details
        }
      }
    ]);
    
  if (error) throw error;
};
