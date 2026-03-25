
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVideoTrimmerProps {
  file: File;
  maxDuration: number;
}

export interface TrimmerState {
  startTime: number;
  endTime: number;
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
    endTime: maxDuration,
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    isProcessing: false,
    processingProgress: 0,
    thumbnails: [],
    isReady: false,
  });

  const videoUrl = useRef<string>('');

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
      const end = Math.min(maxDuration, dur);
      setState(prev => ({
        ...prev,
        duration: dur,
        endTime: end,
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

    const thumbCount = Math.min(12, Math.max(6, Math.floor(duration)));
    canvas.width = 120;
    canvas.height = 68;
    const thumbs: string[] = [];

    for (let i = 0; i < thumbCount; i++) {
      const time = (i / thumbCount) * duration;
      try {
        await seekTo(video, time);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        thumbs.push(canvas.toDataURL('image/jpeg', 0.5));
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

  const setStartTime = useCallback((time: number) => {
    setState(prev => {
      const newStart = Math.max(0, Math.min(time, prev.duration - 1));
      let newEnd = prev.endTime;
      if (newEnd - newStart > maxDuration) {
        newEnd = newStart + maxDuration;
      }
      if (newEnd <= newStart) {
        newEnd = Math.min(newStart + 1, prev.duration);
      }
      return { ...prev, startTime: newStart, endTime: newEnd };
    });
  }, [maxDuration]);

  const setEndTime = useCallback((time: number) => {
    setState(prev => {
      const newEnd = Math.min(time, prev.duration);
      let newStart = prev.startTime;
      if (newEnd - newStart > maxDuration) {
        newStart = newEnd - maxDuration;
      }
      if (newEnd <= newStart) {
        newStart = Math.max(newEnd - 1, 0);
      }
      return { ...prev, startTime: newStart, endTime: newEnd };
    });
  }, [maxDuration]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (state.isPlaying) {
      video.pause();
      cancelAnimationFrame(animFrameRef.current);
      setState(prev => ({ ...prev, isPlaying: false }));
    } else {
      video.currentTime = state.startTime;
      video.play();
      setState(prev => ({ ...prev, isPlaying: true }));

      const tick = () => {
        if (video.currentTime >= state.endTime) {
          video.currentTime = state.startTime;
        }
        setState(prev => ({ ...prev, currentTime: video.currentTime }));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    }
  }, [state.isPlaying, state.startTime, state.endTime]);

  const seekPreview = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video || state.isPlaying) return;
    video.currentTime = time;
    setState(prev => ({ ...prev, currentTime: time }));
  }, [state.isPlaying]);

  // Trim the video using MediaRecorder + Canvas
  const trimVideo = useCallback(async (): Promise<File> => {
    const video = videoRef.current;
    if (!video) throw new Error('Video element not available');

    setState(prev => ({ ...prev, isProcessing: true, processingProgress: 0 }));

    try {
      const { startTime, endTime } = state;
      const trimDuration = endTime - startTime;

      // Setup canvas matching video dimensions
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;

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

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5_000_000
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      return new Promise<File>((resolve, reject) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
          const trimmedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, `_trimmed.${ext}`),
            { type: mimeType }
          );
          setState(prev => ({ ...prev, isProcessing: false, processingProgress: 100 }));
          resolve(trimmedFile);
        };

        recorder.onerror = () => {
          setState(prev => ({ ...prev, isProcessing: false }));
          reject(new Error('Erro ao processar vídeo'));
        };

        // Seek to start and begin recording
        video.currentTime = startTime;
        video.onseeked = () => {
          recorder.start();
          video.play();

          const drawFrame = () => {
            if (video.currentTime >= endTime || video.paused) {
              video.pause();
              recorder.stop();
              return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Update progress
            const elapsed = video.currentTime - startTime;
            const progress = Math.min(95, (elapsed / trimDuration) * 100);
            setState(prev => ({ ...prev, processingProgress: progress, currentTime: video.currentTime }));

            requestAnimationFrame(drawFrame);
          };
          drawFrame();
        };
      });
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }));
      throw error;
    }
  }, [state.startTime, state.endTime, file]);

  const selectedDuration = Math.round((state.endTime - state.startTime) * 10) / 10;

  return {
    videoRef,
    canvasRef,
    state,
    selectedDuration,
    maxDuration,
    setStartTime,
    setEndTime,
    togglePlay,
    seekPreview,
    trimVideo,
  };
};
