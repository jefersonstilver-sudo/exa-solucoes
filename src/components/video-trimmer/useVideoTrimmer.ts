
import { useState, useRef, useCallback, useEffect } from 'react';

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

export const useVideoTrimmer = ({ file, maxDuration }: UseVideoTrimmerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

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

  const videoUrl = useRef<string>('');

  // Derived: endTime is always startTime + windowSize
  const windowSize = Math.min(maxDuration, state.duration || maxDuration);
  const endTime = state.startTime + windowSize;
  const selectedDuration = Math.round(windowSize * 10) / 10;

  // Load video and generate thumbnails
  useEffect(() => {
    const url = URL.createObjectURL(file);
    videoUrl.current = url;

    const video = videoRef.current;
    if (!video) return;

    video.src = url;
    video.preload = 'auto';

    video.onloadedmetadata = () => {
      const dur = video.duration;
      setState(prev => ({
        ...prev,
        duration: dur,
        startTime: 0,
        isReady: true,
      }));
      generateThumbnails(video, dur);
    };

    return () => {
      URL.revokeObjectURL(url);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [file, maxDuration]);

  const generateThumbnails = async (video: HTMLVideoElement, duration: number) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // iOS/Safari: gera muito menos thumbnails para evitar travar o seek pesado.
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) ||
      (/(Macintosh).*Version\/.+ Mobile/.test(ua));
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const lowEnd = isIOS || isSafari;

    const thumbCount = lowEnd
      ? Math.min(8, Math.max(5, Math.floor(duration)))
      : Math.min(16, Math.max(8, Math.floor(duration * 1.5)));
    canvas.width = lowEnd ? 120 : 160;
    canvas.height = lowEnd ? 68 : 90;
    const thumbs: string[] = [];

    for (let i = 0; i < thumbCount; i++) {
      const time = (i / thumbCount) * duration;
      try {
        await seekTo(video, time);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        thumbs.push(canvas.toDataURL('image/jpeg', 0.55));
      } catch {
        thumbs.push('');
      }
    }

    setState(prev => ({ ...prev, thumbnails: thumbs }));
  };

  const seekTo = (video: HTMLVideoElement, time: number): Promise<void> => {
    return new Promise((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = time;
    });
  };

  // Only setter: slides the fixed window along the timeline
  const setStartTime = useCallback((time: number) => {
    setState(prev => {
      const ws = Math.min(maxDuration, prev.duration);
      const newStart = Math.max(0, Math.min(time, prev.duration - ws));
      return { ...prev, startTime: newStart };
    });
  }, [maxDuration]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setState(prev => {
      if (prev.isPlaying) {
        video.pause();
        cancelAnimationFrame(animFrameRef.current);
        return { ...prev, isPlaying: false };
      } else {
        const ws = Math.min(maxDuration, prev.duration);
        const end = prev.startTime + ws;
        video.currentTime = prev.startTime;
        video.play();

        const tick = () => {
          if (video.currentTime >= end) {
            video.currentTime = prev.startTime;
          }
          setState(s => ({ ...s, currentTime: video.currentTime }));
          animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();

        return { ...prev, isPlaying: true };
      }
    });
  }, [maxDuration]);

  const seekPreview = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    setState(prev => {
      if (prev.isPlaying) return prev;
      video.currentTime = time;
      return { ...prev, currentTime: time };
    });
  }, []);

  // Trim the video using MediaRecorder + Canvas
  const trimVideo = useCallback(async (): Promise<File> => {
    const video = videoRef.current;
    if (!video) throw new Error('Video element not available');

    // Stop playback if active
    video.pause();
    cancelAnimationFrame(animFrameRef.current);
    setState(prev => ({ ...prev, isPlaying: false, isProcessing: true, processingProgress: 0 }));

    const startT = state.startTime;
    const ws = Math.min(maxDuration, state.duration);
    const endT = startT + ws;
    const trimDuration = ws;

    // Fallback / iOS path: returns original file + trim metadata, sem reencode no browser.
    const createMetadataOnlyFile = (reason: string) => {
      console.warn(`⚠️ [TRIMMER] ${reason} — usando arquivo original com metadados de corte`);
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

    // iOS/Safari: MediaRecorder + Canvas é instável e gera arquivos corrompidos.
    // Vamos direto pelo caminho metadata-only para preservar áudio e qualidade.
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) ||
      (/(Macintosh).*Version\/.+ Mobile/.test(ua));
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    if (isIOS || isSafari) {
      return createMetadataOnlyFile('iOS/Safari detectado');
    }

    try {
      // Setup canvas matching video dimensions
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return createMetadataOnlyFile('Sem contexto de canvas');

      // Setup MediaRecorder
      const stream = canvas.captureStream(30);
      
      // Try to capture audio too
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);
        dest.stream.getAudioTracks().forEach(track => stream.addTrack(track));
      } catch {
        console.log('⚠️ Could not capture audio, trimming video only');
      }

      // PRIORIZAR MP4 para compatibilidade com API AWS
      // Chrome 116+ suporta video/mp4 no MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
        ? 'video/mp4;codecs=avc1'
        : MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      
      const isWebmOutput = mimeType.includes('webm');
      console.log('🎬 [TRIMMER] MediaRecorder mimeType selecionado:', mimeType, '| isWebm:', isWebmOutput);

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 5_000_000
        });
      } catch (recorderError) {
        console.error('❌ MediaRecorder creation failed:', recorderError);
        return createMetadataOnlyFile('fallback');
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      return new Promise<File>((resolve, reject) => {
        let safetyTimeout: ReturnType<typeof setTimeout>;
        let drawFrameId: number;
        let resolved = false;

        const cleanup = () => {
          if (safetyTimeout) clearTimeout(safetyTimeout);
          if (drawFrameId) cancelAnimationFrame(drawFrameId);
          video.pause();
        };

        const stopRecording = () => {
          if (resolved) return;
          resolved = true;
          cleanup();
          if (recorder.state === 'recording') {
            recorder.stop();
          } else {
            // Recorder never started or already stopped — use fallback
            resolve(createMetadataOnlyFile('fallback'));
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          if (blob.size === 0) {
            resolve(createMetadataOnlyFile('fallback'));
            return;
          }
          
          // Se o output é WebM, enviar o ORIGINAL (que já é MP4) com metadados de corte
          // em vez de enviar WebM disfarçado de MP4
          if (isWebmOutput) {
            console.warn('⚠️ [TRIMMER] Browser produziu WebM - enviando arquivo original MP4 com metadados de corte');
            const originalWithTrimMeta = new File(
              [file],
              file.name.replace(/\.[^.]+$/, '_trimmed.' + file.name.split('.').pop()),
              { type: file.type }
            );
            // Attach trim metadata as custom properties
            (originalWithTrimMeta as any)._trimStart = startT;
            (originalWithTrimMeta as any)._trimEnd = endT;
            (originalWithTrimMeta as any)._wasFallbackFromWebm = true;
            setState(prev => ({ ...prev, isProcessing: false, processingProgress: 100 }));
            resolve(originalWithTrimMeta);
            return;
          }
          
          const trimmedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '_trimmed.mp4'),
            { type: mimeType }
          );
          console.log('✅ [TRIMMER] Vídeo trimado em MP4 nativo:', {
            size: trimmedFile.size,
            type: trimmedFile.type,
            name: trimmedFile.name
          });
          setState(prev => ({ ...prev, isProcessing: false, processingProgress: 100 }));
          resolve(trimmedFile);
        };

        recorder.onerror = () => {
          cleanup();
          // Fallback instead of rejecting
          resolve(createMetadataOnlyFile('fallback'));
        };

        // Safety timeout: 30s max processing time
        safetyTimeout = setTimeout(() => {
          console.warn('⚠️ Trim safety timeout reached, forcing stop');
          stopRecording();
        }, 30_000);

        // Seek to start, then begin recording ONCE
        video.currentTime = startT;
        video.addEventListener('seeked', () => {
          // Guard: only start if not already recording
          if (recorder.state === 'recording') return;
          
          try {
            recorder.start();
          } catch (startErr) {
            console.error('❌ recorder.start() failed:', startErr);
            resolved = true;
            cleanup();
            resolve(createMetadataOnlyFile('fallback'));
            return;
          }
          video.play();

          const drawFrame = () => {
            if (resolved) return;

            if (video.currentTime >= endT || video.paused || video.ended) {
              stopRecording();
              return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Real progress based on actual video position
            const elapsed = video.currentTime - startT;
            const progress = Math.min(99, (elapsed / trimDuration) * 100);
            setState(prev => ({ ...prev, processingProgress: progress, currentTime: video.currentTime }));

            drawFrameId = requestAnimationFrame(drawFrame);
          };
          drawFrame();
        }, { once: true });

        // Fallback: if video ends before endT
        video.addEventListener('ended', () => {
          stopRecording();
        }, { once: true });
      });
    } catch (error) {
      console.error('❌ Trim failed entirely, using fallback:', error);
      return createMetadataOnlyFile('fallback');
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
