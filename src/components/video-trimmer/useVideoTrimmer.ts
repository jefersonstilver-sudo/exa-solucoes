
import { useState, useRef, useCallback, useEffect } from 'react';
import { getFFmpeg, safeUnlink } from './ffmpegSingleton';

interface UseVideoTrimmerProps {
  file: File;
  maxDuration: number;
}

export interface TrimmerState {
  startTime: number;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isProcessing: boolean;
  processingProgress: number;
  thumbnails: string[];
  isReady: boolean;
}

// Robust seek with timeout — never hangs even if browser swallows 'seeked'
const seekToWithTimeout = (video: HTMLVideoElement, time: number, timeoutMs = 800): Promise<void> => {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener('seeked', onSeeked);
      clearTimeout(timer);
      resolve();
    };
    const onSeeked = () => finish();
    video.addEventListener('seeked', onSeeked);
    const timer = setTimeout(finish, timeoutMs);
    try { video.currentTime = time; } catch { finish(); }
  });
};

export const useVideoTrimmer = ({ file, maxDuration }: UseVideoTrimmerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const videoUrl = useRef<string>('');
  const startTimeRef = useRef(0);
  const endTimeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const maxDurationRef = useRef(maxDuration);

  const [state, setState] = useState<TrimmerState>({
    startTime: 0,
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    isProcessing: false,
    processingProgress: 0,
    thumbnails: [],
    isReady: false,
  });

  // Keep maxDuration ref in sync without an extra hook slot ordering risk
  maxDurationRef.current = maxDuration;

  // Derived
  const windowSize = Math.min(maxDuration, state.duration || maxDuration);
  const endTime = state.startTime + windowSize;
  const selectedDuration = Math.round(windowSize * 10) / 10;

  // Sync refs with derived values on each render (cheap, no hook)
  startTimeRef.current = state.startTime;
  endTimeRef.current = state.startTime + windowSize;
  isPlayingRef.current = state.isPlaying;

  // ===== Effect 1: load video + listeners =====
  useEffect(() => {
    const url = URL.createObjectURL(file);
    videoUrl.current = url;

    const video = videoRef.current;
    if (!video) {
      URL.revokeObjectURL(url);
      return;
    }

    video.src = url;
    video.preload = 'auto';
    video.muted = true;

    let cancelled = false;

    const onMeta = () => {
      const dur = video.duration;
      if (!isFinite(dur) || dur <= 0) return;
      setState(prev => ({
        ...prev,
        duration: dur,
        startTime: 0,
        currentTime: 0,
        isReady: true,
      }));
      try { video.currentTime = 0.001; } catch {}
      // Fire and forget thumbnail generation
      generateThumbnailsOffscreen(url, dur).then((thumbs) => {
        if (cancelled) return;
        setState(prev => ({ ...prev, thumbnails: thumbs }));
      }).catch((err) => {
        console.warn('[TRIMMER] thumbnail gen falhou:', err);
      });
    };

    const onTimeUpdate = () => {
      const t = video.currentTime;
      setState(prev => {
        if (Math.abs(prev.currentTime - t) < 0.03) return prev;
        return { ...prev, currentTime: t };
      });
    };

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('seeked', onTimeUpdate);

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('seeked', onTimeUpdate);
      URL.revokeObjectURL(url);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [file]);

  // ===== Effect 2: when user drags the red window, seek preview to start =====
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !state.isReady || state.isPlaying) return;
    const target = state.startTime;
    if (Math.abs(video.currentTime - target) > 0.05) {
      try { video.currentTime = target; } catch {}
    }
  }, [state.startTime, state.isReady, state.isPlaying]);

  // Generate thumbnails on a hidden, attached <video> (must be in DOM for reliable decode)
  const generateThumbnailsOffscreen = async (url: string, duration: number): Promise<string[]> => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobile = /iPad|iPhone|iPod|Android/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const lowEnd = isSafari || isMobile;

    const thumbCount = isMobile
      ? Math.min(6, Math.max(4, Math.floor(duration / 2)))
      : lowEnd
        ? Math.min(8, Math.max(5, Math.floor(duration)))
        : Math.min(16, Math.max(8, Math.floor(duration * 1.5)));

    // Container hidden but in DOM (required for reliable decode in Chrome/Safari)
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none;opacity:0;';
    const offVideo = document.createElement('video');
    offVideo.src = url;
    offVideo.muted = true;
    offVideo.preload = 'auto';
    offVideo.crossOrigin = 'anonymous';
    (offVideo as any).playsInline = true;
    offVideo.setAttribute('playsinline', 'true');
    host.appendChild(offVideo);
    document.body.appendChild(host);

    try {
      // Wait for loadeddata (frame actually decodable), with timeout
      await new Promise<void>((resolve) => {
        let done = false;
        const finish = () => { if (done) return; done = true; clearTimeout(t); resolve(); };
        const onReady = () => finish();
        offVideo.addEventListener('loadeddata', onReady, { once: true });
        offVideo.addEventListener('loadedmetadata', onReady, { once: true });
        const t = setTimeout(finish, 3000);
      });

      const canvas = document.createElement('canvas');
      canvas.width = lowEnd ? 120 : 160;
      canvas.height = lowEnd ? 68 : 90;
      const ctx = canvas.getContext('2d');
      if (!ctx) return [];

      const thumbs: string[] = [];
      const safeDur = Math.max(0.1, duration - 0.05);
      for (let i = 0; i < thumbCount; i++) {
        const time = Math.min(safeDur, (i / thumbCount) * duration);
        try {
          await seekToWithTimeout(offVideo, time, 800);
          // Small extra wait so the decoded frame is ready before drawImage
          await new Promise(r => setTimeout(r, 30));
          ctx.drawImage(offVideo, 0, 0, canvas.width, canvas.height);
          thumbs.push(canvas.toDataURL('image/jpeg', 0.55));
        } catch {
          thumbs.push('');
        }
      }
      return thumbs;
    } finally {
      try { offVideo.removeAttribute('src'); offVideo.load(); } catch {}
      try { host.remove(); } catch {}
    }
  };

  const setStartTime = useCallback((time: number) => {
    setState(prev => {
      const ws = Math.min(maxDurationRef.current, prev.duration);
      const newStart = Math.max(0, Math.min(time, prev.duration - ws));
      return { ...prev, startTime: newStart };
    });
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlayingRef.current) {
      video.pause();
      cancelAnimationFrame(animFrameRef.current);
      isPlayingRef.current = false;
      setState(prev => ({ ...prev, isPlaying: false }));
      return;
    }

    const start = startTimeRef.current;
    const end = endTimeRef.current;
    if (video.currentTime < start || video.currentTime >= end - 0.05) {
      try { video.currentTime = start; } catch {}
    }
    video.play().catch(() => {});
    isPlayingRef.current = true;
    setState(prev => ({ ...prev, isPlaying: true }));

    // Lightweight A/B loop — does NOT setState (timeupdate handles UI updates)
    const tick = () => {
      if (!isPlayingRef.current) return;
      const s = startTimeRef.current;
      const e = endTimeRef.current;
      if (video.currentTime >= e) {
        try { video.currentTime = s; } catch {}
      } else if (video.currentTime < s - 0.05) {
        try { video.currentTime = s; } catch {}
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const seekPreview = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    setState(prev => {
      if (prev.isPlaying) return prev;
      const ws = Math.min(maxDurationRef.current, prev.duration);
      const clamped = Math.max(prev.startTime, Math.min(time, prev.startTime + ws));
      try { video.currentTime = clamped; } catch {}
      return { ...prev, currentTime: clamped };
    });
  }, []);

  // ===== Real video cut via FFmpeg.wasm (CapCut-grade) =====
  const trimVideo = useCallback(async (): Promise<File> => {
    const video = videoRef.current;
    if (!video) throw new Error('Video element not available');

    video.pause();
    cancelAnimationFrame(animFrameRef.current);
    setState(prev => ({ ...prev, isPlaying: false, isProcessing: true, processingProgress: 0 }));

    const startT = state.startTime;
    const ws = Math.min(maxDuration, state.duration);
    const endT = startT + ws;

    const metadataOnlyFallback = (reason: string): File => {
      console.warn(`⚠️ [TRIMMER] Fallback metadata-only: ${reason}`);
      const trimmedFile = new File(
        [file],
        file.name.replace(/\.[^.]+$/, '_trimmed.' + (file.name.split('.').pop() || 'mp4')),
        { type: file.type }
      );
      (trimmedFile as any)._trimStart = startT;
      (trimmedFile as any)._trimEnd = endT;
      (trimmedFile as any)._wasFallbackFromWebm = true;
      setState(prev => ({ ...prev, isProcessing: false, processingProgress: 100 }));
      return trimmedFile;
    };

    try {
      const ffmpeg = await getFFmpeg((p) => {
        setState(prev => ({ ...prev, processingProgress: Math.min(15, p * 15) }));
      });

      const onProgress = ({ progress }: { progress: number }) => {
        const pct = 15 + Math.min(84, Math.max(0, progress) * 84);
        setState(prev => ({ ...prev, processingProgress: pct }));
      };
      ffmpeg.on('progress', onProgress);

      const ext = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
      const inputName = `input.${ext}`;
      const outputName = 'output.mp4';

      const { fetchFile } = await import('@ffmpeg/util');
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const ss = startT.toFixed(3);
      const dur = (endT - startT).toFixed(3);

      const tryRead = async (): Promise<Uint8Array | null> => {
        try {
          const data = await ffmpeg.readFile(outputName);
          return data as Uint8Array;
        } catch {
          return null;
        }
      };

      // 1) Stream copy (fast & lossless)
      try {
        await ffmpeg.exec([
          '-ss', ss,
          '-i', inputName,
          '-t', dur,
          '-c', 'copy',
          '-avoid_negative_ts', 'make_zero',
          '-movflags', '+faststart',
          outputName,
        ]);
        const data = await tryRead();
        if (data && data.length > 1024) {
          const blob = new Blob([data.buffer as ArrayBuffer], { type: 'video/mp4' });
          const trimmedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '_trimmed.mp4'),
            { type: 'video/mp4' }
          );
          await safeUnlink(ffmpeg, inputName);
          await safeUnlink(ffmpeg, outputName);
          ffmpeg.off('progress', onProgress);
          setState(prev => ({ ...prev, isProcessing: false, processingProgress: 100 }));
          console.log('✅ [TRIMMER] Stream copy:', trimmedFile.size, 'bytes');
          return trimmedFile;
        }
      } catch (copyErr) {
        console.warn('⚠️ [TRIMMER] Stream copy falhou, reencodando:', copyErr);
      }

      // 2) Re-encode (frame-accurate)
      await safeUnlink(ffmpeg, outputName);
      await ffmpeg.exec([
        '-i', inputName,
        '-ss', ss,
        '-t', dur,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputName,
      ]);
      const data = await tryRead();
      ffmpeg.off('progress', onProgress);
      if (!data || data.length < 1024) {
        await safeUnlink(ffmpeg, inputName);
        await safeUnlink(ffmpeg, outputName);
        return metadataOnlyFallback('FFmpeg gerou arquivo vazio');
      }
      const blob = new Blob([data.buffer as ArrayBuffer], { type: 'video/mp4' });
      const trimmedFile = new File(
        [blob],
        file.name.replace(/\.[^.]+$/, '_trimmed.mp4'),
        { type: 'video/mp4' }
      );
      await safeUnlink(ffmpeg, inputName);
      await safeUnlink(ffmpeg, outputName);
      setState(prev => ({ ...prev, isProcessing: false, processingProgress: 100 }));
      console.log('✅ [TRIMMER] Reencode:', trimmedFile.size, 'bytes');
      return trimmedFile;
    } catch (error) {
      console.error('❌ [TRIMMER] FFmpeg falhou:', error);
      return metadataOnlyFallback(error instanceof Error ? error.message : 'erro desconhecido');
    }
  }, [state.startTime, state.duration, maxDuration, file]);

  return {
    videoRef,
    canvasRef,
    state,
    endTime,
    selectedDuration,
    maxDuration,
    windowSize,
    setStartTime,
    togglePlay,
    seekPreview,
    trimVideo,
  };
};
