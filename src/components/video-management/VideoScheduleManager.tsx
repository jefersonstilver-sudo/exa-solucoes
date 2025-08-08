import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Calendar, 
  Play, 
  Pause, 
  Settings,
  Plus,
  Trash2
} from 'lucide-react';
import { VideoSlot } from '@/types/videoManagement';

interface ScheduleRule {
  id: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface VideoScheduleManagerProps {
  videoSlots: VideoSlot[];
  onScheduleUpdate: (videoId: string, scheduleRules: ScheduleRule[]) => Promise<void>;
  disabled?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Dom', fullLabel: 'Domingo' },
  { value: 2, label: 'Seg', fullLabel: 'Segunda' },
  { value: 3, label: 'Ter', fullLabel: 'Terça' },
  { value: 4, label: 'Qua', fullLabel: 'Quarta' },
  { value: 5, label: 'Qui', fullLabel: 'Quinta' },
  { value: 6, label: 'Sex', fullLabel: 'Sexta' },
  { value: 7, label: 'Sáb', fullLabel: 'Sábado' }
];

export const VideoScheduleManager: React.FC<VideoScheduleManagerProps> = ({
  videoSlots,
  onScheduleUpdate,
  disabled = false
}) => {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Filtrar apenas vídeos aprovados
  const approvedVideos = videoSlots.filter(slot => 
    slot.approval_status === 'approved' && 
    slot.video_data && 
    slot.video_id
  );

  const hasMultipleVideos = approvedVideos.length >= 2;

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  const formatDays = (daysOfWeek: number[]) => {
    if (daysOfWeek.length === 7) return 'Todos os dias';
    if (daysOfWeek.length === 5 && !daysOfWeek.includes(1) && !daysOfWeek.includes(7)) {
      return 'Seg a Sex';
    }
    if (daysOfWeek.length === 2 && daysOfWeek.includes(1) && daysOfWeek.includes(7)) {
      return 'Fim de semana';
    }
    
    return daysOfWeek
      .sort()
      .map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label)
      .join(', ');
  };

  const getVideoScheduleStatus = (video: VideoSlot) => {
    const hasSchedule = video.schedule_rules && video.schedule_rules.length > 0;
    const activeRules = video.schedule_rules?.filter(rule => rule.is_active) || [];
    
    if (!hasSchedule || activeRules.length === 0) {
      return {
        status: 'always',
        label: '24h todos os dias',
        color: 'bg-green-500'
      };
    }

    return {
      status: 'scheduled',
      label: `${activeRules.length} ${activeRules.length === 1 ? 'regra' : 'regras'}`,
      color: 'bg-blue-500'
    };
  };

  if (!hasMultipleVideos) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Programação de Vídeos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 font-medium">Programação Avançada Indisponível</p>
            <p className="text-sm text-gray-500 mt-2">
              Você precisa ter pelo menos 2 vídeos aprovados para programar horários específicos
            </p>
            <div className="mt-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Vídeo atual exibido 24h
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Programação de Vídeos
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            disabled={disabled}
          >
            <Settings className="h-4 w-4 mr-1" />
            {isEditing ? 'Cancelar' : 'Editar'}
          </Button>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure horários específicos para cada vídeo. Por padrão, todos os vídeos são exibidos 24h.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {approvedVideos.map((video) => {
          const scheduleStatus = getVideoScheduleStatus(video);
          
          return (
            <div key={video.video_id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Play className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{video.video_data?.nome}</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-white ${scheduleStatus.color}`}
                  >
                    {scheduleStatus.label}
                  </Badge>
                  {video.selected_for_display && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Em exibição
                    </Badge>
                  )}
                </div>
                
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVideoId(
                      selectedVideoId === video.video_id ? null : video.video_id!
                    )}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Regra
                  </Button>
                )}
              </div>

              {/* Mostrar regras de agendamento */}
              {video.schedule_rules && video.schedule_rules.length > 0 && (
                <div className="space-y-2">
                  {video.schedule_rules.map((rule) => (
                    <div 
                      key={rule.id} 
                      className="flex items-center justify-between bg-gray-50 rounded p-2 text-sm"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{formatDays(rule.days_of_week)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{formatTimeRange(rule.start_time, rule.end_time)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={rule.is_active ? "default" : "secondary"}
                          className={rule.is_active ? "bg-green-500" : ""}
                        >
                          {rule.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {isEditing && (
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Editor de nova regra */}
              {isEditing && selectedVideoId === video.video_id && (
                <div className="border-t pt-3 mt-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">Nova Regra de Agendamento</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Dias da Semana</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {DAYS_OF_WEEK.map((day) => (
                            <Button
                              key={day.value}
                              variant="outline"
                              size="sm"
                              className="w-12 h-8 p-0"
                            >
                              {day.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Horário Início</label>
                          <input
                            type="time"
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                            defaultValue="00:00"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Horário Fim</label>
                          <input
                            type="time"
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                            defaultValue="23:59"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedVideoId(null)}>
                          Cancelar
                        </Button>
                        <Button size="sm">
                          Salvar Regra
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!isEditing && (
          <div className="text-center py-4 border-t">
            <p className="text-sm text-gray-500">
              Clique em "Editar" para configurar horários específicos para cada vídeo
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};