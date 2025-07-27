import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { VideoSchedule, ScheduleRule } from '@/hooks/campaigns/useAdvancedCampaignCreation';
import { Play, Clock, Calendar, Plus, Trash2 } from 'lucide-react';

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

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' }
];

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
      priority: 1,
      scheduleRules: []
    };

    onSchedulesChange([...videoSchedules, newSchedule]);
    setSelectedVideoId('');
  };

  const removeVideoSchedule = (index: number) => {
    const updated = videoSchedules.filter((_, i) => i !== index);
    onSchedulesChange(updated);
  };

  const addScheduleRule = (scheduleIndex: number) => {
    const newRule: ScheduleRule = {
      daysOfWeek: [1, 2, 3, 4, 5], // Segunda a sexta por padrão
      startTime: '08:00',
      endTime: '18:00',
      isActive: true
    };

    const updated = [...videoSchedules];
    updated[scheduleIndex].scheduleRules.push(newRule);
    onSchedulesChange(updated);
  };

  const updateScheduleRule = (scheduleIndex: number, ruleIndex: number, field: keyof ScheduleRule, value: any) => {
    const updated = [...videoSchedules];
    updated[scheduleIndex].scheduleRules[ruleIndex] = {
      ...updated[scheduleIndex].scheduleRules[ruleIndex],
      [field]: value
    };
    onSchedulesChange(updated);
  };

  const removeScheduleRule = (scheduleIndex: number, ruleIndex: number) => {
    const updated = [...videoSchedules];
    updated[scheduleIndex].scheduleRules.splice(ruleIndex, 1);
    onSchedulesChange(updated);
  };

  const toggleDay = (scheduleIndex: number, ruleIndex: number, day: number) => {
    const rule = videoSchedules[scheduleIndex].scheduleRules[ruleIndex];
    const currentDays = rule.daysOfWeek;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    
    updateScheduleRule(scheduleIndex, ruleIndex, 'daysOfWeek', newDays);
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
              <CardContent className="space-y-4">
                {/* Regras de horário */}
                {schedule.scheduleRules.map((rule, ruleIndex) => (
                  <div key={ruleIndex} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Regra de Horário {ruleIndex + 1}
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScheduleRule(scheduleIndex, ruleIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Dias da semana */}
                    <div>
                      <Label className="text-sm">Dias da Semana</Label>
                      <div className="flex gap-2 mt-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <Badge
                            key={day.value}
                            variant={rule.daysOfWeek.includes(day.value) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleDay(scheduleIndex, ruleIndex, day.value)}
                          >
                            {day.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Horários */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`start-time-${scheduleIndex}-${ruleIndex}`}>
                          Horário de Início
                        </Label>
                        <Input
                          id={`start-time-${scheduleIndex}-${ruleIndex}`}
                          type="time"
                          value={rule.startTime}
                          onChange={(e) => updateScheduleRule(scheduleIndex, ruleIndex, 'startTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`end-time-${scheduleIndex}-${ruleIndex}`}>
                          Horário de Fim
                        </Label>
                        <Input
                          id={`end-time-${scheduleIndex}-${ruleIndex}`}
                          type="time"
                          value={rule.endTime}
                          onChange={(e) => updateScheduleRule(scheduleIndex, ruleIndex, 'endTime', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Status ativo */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`active-${scheduleIndex}-${ruleIndex}`}
                        checked={rule.isActive}
                        onCheckedChange={(checked) => 
                          updateScheduleRule(scheduleIndex, ruleIndex, 'isActive', checked)
                        }
                      />
                      <Label htmlFor={`active-${scheduleIndex}-${ruleIndex}`}>
                        Regra ativa
                      </Label>
                    </div>
                  </div>
                ))}

                {/* Botão para adicionar regra */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addScheduleRule(scheduleIndex)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Regra de Horário
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {videoSchedules.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum vídeo agendado ainda.</p>
            <p className="text-sm">Selecione um vídeo aprovado e adicione regras de horário.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};