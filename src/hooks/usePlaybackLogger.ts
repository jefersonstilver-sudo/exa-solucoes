import { useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlaybackEntry {
  video_id: string;
  building_id: string;
  pedido_id?: string;
  duration_seconds: number;
  started_at: string;
}

const FLUSH_INTERVAL_MS = 30 * 1000;
const DELTA_INTERVAL_MS = 30 * 1000;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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

    console.log('[PlaybackLogger] 📤 Flushing', logsToSend.length, 'logs:', logsToSend);

    try {
      const { error } = await supabase.functions.invoke('log-video-playback', {
        body: { logs: logsToSend },
      });

      if (error) {
        console.error('[PlaybackLogger] ❌ Flush failed:', error);
        bufferRef.current = [...logsToSend, ...bufferRef.current];
      } else {
        console.log('[PlaybackLogger] ✅ Flush OK —', logsToSend.length, 'logs enviados');
      }
    } catch (err) {
      console.error('[PlaybackLogger] ❌ Network error on flush:', err);
      bufferRef.current = [...logsToSend, ...bufferRef.current];
    }
  }, []);

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

    console.log('[PlaybackLogger] 📊 Delta entry:', deltaSeconds, 's for video', currentVideoRef.current.video_id);
    bufferRef.current.push(entry);
    lastDeltaSentRef.current = now;
  }, [buildingId]);

  // Send logs via sendBeacon (more reliable on page hide/unload)
  const flushViaSendBeacon = useCallback(() => {
    if (bufferRef.current.length === 0) return;
    
    const logs = [...bufferRef.current];
    bufferRef.current = [];

    const url = `${SUPABASE_URL}/functions/v1/log-video-playback`;
    const body = JSON.stringify({ logs });
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    };

    // Try sendBeacon first (most reliable on page exit)
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const sent = navigator.sendBeacon(url, blob);
      console.log('[PlaybackLogger] 🔔 sendBeacon:', sent ? 'OK' : 'FAILED', '—', logs.length, 'logs');
      if (!sent) {
        // Fallback to fetch keepalive
        fetch(url, { method: 'POST', body, headers, keepalive: true }).catch(err => {
          console.error('[PlaybackLogger] ❌ Fallback fetch failed:', err);
        });
      }
    } else {
      fetch(url, { method: 'POST', body, headers, keepalive: true }).catch(err => {
        console.error('[PlaybackLogger] ❌ Fetch keepalive failed:', err);
      });
    }
  }, []);

  // Flush periodic buffer
  useEffect(() => {
    timerRef.current = setInterval(flushBuffer, FLUSH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [flushBuffer]);

  // Send incremental deltas every 30s
  useEffect(() => {
    deltaTimerRef.current = setInterval(() => {
      pushDelta();
      flushBuffer();
    }, DELTA_INTERVAL_MS);
    return () => {
      if (deltaTimerRef.current) clearInterval(deltaTimerRef.current);
    };
  }, [pushDelta, flushBuffer]);

  // Flush on visibilitychange and pagehide via sendBeacon
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pushDelta();
        flushViaSendBeacon();
      }
    };

    const handlePageHide = () => {
      pushDelta();
      flushViaSendBeacon();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [pushDelta, flushViaSendBeacon]);

  // Unmount: flush remaining
  useEffect(() => {
    return () => {
      pushDelta();
      flushViaSendBeacon();
    };
  }, [pushDelta, flushViaSendBeacon]);

  const onVideoStart = useCallback((videoId: string, pedidoId?: string) => {
    console.log('[PlaybackLogger] 🎬 onVideoStart:', videoId, 'pedido:', pedidoId, 'building:', buildingId);
    
    // Flush previous video's remaining time
    if (videoStartRef.current && currentVideoRef.current) {
      pushDelta();
      flushBuffer();
    }

    videoStartRef.current = Date.now();
    lastDeltaSentRef.current = null;
    currentVideoRef.current = { video_id: videoId, pedido_id: pedidoId };
  }, [pushDelta, flushBuffer, buildingId]);

  const onVideoEnd = useCallback(() => {
    if (!videoStartRef.current || !currentVideoRef.current || !buildingId) return;

    console.log('[PlaybackLogger] 🛑 onVideoEnd:', currentVideoRef.current.video_id);

    // Push delta BEFORE clearing refs
    pushDelta();
    
    videoStartRef.current = null;
    lastDeltaSentRef.current = null;
    currentVideoRef.current = null;

    flushBuffer();
  }, [buildingId, pushDelta, flushBuffer]);

  return { onVideoStart, onVideoEnd };
};
