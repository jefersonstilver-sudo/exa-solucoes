
import React from 'react';
import { Info, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useVideoSpecifications } from '@/hooks/useVideoSpecifications';

const VideoRequirements: React.FC = () => {
  const { specifications, isLoading } = useVideoSpecifications();

  if (isLoading) {
    return (
      <>
        <Separator className="my-4" />
        <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        </div>
      </>
    );
  }

  const specs = specifications?.horizontal;

  return (
    <>
      <Separator className="my-4" />
      
      <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Requisitos do vídeo:</h3>
            <ul className="mt-1 text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Formato horizontal obrigatório ({specs?.proporcao || '4:3'})</li>
              <li>Duração máxima: {specs?.duracaoSegundos || 10} segundos</li>
              <li>Tamanho máximo: 100MB</li>
              <li>Formatos aceitos: MP4, MOV, AVI</li>
              <li>Resolução recomendada: {specs?.resolucao || '1440×1080'}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default VideoRequirements;
