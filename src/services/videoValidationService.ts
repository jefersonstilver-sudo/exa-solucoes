
import { fetchMaxVideoDuration } from '@/hooks/useVideoSpecifications';

export interface VideoValidationResult {
  duration: number;
  orientation: 'landscape' | 'portrait';
  width: number;
  height: number;
  errors: string[];
}

export const validateVideoFile = async (
  file: File, 
  videoElement: HTMLVideoElement,
  tipo: 'horizontal' | 'vertical' = 'horizontal'
): Promise<VideoValidationResult> => {
  // Buscar duração máxima dinâmica do banco de dados
  const maxDuration = await fetchMaxVideoDuration(tipo);
  
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const errors: string[] = [];
    
    videoElement.onloadedmetadata = () => {
      const duration = Math.round(videoElement.duration);
      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;
      const orientation = height > width ? 'portrait' : 'landscape';
      
      // Validação de duração dinâmica
      if (duration > maxDuration) {
        errors.push(`Vídeo deve ter no máximo ${maxDuration} segundos`);
      }
      
      // Validação de orientação baseada no tipo
      if (tipo === 'horizontal' && orientation !== 'landscape') {
        errors.push('Vídeo deve estar em orientação horizontal');
      }
      
      if (tipo === 'vertical' && orientation !== 'portrait') {
        errors.push('Vídeo deve estar em orientação vertical');
      }
      
      // Verificar proporção baseada no tipo
      if (tipo === 'horizontal' && width <= height) {
        errors.push('Vídeo horizontal deve ter proporção 4:3 (largura > altura)');
      }
      
      if (tipo === 'vertical' && height <= width) {
        errors.push('Vídeo vertical deve ter proporção 9:16 (altura > largura)');
      }
      
      // Validar formato
      if (!['video/mp4', 'video/quicktime', 'video/avi'].includes(file.type)) {
        errors.push('Formato deve ser MP4, MOV ou AVI');
      }
      
      // Validar tamanho do arquivo (máx 100MB)
      if (file.size > 100 * 1024 * 1024) {
        errors.push('Arquivo deve ter no máximo 100MB');
      }
      
      URL.revokeObjectURL(url);
      resolve({ 
        duration, 
        orientation, 
        width, 
        height, 
        errors 
      });
    };
    
    videoElement.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video metadata'));
    };
    
    videoElement.src = url;
  });
};

// Função síncrona para validação rápida (usa valor padrão)
export const validateVideoFileSync = (
  file: File, 
  videoElement: HTMLVideoElement,
  maxDuration: number = 10
): Promise<VideoValidationResult> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const errors: string[] = [];
    
    videoElement.onloadedmetadata = () => {
      const duration = Math.round(videoElement.duration);
      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;
      const orientation = height > width ? 'portrait' : 'landscape';
      
      if (duration > maxDuration) {
        errors.push(`Vídeo deve ter no máximo ${maxDuration} segundos`);
      }
      
      if (orientation !== 'landscape') {
        errors.push('Vídeo deve estar em orientação horizontal');
      }
      
      if (width <= height) {
        errors.push('Vídeo deve ter proporção horizontal (largura > altura)');
      }
      
      if (!['video/mp4', 'video/quicktime', 'video/avi'].includes(file.type)) {
        errors.push('Formato deve ser MP4, MOV ou AVI');
      }
      
      if (file.size > 100 * 1024 * 1024) {
        errors.push('Arquivo deve ter no máximo 100MB');
      }
      
      URL.revokeObjectURL(url);
      resolve({ duration, orientation, width, height, errors });
    };
    
    videoElement.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video metadata'));
    };
    
    videoElement.src = url;
  });
};
