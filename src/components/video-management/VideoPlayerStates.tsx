
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, RefreshCw, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerStatesProps {
  className?: string;
  isLoading: boolean;
  hasError: boolean;
  isValidUrl: boolean;
  errorDetails?: string;
  videoUrl?: string;
  onDownload?: () => void;
  onRetry?: () => void;
}

export const VideoPlayerStates: React.FC<VideoPlayerStatesProps> = ({
  className,
  isLoading,
  hasError,
  isValidUrl,
  errorDetails,
  videoUrl,
  onDownload,
  onRetry
}) => {
  // Renderizar estado de carregamento
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

  // Renderizar estado de erro
  if (!isValidUrl || hasError) {
    return (
      <div className={cn(
        "relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center",
        className
      )}>
        <div className="text-center text-white p-8 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          
          <h3 className="text-lg font-medium mb-2">
            {!isValidUrl ? 'Vídeo não disponível' : 'Erro ao carregar vídeo'}
          </h3>
          
          {errorDetails && (
            <p className="text-sm opacity-70 mb-4 bg-red-900/30 p-2 rounded">
              {errorDetails}
            </p>
          )}
          
          {!isValidUrl && (
            <p className="text-xs opacity-60 mb-4">
              O vídeo pode não ter sido enviado corretamente ou a URL está corrompida.
            </p>
          )}
          
          {videoUrl && (
            <div className="text-xs opacity-50 mb-4 break-all bg-gray-800 p-2 rounded">
              <strong>URL:</strong> {videoUrl}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            )}
            
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
            
            {videoUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(videoUrl, '_blank')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Globe className="h-4 w-4 mr-2" />
                Abrir URL
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
