import { useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlaybackEntry {
  video_id: string;
  building_id: string;
  pedido_id?: string;
  duration_seconds: number;
  started_at: string;
}

const FLUSH_INTERVAL_MS = 30 * 1000; // 30 seconds
const DELTA_INTERVAL_MS = 30 * 1000; // send incremental delta every 30s

export const usePlaybackLogger = (buildingId: string) => {
  const bufferRef = useRef<PlaybackEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deltaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoStartRef = useRef<number | null>(null);
  const lastDeltaSentRef = useRef<number | null>(null);
  const currentVideoRef = useRef<{ video_id: string; pedido_id?: string } | null>(null);

  const flushBuffer = useCallback(async () => {
    if (bufferRef.current.length === 0) return;

    const logsToSend = [...bufferRef.current];
    bufferRef.current = [];

    try {
      const { error } = await supabase.functions.invoke('log-video-playback', {
        body: { logs: logsToSend },
      });

      if (error) {
        console.error('[PlaybackLogger] Flush failed, re-queuing:', error);
        bufferRef.current = [...logsToSend, ...bufferRef.current];
      }
    } catch (err) {
      console.error('[PlaybackLogger] Network error, re-queuing');
      bufferRef.current = [...logsToSend, ...bufferRef.current];
    }
  }, []);

  // Push a delta entry for the currently playing video
  const pushDelta = useCallback(() => {
    if (!videoStartRef.current || !currentVideoRef.current || !buildingId) return;

    const now = Date.now();
    const fromTime = lastDeltaSentRef.current || videoStartRef.current;
    const deltaSeconds = Math.round((now - fromTime) / 1000);

    if (deltaSeconds < 1) return;

    const entry: PlaybackEntry = {
      video_id: currentVideoRef.current.video_id,
      building_id: buildingId,
      pedido_id: currentVideoRef.current.pedido_id,
      duration_seconds: deltaSeconds,
      started_at: new Date(fromTime).toISOString(),
    };

    bufferRef.current.push(entry);
    lastDeltaSentRef.current = now;
  }, [buildingId]);

  // Flush periodic buffer
  useEffect(() => {
    timerRef.current = setInterval(flushBuffer, FLUSH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [flushBuffer]);

  // Send incremental deltas every 30s while a video is playing
  useEffect(() => {
    deltaTimerRef.current = setInterval(() => {
      pushDelta();
      flushBuffer();
    }, DELTA_INTERVAL_MS);
    return () => {
      if (deltaTimerRef.current) clearInterval(deltaTimerRef.current);
    };
  }, [pushDelta, flushBuffer]);

  // Flush on visibilitychange and pagehide
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pushDelta();
        // Use sendBeacon-style fire-and-forget
        if (bufferRef.current.length > 0) {
          const logs = [...bufferRef.current];
          bufferRef.current = [];
          supabase.functions.invoke('log-video-playback', { body: { logs } }).catch(() => {});
        }
      }
    };

    const handlePageHide = () => {
      pushDelta();
      if (bufferRef.current.length > 0) {
        const logs = [...bufferRef.current];
        bufferRef.current = [];
        supabase.functions.invoke('log-video-playback', { body: { logs } }).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [pushDelta]);

  // Unmount: flush remaining
  useEffect(() => {
    return () => {
      pushDelta();
      if (bufferRef.current.length > 0) {
        const logs = [...bufferRef.current];
        bufferRef.current = [];
        supabase.functions.invoke('log-video-playback', { body: { logs } }).catch(() => {});
      }
    };
  }, [pushDelta]);

  const onVideoStart = useCallback((videoId: string, pedidoId?: string) => {
    // Flush previous video's remaining time
    if (videoStartRef.current && currentVideoRef.current) {
      pushDelta();
      flushBuffer();
    }

    videoStartRef.current = Date.now();
    lastDeltaSentRef.current = null;
    currentVideoRef.current = { video_id: videoId, pedido_id: pedidoId };
  }, [pushDelta, flushBuffer]);

  const onVideoEnd = useCallback(() => {
    if (!videoStartRef.current || !currentVideoRef.current || !buildingId) return;

    pushDelta();
    
    videoStartRef.current = null;
    lastDeltaSentRef.current = null;
    currentVideoRef.current = null;

    flushBuffer();
  }, [buildingId, pushDelta, flushBuffer]);

  return { onVideoStart, onVideoEnd };
};
