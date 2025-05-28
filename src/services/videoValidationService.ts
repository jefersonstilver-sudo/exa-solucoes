
export interface VideoValidationResult {
  duration: number;
  orientation: 'landscape' | 'portrait';
  width: number;
  height: number;
  errors: string[];
}

export const validateVideoFile = (file: File, videoElement: HTMLVideoElement): Promise<VideoValidationResult> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const errors: string[] = [];
    
    videoElement.onloadedmetadata = () => {
      const duration = Math.round(videoElement.duration);
      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;
      const orientation = height > width ? 'portrait' : 'landscape';
      
      // Validações essenciais
      if (duration > 15) {
        errors.push('Vídeo deve ter no máximo 15 segundos');
      }
      
      if (orientation !== 'landscape') {
        errors.push('Vídeo deve estar em orientação horizontal');
      }
      
      // Verificar proporção (largura deve ser maior que altura)
      if (width <= height) {
        errors.push('Vídeo deve ter proporção horizontal (largura > altura)');
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
