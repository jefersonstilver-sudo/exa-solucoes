
import React from 'react';

interface VideoSlotInfoProps {
  videoData: {
    id: string;
    nome: string;
    url: string;
    duracao: number;
    orientacao: string;
    tem_audio: boolean;
    tamanho_arquivo?: number;
    formato?: string;
  };
}

export const VideoSlotInfo: React.FC<VideoSlotInfoProps> = ({ videoData }) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number) => {
    return `${seconds}s`;
  };

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm truncate text-gray-900" title={videoData.nome}>
        {videoData.nome}
      </h4>
      <div className="flex justify-between text-xs text-gray-600">
        <span>{formatDuration(videoData.duracao)}</span>
        <span>{videoData.orientacao}</span>
        <span>{formatFileSize(videoData.tamanho_arquivo)}</span>
      </div>
    </div>
  );
};
