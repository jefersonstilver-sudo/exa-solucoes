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
// Apenas freeze REAL (sem timeupdate por mais de 10s) é considerado problema.
// Buffer/waiting normal NÃO dispara recovery.
const FREEZE_TIMEOUT_MS = 10000;
const VISIBILITY_DEBOUNCE_MS = 150;

export const useResilientVideo = ({
  primaryUrl,
  fallbackUrl,
  overrideUrl,
}: UseResilientVideoOptions): UseResilientVideoReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Recovery state em refs (evita re-renders)
  const retryCount = useRef(0);
  const lastTimeUpdate = useRef(0);
  const freezeCheckTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(true);
  const userPausedRef = useRef(false);
  const visibilityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hasError, setHasError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // override > fallback > primary
  const activeSrc = overrideUrl || (useFallback && fallbackUrl ? fallbackUrl : primaryUrl);

  // ── Recovery sem destruir buffer ─────────────────────────
  const attemptRecovery = useCallback((forceReload = false) => {
    const video = videoRef.current;
    if (!video) return;

    retryCount.current += 1;

    if (retryCount.current > MAX_RETRIES) {
      setHasError(true);
      setIsRecovering(false);
      return;
    }

    setIsRecovering(true);

    // Trocar para fallback no 2º retry (apenas se houver)
    if (retryCount.current === 2 && fallbackUrl && !useFallback && !overrideUrl) {
      setUseFallback(true);
      return;
    }

    try {
      // Recovery PADRÃO: só tenta play() — preserva buffer.
      // load() apenas em erro grave (forceReload=true) ou troca de URL.
      if (forceReload) {
        video.load();
      }
      const p = video.play();
      if (p) p.catch(() => {});
    } catch {
      /* noop */
    }
  }, [fallbackUrl, useFallback, overrideUrl]);

  // ── Event Handlers (passivos) ────────────────────────────
  // waiting/stalled são EVENTOS NORMAIS de buffering. Não fazemos nada
  // proativo aqui — o navegador retoma sozinho. O freeze-detector cuida
  // de freezes reais e prolongados.
  const handleStalled = useCallback(() => {
    // intencionalmente vazio
  }, []);

  const handleWaiting = useCallback(() => {
    // intencionalmente vazio
  }, []);

  const handleError = useCallback(() => {
    // Erro real do elemento — força reload após pequeno delay.
    setTimeout(() => attemptRecovery(true), 1500);
  }, [attemptRecovery]);

  // Atualiza apenas REF — sem setState, sem re-render por frame
  const handleTimeUpdate = useCallback(() => {
    lastTimeUpdate.current = Date.now();
  }, []);

  const handlePlaying = useCallback(() => {
    retryCount.current = 0;
    // Só dispara setState quando realmente muda (evita re-renders ociosos)
    setIsRecovering((prev) => (prev ? false : prev));
    setHasError((prev) => (prev ? false : prev));
    lastTimeUpdate.current = Date.now();
  }, []);

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

  // ── Freeze detector (apenas freeze REAL > 10s) ───────────
  useEffect(() => {
    freezeCheckTimer.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended || hasError) return;
      // Pausa detecção quando aba não está visível (evita falso positivo
      // de timer throttling do navegador)
      if (typeof document !== 'undefined' && document.hidden) return;
      if (lastTimeUpdate.current === 0) return;

      const elapsed = Date.now() - lastTimeUpdate.current;
      if (elapsed > FREEZE_TIMEOUT_MS) {
        attemptRecovery(false);
      }
    }, 3000);

    return () => {
      if (freezeCheckTimer.current) clearInterval(freezeCheckTimer.current);
    };
  }, [attemptRecovery, hasError]);

  // ── IntersectionObserver com debounce ────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;

        isVisibleRef.current = entry.isIntersecting;

        // Debounce evita play/pause em rajada durante scroll
        if (visibilityDebounceRef.current) {
          clearTimeout(visibilityDebounceRef.current);
        }
        visibilityDebounceRef.current = setTimeout(() => {
          const v = videoRef.current;
          if (!v) return;
          if (isVisibleRef.current) {
            if (!userPausedRef.current && v.paused && !hasError) {
              v.play().catch(() => {});
            }
          } else {
            if (!v.paused) v.pause();
          }
        }, VISIBILITY_DEBOUNCE_MS);
      },
      { threshold: 0.15 }
    );

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (visibilityDebounceRef.current) clearTimeout(visibilityDebounceRef.current);
    };
  }, [hasError]);

  // ── Source change effect ─────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;
    video.load();
    if (isVisibleRef.current) {
      video.play().catch(() => {});
    }
  }, [activeSrc]);

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
