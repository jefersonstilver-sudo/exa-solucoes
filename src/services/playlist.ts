
import { supabase } from './supabase';

// Types
export interface PlaylistVideo {
  id: string;
  url: string;
  title: string;
  duration: number;
  order: number;
}

export interface Playlist {
  id: string;
  panel_id: string;
  videos: PlaylistVideo[];
  active: boolean;
  start_date: string;
  end_date: string;
}

/**
 * Gets the current playlist for a panel
 * @param panelId ID of the panel
 * @returns Current playlist with videos
 */
export const getPanelPlaylist = async (panelId: string): Promise<Playlist | null> => {
  try {
    // Since we don't have playlists or playlist_videos tables,
    // we'll adapt this to use the campanhas table which links panels and videos
    const { data: campanhas, error: campaignError } = await supabase
      .from('campanhas')
      .select(`
        id,
        painel_id,
        data_inicio,
        data_fim,
        status,
        videos (
          id,
          url,
          nome,
          duracao
        )
      `)
      .eq('painel_id', panelId)
      .eq('status', 'ativo')
      .order('data_inicio', { ascending: true });
      
    if (campaignError || !campanhas || campanhas.length === 0) {
      return null;
    }
    
    // Get the first active campaign
    const activeCampaign = campanhas[0];
    
    // Format the videos
    const videos: PlaylistVideo[] = [];
    
    // Add the video from the campaign if it exists
    if (activeCampaign.videos) {
      videos.push({
        id: activeCampaign.videos.id,
        url: activeCampaign.videos.url,
        title: activeCampaign.videos.nome,
        duration: activeCampaign.videos.duracao || 0,
        order: 1
      });
    }
    
    return {
      id: activeCampaign.id,
      panel_id: activeCampaign.painel_id,
      videos,
      active: activeCampaign.status === 'ativo',
      start_date: activeCampaign.data_inicio,
      end_date: activeCampaign.data_fim
    };
  } catch (error) {
    console.error('Error getting panel playlist:', error);
    return null;
  }
};

/**
 * Logs that a video was played on a panel
 * @param panelId ID of the panel
 * @param videoId ID of the video
 * @param playDuration How long the video played in seconds
 */
export const logVideoPlay = async (
  panelId: string,
  videoId: string,
  playDuration: number
): Promise<void> => {
  try {
    // Since we don't have a video_plays table, we'll log this information to painel_logs
    await supabase
      .from('painel_logs')
      .insert([
        {
          painel_id: panelId,
          status_sincronizacao: 'video_play',
          uso_cpu: playDuration, // Repurposing this field to store play duration
        }
      ]);
  } catch (error) {
    console.error('Error logging video play:', error);
  }
};

/**
 * Updates a panel's sync status
 * @param panelId ID of the panel
 * @param status Current status of the panel
 * @param details Additional details about the panel status
 */
export const updatePanelStatus = async (
  panelId: string,
  status: 'online' | 'offline' | 'maintenance',
  details: Record<string, any> = {}
): Promise<void> => {
  try {
    // Update panel status
    await supabase
      .from('painels')
      .update({
        status,
        ultima_sync: new Date().toISOString()
      })
      .eq('id', panelId);
      
    // Log the status change
    await supabase
      .from('painel_logs')
      .insert([
        {
          painel_id: panelId,
          status_sincronizacao: `status_${status}`,
          uso_cpu: details.cpuUsage,
          temperatura: details.temperature
        }
      ]);
  } catch (error) {
    console.error('Error updating panel status:', error);
  }
};
