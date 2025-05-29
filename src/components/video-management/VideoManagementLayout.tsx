
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoPlayer } from './VideoPlayer';
import { VideoUploadArea } from './VideoUploadArea';
import { VideoList } from './VideoList';
import { VideoSlot } from '@/types/videoManagement';
import { Upload, Play } from 'lucide-react';

interface VideoManagementLayoutProps {
  videoSlots: VideoSlot[];
  uploading: boolean;
  uploadProgress: { [key: number]: number };
  onUpload: (file: File) => void;
  onSelectForDisplay: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onDownload?: (videoUrl: string, fileName: string) => void;
}

export const VideoManagementLayout: React.FC<VideoManagementLayoutProps> = ({
  videoSlots,
  uploading,
  uploadProgress,
  onUpload,
  onSelectForDisplay,
  onRemove,
  onDownload
}) => {
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>('');
  const [selectedVideoTitle, setSelectedVideoTitle] = useState<string>('');

  // Filtrar apenas slots que têm vídeos válidos
  const videosWithData = videoSlots.filter(slot => slot.video_data);
  const selectedVideo = videosWithData.find(slot => slot.selected_for_display);

  // Auto-selecionar o primeiro vídeo se nenhum estiver selecionado no player
  React.useEffect(() => {
    if (!selectedVideoUrl && selectedVideo?.video_data) {
      setSelectedVideoUrl(selectedVideo.video_data.url);
      setSelectedVideoTitle(selectedVideo.video_data.nome);
    }
  }, [selectedVideo, selectedVideoUrl]);

  const handleVideoSelect = (slot: VideoSlot) => {
    if (slot.video_data) {
      setSelectedVideoUrl(slot.video_data.url);
      setSelectedVideoTitle(slot.video_data.nome);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Gestão de Vídeos
        </h1>
        <p className="text-gray-600">
          Faça upload de até 4 vídeos e selecione 1 para exibição nos painéis
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2 text-indexa-purple" />
            Upload de Vídeo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VideoUploadArea
            onUpload={onUpload}
            uploading={uploading}
            uploadProgress={Object.values(uploadProgress)[0] || 0}
            hasMaxVideos={videosWithData.length >= 4}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Vídeos */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Play className="h-5 w-5 mr-2 text-indexa-purple" />
                Vídeos Enviados ({videosWithData.length}/4)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VideoList
                videoSlots={videosWithData}
                onVideoSelect={handleVideoSelect}
                onSelectForDisplay={onSelectForDisplay}
                onRemove={onRemove}
                selectedVideoUrl={selectedVideoUrl}
              />
            </CardContent>
          </Card>
        </div>

        {/* Player Principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Preview do Vídeo</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedVideoUrl ? (
                <div className="aspect-video">
                  <VideoPlayer
                    src={selectedVideoUrl}
                    title={selectedVideoTitle}
                    className="w-full h-full"
                    controls={true}
                    onDownload={() => onDownload?.(selectedVideoUrl, selectedVideoTitle)}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">
                      Selecione um vídeo da lista para visualizar
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
