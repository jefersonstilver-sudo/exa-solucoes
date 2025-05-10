
// Using the supabase client from the project
import { supabase as supabaseClient } from '@/integrations/supabase/client';
import { GetPanelsByLocationResponse, Panel } from '@/types/panel';

// Re-export the supabase client
export const supabase = supabaseClient;

// Type definitions
export interface Campaign {
  id: string;
  client_id: string;
  video_id: string;
  painel_id: string;
  data_inicio: string;
  data_fim: string;
  status: 'pendente' | 'ativo' | 'finalizado' | 'cancelado';
  obs?: string;
  created_at: string;
}

export interface Video {
  id: string;
  client_id: string;
  url: string;
  nome: string;
  duracao: number;
  created_at: string;
}

// We're not redefining Panel here since we're importing it from types/panel.ts

export interface PanelLog {
  id: string;
  painel_id: string;
  status_sincronizacao: string;
  uso_cpu?: number;
  temperatura?: number;
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
    .insert({
      painel_id: panelId,
      status_sincronizacao: eventType,
      uso_cpu: details.cpuUsage,
      temperatura: details.temperature
    });
    
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
    .insert({
      origem: 'user_action',
      status: 'success',
      payload: {
        user_id: userId,
        action,
        details
      }
    });
    
  if (error) throw error;
};

/**
 * Fetches panels near a specific location
 */
export const getPanelsByLocation = async (
  lat: number,
  lng: number,
  radiusMeters: number = 5000
) => {
  // Use our custom RPC function that uses PostGIS
  const { data, error } = await supabase.rpc('get_panels_by_location', {
    lat,
    lng, 
    radius_meters: radiusMeters
  });
  
  if (error) throw error;
  return data as Panel[];
};

/**
 * Adds an item to the cart
 */
export const addToCart = async (
  userId: string,
  panelId: string,
  duration: number
) => {
  const { data, error } = await supabase
    .from('pedidos')
    .insert({
      client_id: userId,
      lista_paineis: [panelId],
      duracao: duration,
      valor_total: 0, // This would be calculated by the server
      status: 'pendente'
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};
