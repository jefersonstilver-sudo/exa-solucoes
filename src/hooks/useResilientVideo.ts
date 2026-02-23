import { useRef, useCallback, useEffect, useState } from 'react';

interface UseResilientVideoOptions {
  primaryUrl: string;
  fallbackUrl?: string;
  /** Override URL from database (highest priority) */
  overrideUrl?: string;
}

interface UseResilientVideoReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  currentSrc: string;
  hasError: boolean;
  isRecovering: boolean;
  handleStalled: () => void;
  handleWaiting: () => void;
  handleError: () => void;
  handleTimeUpdate: () => void;
  handlePlaying: () => void;
  manualRetry: () => void;
}

const MAX_RETRIES = 3;
const STALL_TIMEOUT_MS = 3000;
const FREEZE_TIMEOUT_MS = 5000;

export const useResilientVideo = ({
  primaryUrl,
  fallbackUrl,
  overrideUrl,
}: UseResilientVideoOptions): UseResilientVideoReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Recovery state
  const retryCount = useRef(0);
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTimeUpdate = useRef(0);
  const lastKnownTime = useRef(0);
  const freezeCheckTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(true);
  const userPausedRef = useRef(false);

  const [hasError, setHasError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Determine active source: override > primary/fallback
  const activeSrc = overrideUrl || (useFallback && fallbackUrl ? fallbackUrl : primaryUrl);

  // ── Helpers ──────────────────────────────────────────────
  const clearStallTimer = useCallback(() => {
    if (stallTimer.current) {
      clearTimeout(stallTimer.current);
      stallTimer.current = null;
    }
  }, []);

  const attemptRecovery = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    retryCount.current += 1;
    console.log(`🔄 [RESILIENT_VIDEO] Recovery attempt ${retryCount.current}/${MAX_RETRIES}`);

    if (retryCount.current > MAX_RETRIES) {
      console.error('❌ [RESILIENT_VIDEO] Max retries exceeded, showing error state');
      setHasError(true);
      setIsRecovering(false);
      return;
    }

    setIsRecovering(true);

    // On 2nd retry, try fallback URL if available
    if (retryCount.current === 2 && fallbackUrl && !useFallback && !overrideUrl) {
      console.log('🔀 [RESILIENT_VIDEO] Switching to fallback URL');
      setUseFallback(true);
      // Source change will trigger re-render, load handled in effect
      return;
    }

    // Standard recovery: reload + play
    try {
      video.load();
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch((err) => {
          console.warn('⚠️ [RESILIENT_VIDEO] Play after recovery failed:', err.message);
        });
      }
    } catch (err) {
      console.warn('⚠️ [RESILIENT_VIDEO] Recovery load/play error:', err);
    }
  }, [fallbackUrl, useFallback, overrideUrl]);

  // ── Event Handlers ──────────────────────────────────────
  const handleStalled = useCallback(() => {
    console.warn('⏸ [RESILIENT_VIDEO] Video stalled');
    clearStallTimer();
    stallTimer.current = setTimeout(() => {
      console.log('⏱ [RESILIENT_VIDEO] Stall timeout reached, attempting recovery');
      attemptRecovery();
    }, STALL_TIMEOUT_MS);
  }, [attemptRecovery, clearStallTimer]);

  const handleWaiting = useCallback(() => {
    clearStallTimer();
    stallTimer.current = setTimeout(() => {
      console.log('⏱ [RESILIENT_VIDEO] Waiting timeout reached, attempting recovery');
      attemptRecovery();
    }, STALL_TIMEOUT_MS);
  }, [attemptRecovery, clearStallTimer]);

  const handleError = useCallback(() => {
    const video = videoRef.current;
    const errorCode = video?.error?.code;
    const errorMsg = video?.error?.message;
    console.error(`❌ [RESILIENT_VIDEO] Video error: code=${errorCode}, msg=${errorMsg}`);

    clearStallTimer();

    // Small delay before recovery to avoid tight loop
    setTimeout(() => {
      attemptRecovery();
    }, 2000);
  }, [attemptRecovery, clearStallTimer]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    lastTimeUpdate.current = Date.now();
    lastKnownTime.current = video.currentTime;

    // Reset recovery counters on healthy playback
    if (retryCount.current > 0 || isRecovering) {
      retryCount.current = 0;
      setIsRecovering(false);
      setHasError(false);
    }
  }, [isRecovering]);

  const handlePlaying = useCallback(() => {
    clearStallTimer();
    retryCount.current = 0;
    setIsRecovering(false);
    setHasError(false);
  }, [clearStallTimer]);

  const manualRetry = useCallback(() => {
    retryCount.current = 0;
    setHasError(false);
    setUseFallback(false);
    setIsRecovering(true);
    const video = videoRef.current;
    if (video) {
      video.load();
      video.play().catch(() => {});
    }
  }, []);

  // ── Silent Freeze Detection ─────────────────────────────
  useEffect(() => {
    freezeCheckTimer.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended || hasError) return;

      const elapsed = Date.now() - lastTimeUpdate.current;
      if (elapsed > FREEZE_TIMEOUT_MS && lastTimeUpdate.current > 0) {
        console.warn(`🧊 [RESILIENT_VIDEO] Silent freeze detected (${Math.round(elapsed / 1000)}s without timeupdate)`);
        attemptRecovery();
      }
    }, 2000);

    return () => {
      if (freezeCheckTimer.current) clearInterval(freezeCheckTimer.current);
    };
  }, [attemptRecovery, hasError]);

  // ── Intersection Observer (pause/resume) ────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;

        isVisibleRef.current = entry.isIntersecting;

        if (entry.isIntersecting) {
          if (!userPausedRef.current && video.paused && !hasError) {
            video.play().catch(() => {});
          }
        } else {
          if (!video.paused) {
            video.pause();
          }
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [hasError]);

  // ── Source change effect ─────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;

    // When source changes (e.g. fallback), reload
    video.load();
    if (isVisibleRef.current) {
      video.play().catch(() => {});
    }
  }, [activeSrc]);

  // ── Cleanup ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearStallTimer();
      if (freezeCheckTimer.current) clearInterval(freezeCheckTimer.current);
    };
  }, [clearStallTimer]);

  return {
    videoRef,
    containerRef,
    currentSrc: activeSrc,
    hasError,
    isRecovering,
    handleStalled,
    handleWaiting,
    handleError,
    handleTimeUpdate,
    handlePlaying,
    manualRetry,
  };
};
