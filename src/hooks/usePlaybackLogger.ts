import { useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlaybackEntry {
  video_id: string;
  building_id: string;
  pedido_id?: string;
  duration_seconds: number;
  started_at: string;
}

const BATCH_INTERVAL_MS = 30 * 1000; // 30 seconds - flush frequently for real-time reporting
const MAX_BUFFER_SIZE = 10;

export const usePlaybackLogger = (buildingId: string) => {
  const bufferRef = useRef<PlaybackEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoStartRef = useRef<number | null>(null);
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

  // Start 5-minute interval
  useEffect(() => {
    timerRef.current = setInterval(flushBuffer, BATCH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // Attempt final flush on unmount
      if (bufferRef.current.length > 0) {
        const logs = [...bufferRef.current];
        bufferRef.current = [];
        // Fire and forget
        supabase.functions.invoke('log-video-playback', { body: { logs } }).catch(() => {});
      }
    };
  }, [flushBuffer]);

  const onVideoStart = useCallback((videoId: string, pedidoId?: string) => {
    videoStartRef.current = Date.now();
    currentVideoRef.current = { video_id: videoId, pedido_id: pedidoId };
  }, []);

  const onVideoEnd = useCallback(() => {
    if (!videoStartRef.current || !currentVideoRef.current || !buildingId) return;

    const durationMs = Date.now() - videoStartRef.current;
    const durationSeconds = Math.round(durationMs / 1000);

    if (durationSeconds < 1) return; // Skip negligible playbacks

    bufferRef.current.push({
      video_id: currentVideoRef.current.video_id,
      building_id: buildingId,
      pedido_id: currentVideoRef.current.pedido_id,
      duration_seconds: durationSeconds,
      started_at: new Date(videoStartRef.current).toISOString(),
    });

    videoStartRef.current = null;
    currentVideoRef.current = null;

    // Auto-flush if buffer is full
    if (bufferRef.current.length >= MAX_BUFFER_SIZE) {
      flushBuffer();
    }
  }, [buildingId, flushBuffer]);

  return { onVideoStart, onVideoEnd };
};
