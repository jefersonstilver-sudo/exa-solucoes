
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerStatesProps {
  className?: string;
  isLoading: boolean;
  hasError: boolean;
  isValidUrl: boolean;
  onDownload?: () => void;
}

export const VideoPlayerStates: React.FC<VideoPlayerStatesProps> = ({
  className,
  isLoading,
  hasError,
  isValidUrl,
  onDownload
}) => {
  // Renderizar estado de erro ou carregamento
  if (!isValidUrl || hasError) {
    return (
      <div className={cn(
        "relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center",
        className
      )}>
        <div className="text-center text-white p-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-sm opacity-70 mb-4">
            {!isValidUrl ? 'Vídeo não disponível' : 'Erro ao carregar vídeo'}
          </p>
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar arquivo
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn(
        "relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center",
        className
      )}>
        <div className="text-center text-white p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-sm opacity-70">Carregando vídeo...</p>
        </div>
      </div>
    );
  }

  return null;
};
