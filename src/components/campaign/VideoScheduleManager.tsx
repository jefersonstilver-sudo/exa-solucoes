import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { DaysOfWeekSelector } from "./DaysOfWeekSelector";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { VideoSlot } from "@/types/videoManagement";
import { VideoScheduleInput, ScheduleRuleInput } from "@/types/campaignScheduling";

interface VideoScheduleManagerProps {
  approvedVideos: VideoSlot[];
  videoSchedules: VideoScheduleInput[];
  onSchedulesChange: (schedules: VideoScheduleInput[]) => void;
}

export const VideoScheduleManager = ({
  approvedVideos,
  videoSchedules,
  onSchedulesChange
}: VideoScheduleManagerProps) => {
  const addVideoSchedule = () => {
    if (approvedVideos.length === 0) return;
    
    const newSchedule: VideoScheduleInput = {
      video_id: approvedVideos[0].video_data?.id || '',
      slot_position: videoSchedules.length + 1,
      priority: 1,
      schedule_rules: [{
        days_of_week: [1, 2, 3, 4, 5], // Monday to Friday
        start_time: '08:00',
        end_time: '18:00',
        is_active: true
      }]
    };
    
    onSchedulesChange([...videoSchedules, newSchedule]);
  };

  const removeVideoSchedule = (index: number) => {
    const newSchedules = videoSchedules.filter((_, i) => i !== index);
    onSchedulesChange(newSchedules);
  };

  const updateVideoSchedule = (index: number, updates: Partial<VideoScheduleInput>) => {
    const newSchedules = [...videoSchedules];
    newSchedules[index] = { ...newSchedules[index], ...updates };
    onSchedulesChange(newSchedules);
  };

  const addScheduleRule = (scheduleIndex: number) => {
    const newRule: ScheduleRuleInput = {
      days_of_week: [],
      start_time: '08:00',
      end_time: '18:00',
      is_active: true
    };
    
    const newSchedules = [...videoSchedules];
    newSchedules[scheduleIndex].schedule_rules.push(newRule);
    onSchedulesChange(newSchedules);
  };

  const removeScheduleRule = (scheduleIndex: number, ruleIndex: number) => {
    const newSchedules = [...videoSchedules];
    newSchedules[scheduleIndex].schedule_rules = 
      newSchedules[scheduleIndex].schedule_rules.filter((_, i) => i !== ruleIndex);
    onSchedulesChange(newSchedules);
  };

  const updateScheduleRule = (
    scheduleIndex: number, 
    ruleIndex: number, 
    updates: Partial<ScheduleRuleInput>
  ) => {
    const newSchedules = [...videoSchedules];
    newSchedules[scheduleIndex].schedule_rules[ruleIndex] = {
      ...newSchedules[scheduleIndex].schedule_rules[ruleIndex],
      ...updates
    };
    onSchedulesChange(newSchedules);
  };

  if (approvedVideos.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <p>Nenhum vídeo aprovado disponível para agendamento.</p>
          <p className="text-sm mt-2">
            Aguarde a aprovação dos vídeos enviados para criar campanhas.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Agendamento de Vídeos</h3>
        <Button onClick={addVideoSchedule} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Vídeo
        </Button>
      </div>

      {videoSchedules.map((schedule, scheduleIndex) => {
        const selectedVideo = approvedVideos.find(v => v.video_data?.id === schedule.video_id);
        
        return (
          <Card key={scheduleIndex} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Vídeo {scheduleIndex + 1}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeVideoSchedule(scheduleIndex)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vídeo</Label>
                  <select
                    value={schedule.video_id}
                    onChange={(e) => updateVideoSchedule(scheduleIndex, { video_id: e.target.value })}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    {approvedVideos.map((video) => (
                      <option key={video.video_data?.id} value={video.video_data?.id}>
                        {video.video_data?.nome || 'Vídeo sem nome'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={schedule.priority}
                    onChange={(e) => updateVideoSchedule(scheduleIndex, { 
                      priority: parseInt(e.target.value) || 1 
                    })}
                  />
                </div>
              </div>

              {selectedVideo && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>Título:</strong> {selectedVideo.video_data?.nome}<br/>
                    <strong>Duração:</strong> {selectedVideo.video_data?.duracao}s<br/>
                    <strong>Orientação:</strong> {selectedVideo.video_data?.orientacao}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Regras de Agendamento</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addScheduleRule(scheduleIndex)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Regra
                  </Button>
                </div>

                {schedule.schedule_rules.map((rule, ruleIndex) => (
                  <Card key={ruleIndex} className="p-4 bg-muted/50">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-sm font-medium">Regra {ruleIndex + 1}</h5>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScheduleRule(scheduleIndex, ruleIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <DaysOfWeekSelector
                        selectedDays={rule.days_of_week}
                        onSelectionChange={(days) => 
                          updateScheduleRule(scheduleIndex, ruleIndex, { days_of_week: days })
                        }
                      />

                      <TimeRangeSelector
                        startTime={rule.start_time}
                        endTime={rule.end_time}
                        onStartTimeChange={(time) => 
                          updateScheduleRule(scheduleIndex, ruleIndex, { start_time: time })
                        }
                        onEndTimeChange={(time) => 
                          updateScheduleRule(scheduleIndex, ruleIndex, { end_time: time })
                        }
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        );
      })}

      {videoSchedules.length === 0 && (
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Nenhum vídeo agendado ainda.</p>
            <p className="text-sm mt-2">
              Clique em "Adicionar Vídeo" para começar a criar sua campanha.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};