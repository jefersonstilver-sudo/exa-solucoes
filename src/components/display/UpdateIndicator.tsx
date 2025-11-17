import React, { useEffect, useState } from 'react';
import { Download, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UpdateIndicatorProps {
  isUpdating: boolean;
  videosCount: number;
}

export const UpdateIndicator: React.FC<UpdateIndicatorProps> = ({
  isUpdating,
  videosCount
}) => {
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isUpdating) {
      setShowSuccess(false);
      setProgress(0);
      
      // Simular progresso durante atualização
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90; // Parar em 90% até concluir
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    } else if (progress > 0) {
      // Completar progresso quando terminar
      setProgress(100);
      setShowSuccess(true);
      
      // Ocultar após 2 segundos
      setTimeout(() => {
        setProgress(0);
        setShowSuccess(false);
      }, 2000);
    }
  }, [isUpdating]);

  if (!isUpdating && progress === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[300px] animate-in slide-in-from-top">
      <div className="flex items-center gap-3 mb-2">
        {showSuccess ? (
          <CheckCircle className="h-5 w-5 text-green-500 animate-in zoom-in" />
        ) : (
          <Download className="h-5 w-5 text-blue-500 animate-pulse" />
        )}
        <span className="text-sm font-medium text-gray-900">
          {showSuccess 
            ? `✅ ${videosCount} vídeos atualizados!`
            : '🔄 Recebendo atualização...'}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-gray-500 mt-2">
        {showSuccess 
          ? 'Playlist atualizada com sucesso'
          : 'Carregando novos vídeos em segundo plano'}
      </p>
    </div>
  );
};
