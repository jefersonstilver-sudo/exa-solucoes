
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
    // Get the active playlist for this panel
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('*')
      .eq('panel_id', panelId)
      .eq('active', true)
      .single();
      
    if (playlistError || !playlist) {
      return null;
    }
    
    // Get videos for this playlist
    const { data: playlistVideos, error: videosError } = await supabase
      .from('playlist_videos')
      .select(`
        id,
        video_id,
        order,
        videos (
          id,
          url,
          title,
          duration
        )
      `)
      .eq('playlist_id', playlist.id)
      .order('order', { ascending: true });
      
    if (videosError) {
      console.error('Error fetching playlist videos:', videosError);
      return null;
    }
    
    // Format the videos
    const videos = (playlistVideos || []).map(pv => ({
      id: pv.video_id,
      url: pv.videos.url,
      title: pv.videos.title,
      duration: pv.videos.duration,
      order: pv.order
    }));
    
    return {
      id: playlist.id,
      panel_id: playlist.panel_id,
      videos,
      active: playlist.active,
      start_date: playlist.start_date,
      end_date: playlist.end_date
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
    await supabase
      .from('video_plays')
      .insert([
        {
          panel_id: panelId,
          video_id: videoId,
          play_duration: playDuration,
          played_at: new Date().toISOString()
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
      .from('panels')
      .update({
        status,
        last_heartbeat: new Date().toISOString(),
        details
      })
      .eq('id', panelId);
      
    // Log the status change
    await supabase
      .from('panel_logs')
      .insert([
        {
          panel_id: panelId,
          event_type: 'status_change',
          details: { status, ...details }
        }
      ]);
  } catch (error) {
    console.error('Error updating panel status:', error);
  }
};
