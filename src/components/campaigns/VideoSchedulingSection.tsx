import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { VideoSchedule, ScheduleRule } from '@/hooks/campaigns/useAdvancedCampaignCreation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Clock, Calendar, Plus, Trash2, Video } from 'lucide-react';

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
  { value: 0, label: 'Dom', fullName: 'Domingo' },
  { value: 1, label: 'Seg', fullName: 'Segunda-feira' },
  { value: 2, label: 'Ter', fullName: 'Terça-feira' },
  { value: 3, label: 'Qua', fullName: 'Quarta-feira' },
  { value: 4, label: 'Qui', fullName: 'Quinta-feira' },
  { value: 5, label: 'Sex', fullName: 'Sexta-feira' },
  { value: 6, label: 'Sáb', fullName: 'Sábado' }
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
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          Agendamento de Vídeos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-6 p-3 sm:p-6">
        {/* Seleção de vídeo */}
        <div className="space-y-2 sm:space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <div className="flex-1">
              <Label htmlFor="video-select" className="text-xs sm:text-sm">Selecionar Vídeo Aprovado</Label>
              <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                <SelectTrigger className="w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Selecione um vídeo..." />
                </SelectTrigger>
                <SelectContent className="max-w-none z-50">
                  {approvedVideos.map((video) => (
                    <SelectItem key={video.videos.id} value={video.videos.id} className="min-h-[50px] p-3">
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-sm">
                            {video.videos.nome}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{video.videos.duracao}s</span>
                          <span>{video.videos.orientacao}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="button"
              onClick={addVideoSchedule} 
              disabled={!selectedVideoId}
              className="self-end w-full sm:w-auto"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Adicionar</span>
            </Button>
          </div>
        </div>

        {/* Lista de vídeos agendados */}
        <div className="space-y-3 sm:space-y-4">
          {videoSchedules.map((schedule, scheduleIndex) => (
            <Card key={scheduleIndex} className="border-l-4 border-l-primary">
              <CardHeader className="pb-2 sm:pb-4 p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Play className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    <div>
                      <h4 className="font-medium text-xs sm:text-sm">{getVideoName(schedule.videoId)}</h4>
                      <p className="text-xs text-muted-foreground">
                        Slot {schedule.slotPosition} • Prioridade {schedule.priority}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVideoSchedule(scheduleIndex)}
                    className="text-destructive hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                {/* Regras de horário */}
                {schedule.scheduleRules.map((rule, ruleIndex) => (
                  <div key={ruleIndex} className="p-2 sm:p-4 border rounded-lg space-y-2 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        Regra de Horário {ruleIndex + 1}
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScheduleRule(scheduleIndex, ruleIndex)}
                        className="text-destructive hover:text-destructive h-6 w-6 sm:h-8 sm:w-8"
                      >
                        <Trash2 className="h-2 w-2 sm:h-3 sm:w-3" />
                      </Button>
                    </div>

                    {/* Dias da semana */}
                    <div>
                      <Label className="text-xs sm:text-sm">Dias da Semana</Label>
                      <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <Badge
                            key={day.value}
                            variant={rule.daysOfWeek.includes(day.value) ? "default" : "outline"}
                            className="cursor-pointer select-none hover:opacity-80 transition-opacity text-xs p-1 sm:p-2"
                            onClick={() => toggleDay(scheduleIndex, ruleIndex, day.value)}
                            title={day.fullName}
                          >
                            {day.label}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Toque nos dias para selecionar/deselecionar
                      </p>
                    </div>

                    {/* Horários */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <Label htmlFor={`start-time-${scheduleIndex}-${ruleIndex}`} className="text-xs sm:text-sm">
                          Horário de Início
                        </Label>
                        <Input
                          id={`start-time-${scheduleIndex}-${ruleIndex}`}
                          type="time"
                          value={rule.startTime}
                          onChange={(e) => updateScheduleRule(scheduleIndex, ruleIndex, 'startTime', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`end-time-${scheduleIndex}-${ruleIndex}`} className="text-xs sm:text-sm">
                          Horário de Fim
                        </Label>
                        <Input
                          id={`end-time-${scheduleIndex}-${ruleIndex}`}
                          type="time"
                          value={rule.endTime}
                          onChange={(e) => updateScheduleRule(scheduleIndex, ruleIndex, 'endTime', e.target.value)}
                          className="text-sm"
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
                      <Label htmlFor={`active-${scheduleIndex}-${ruleIndex}`} className="text-xs sm:text-sm">
                        Regra ativa
                      </Label>
                    </div>
                  </div>
                ))}

                {/* Botão para adicionar regra */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addScheduleRule(scheduleIndex)}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Adicionar Regra de Horário</span>
                </Button>
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
                      {schedule.scheduleRules.length} regra(s) de horário
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
            <p className="text-sm">Selecione um vídeo aprovado e adicione regras de horário.</p>
            <p className="text-xs mt-2">
              Ex: Configure um vídeo de segunda a quarta e outro de quarta a domingo
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};