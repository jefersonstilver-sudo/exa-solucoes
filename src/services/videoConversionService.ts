
/**
 * Serviço de conversão de vídeo MOV (iPhone) para MP4 (H.264)
 * Usa MediaRecorder API do browser para re-encodar vídeos QuickTime/HEVC
 */

export interface ConversionProgress {
  stage: 'loading' | 'converting' | 'finalizing';
  progress: number; // 0-100
}

/**
 * Verifica se o arquivo é um vídeo MOV/QuickTime que precisa de conversão
 */
export const needsConversion = (file: File): boolean => {
  const isMovType = file.type === 'video/quicktime';
  const isMovExtension = file.name.toLowerCase().endsWith('.mov');
  return isMovType || isMovExtension;
};

/**
 * Verifica se o browser suporta gravação em MP4 via MediaRecorder
 */
const checkMp4Support = (): string | null => {
  const mimeTypes = [
    'video/mp4;codecs=avc1',
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
  ];

  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return null;
};

/**
 * Converte um arquivo MOV (QuickTime/HEVC do iPhone) para MP4 (H.264)
 * usando a MediaRecorder API do browser (mesma técnica do trimmer)
 */
export const convertMovToMp4 = (
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Verificar suporte a MP4 no MediaRecorder
    const supportedMimeType = checkMp4Support();
    if (!supportedMimeType) {
      reject(new Error(
        'Seu navegador não suporta conversão de vídeo para MP4. ' +
        'Por favor, use o Google Chrome (116+) ou Safari para converter vídeos do iPhone.'
      ));
      return;
    }

    console.log('🔄 [CONVERSION] Iniciando conversão MOV → MP4');
    console.log('🔄 [CONVERSION] MIME type suportado:', supportedMimeType);
    onProgress?.({ stage: 'loading', progress: 0 });

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas 2D não disponível'));
      return;
    }

    video.muted = false;
    video.playsInline = true;
    video.preload = 'auto';

    const url = URL.createObjectURL(file);
    const chunks: Blob[] = [];
    let mediaRecorder: MediaRecorder | null = null;
    let animationFrameId: number | null = null;

    const cleanup = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try { mediaRecorder.stop(); } catch (_) {}
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
    };

    video.onloadedmetadata = () => {
      console.log('🔄 [CONVERSION] Metadata carregada:', {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      onProgress?.({ stage: 'loading', progress: 20 });

      // Capturar stream do canvas + áudio do vídeo
      const canvasStream = canvas.captureStream(30); // 30 FPS
      
      // Tentar capturar áudio do vídeo
      try {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination); // manter playback audível
        
        // Adicionar track de áudio ao stream
        destination.stream.getAudioTracks().forEach(track => {
          canvasStream.addTrack(track);
        });
        console.log('🔊 [CONVERSION] Áudio capturado');
      } catch (audioErr) {
        console.warn('⚠️ [CONVERSION] Sem áudio capturado:', audioErr);
      }

      mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType: supportedMimeType,
        videoBitsPerSecond: 5_000_000 // 5 Mbps
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        onProgress?.({ stage: 'finalizing', progress: 90 });
        
        const mp4Blob = new Blob(chunks, { type: 'video/mp4' });
        const mp4FileName = file.name.replace(/\.mov$/i, '.mp4');
        const mp4File = new File([mp4Blob], mp4FileName, { type: 'video/mp4' });

        console.log('✅ [CONVERSION] Conversão concluída:', {
          originalSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          convertedSize: (mp4File.size / (1024 * 1024)).toFixed(2) + ' MB',
          fileName: mp4FileName
        });

        onProgress?.({ stage: 'finalizing', progress: 100 });
        cleanup();
        resolve(mp4File);
      };

      mediaRecorder.onerror = (e: any) => {
        console.error('❌ [CONVERSION] Erro no MediaRecorder:', e);
        cleanup();
        reject(new Error('Erro durante a conversão do vídeo'));
      };

      // Iniciar gravação
      mediaRecorder.start(100); // chunks a cada 100ms
      onProgress?.({ stage: 'converting', progress: 30 });

      // Renderizar frames no canvas
      const drawFrame = () => {
        if (video.paused || video.ended) return;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Calcular progresso (30% a 85% durante a conversão)
        if (video.duration && video.duration > 0) {
          const conversionProgress = 30 + (video.currentTime / video.duration) * 55;
          onProgress?.({ stage: 'converting', progress: Math.round(conversionProgress) });
        }
        
        animationFrameId = requestAnimationFrame(drawFrame);
      };

      // Quando o vídeo terminar, parar gravação
      video.onended = () => {
        console.log('🔄 [CONVERSION] Vídeo finalizado, parando gravação');
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        // Pequeno delay para garantir que o último frame foi capturado
        setTimeout(() => {
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 200);
      };

      // Iniciar playback
      video.play().then(() => {
        console.log('▶️ [CONVERSION] Playback iniciado');
        drawFrame();
      }).catch(err => {
        console.error('❌ [CONVERSION] Erro ao iniciar playback:', err);
        cleanup();
        reject(new Error('Não foi possível reproduzir o vídeo para conversão'));
      });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Não foi possível carregar o vídeo MOV para conversão'));
    };

    video.src = url;
  });
};
