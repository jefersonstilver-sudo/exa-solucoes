
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoUploadAreaProps {
  onUpload: (file: File) => void;
  uploading: boolean;
  uploadProgress: number;
  hasMaxVideos: boolean;
}

export const VideoUploadArea: React.FC<VideoUploadAreaProps> = ({
  onUpload,
  uploading,
  uploadProgress,
  hasMaxVideos
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      onUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (hasMaxVideos) {
    return (
      <div className="border-2 border-gray-200 border-dashed rounded-lg p-8 text-center bg-gray-50">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Limite atingido
        </h3>
        <p className="text-gray-500">
          Você já enviou o máximo de 4 vídeos permitidos. Para enviar um novo vídeo, remova um dos existentes.
        </p>
      </div>
    );
  }

  if (uploading) {
    return (
      <div className="border-2 border-indexa-purple border-dashed rounded-lg p-8 text-center">
        <Upload className="h-12 w-12 mx-auto mb-4 text-indexa-purple animate-pulse" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Enviando vídeo...
        </h3>
        <div className="max-w-xs mx-auto mb-4">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-sm text-gray-500 mt-2">
            {Math.round(uploadProgress)}% concluído
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
        "hover:border-indexa-purple hover:bg-purple-50",
        "border-gray-300"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-medium text-gray-700 mb-2">
        Envie seu vídeo
      </h3>
      <p className="text-gray-500 mb-4">
        Arraste e solte ou clique para selecionar
      </p>
      
      <div className="text-xs text-gray-400 space-y-1">
        <p>• Formato horizontal obrigatório</p>
        <p>• Duração máxima: 15 segundos</p>
        <p>• Tamanho máximo: 100MB</p>
        <p>• Formatos: MP4, MOV, AVI</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/avi,video/mov"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
