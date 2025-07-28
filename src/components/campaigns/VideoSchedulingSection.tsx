import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { VideoSchedule } from '@/hooks/campaigns/useAdvancedCampaignCreation';
import { Play, Calendar, Plus, Trash2 } from 'lucide-react';

interface Video {
  id: string;
  video_id: string;
  videos: {
    id: string;
    nome: string;
    url: string;
    duracao: number;
    orientacao: string;
  };
}

interface VideoSchedulingSectionProps {
  approvedVideos: Video[];
  videoSchedules: VideoSchedule[];
  onSchedulesChange: (schedules: VideoSchedule[]) => void;
}


export const VideoSchedulingSection: React.FC<VideoSchedulingSectionProps> = ({
  approvedVideos,
  videoSchedules,
  onSchedulesChange
}) => {
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');

  const addVideoSchedule = () => {
    if (!selectedVideoId) return;

    const newSchedule: VideoSchedule = {
      videoId: selectedVideoId,
      slotPosition: videoSchedules.length + 1,
      priority: 1
    };

    onSchedulesChange([...videoSchedules, newSchedule]);
    setSelectedVideoId('');
  };

  const removeVideoSchedule = (index: number) => {
    const updated = videoSchedules.filter((_, i) => i !== index);
    onSchedulesChange(updated);
  };


  const getVideoName = (videoId: string) => {
    const video = approvedVideos.find(v => v.videos.id === videoId);
    return video?.videos.nome || 'Vídeo não encontrado';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agendamento de Vídeos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção de vídeo */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="video-select">Selecionar Vídeo Aprovado</Label>
              <select
                id="video-select"
                value={selectedVideoId}
                onChange={(e) => setSelectedVideoId(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="">Selecione um vídeo...</option>
                {approvedVideos.map((video) => (
                  <option key={video.videos.id} value={video.videos.id}>
                    {video.videos.nome} ({video.videos.duracao}s - {video.videos.orientacao})
                  </option>
                ))}
              </select>
            </div>
            <Button 
              onClick={addVideoSchedule} 
              disabled={!selectedVideoId}
              className="self-end"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Lista de vídeos agendados */}
        <div className="space-y-4">
          {videoSchedules.map((schedule, scheduleIndex) => (
            <Card key={scheduleIndex} className="border-l-4 border-l-primary">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Play className="h-4 w-4 text-primary" />
                    <div>
                      <h4 className="font-medium">{getVideoName(schedule.videoId)}</h4>
                      <p className="text-sm text-muted-foreground">
                        Slot {schedule.slotPosition} • Prioridade {schedule.priority}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVideoSchedule(scheduleIndex)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Vídeo configurado para exibição conforme horários globais da campanha.
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resumo visual dos agendamentos */}
        {videoSchedules.length > 0 && (
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm">Resumo dos Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {videoSchedules.map((schedule, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-background rounded border">
                    <span className="font-medium">{getVideoName(schedule.videoId)}</span>
                    <div className="text-xs text-muted-foreground">
                      Slot {schedule.slotPosition} • Prioridade {schedule.priority}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {videoSchedules.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum vídeo agendado ainda.</p>
            <p className="text-sm">Selecione um vídeo aprovado para exibição.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};