import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VideoSlot } from '@/types/videoManagement';
import { Play, Calendar, Clock, Film } from 'lucide-react';

interface VideoWeeklyScheduleProps {
  videoSlots: VideoSlot[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

export const VideoWeeklySchedule: React.FC<VideoWeeklyScheduleProps> = ({ videoSlots }) => {
  // Filtrar apenas vídeos aprovados
  const approvedVideos = videoSlots.filter(slot => 
    slot.approval_status === 'approved' && slot.video_data
  );

  // Obter vídeo base
  const baseVideo = approvedVideos.find(slot => slot.is_base_video);
  
  // Gerar programação semanal
  const generateWeeklySchedule = () => {
    const schedule: { [key: number]: any[] } = {};
    
    // Inicializar cada dia com vídeo base (se existir)
    DAYS_OF_WEEK.forEach(day => {
      schedule[day.value] = baseVideo ? [{
        type: 'base',
        video: baseVideo,
        startTime: '00:00',
        endTime: '23:59',
        isAllDay: true,
        title: baseVideo.video_data?.nome || 'Vídeo Base'
      }] : [];
    });

    // Adicionar vídeos agendados
    approvedVideos.forEach(slot => {
      if (slot.schedule_rules && slot.schedule_rules.length > 0) {
        slot.schedule_rules
          .filter(rule => rule.is_active)
          .forEach(rule => {
            rule.days_of_week.forEach(dayValue => {
              if (!schedule[dayValue]) schedule[dayValue] = [];
              
              schedule[dayValue].push({
                type: 'scheduled',
                video: slot,
                startTime: rule.start_time,
                endTime: rule.end_time,
                isAllDay: rule.is_all_day,
                title: slot.video_data?.nome || 'Vídeo Agendado'
              });
            });
          });
      }
    });

    // Ordenar por horário em cada dia
    Object.keys(schedule).forEach(day => {
      schedule[parseInt(day)].sort((a, b) => {
        if (a.type === 'base') return 1; // Base sempre por último
        if (b.type === 'base') return -1;
        return a.startTime.localeCompare(b.startTime);
      });
    });

    return schedule;
  };

  const weeklySchedule = generateWeeklySchedule();

  const formatTimeRange = (startTime: string, endTime: string, isAllDay: boolean) => {
    if (isAllDay) return 'Dia inteiro';
    return `${startTime} - ${endTime}`;
  };

  const getVideoThumbnail = (video: VideoSlot) => {
    if (video.video_data?.url) {
      return (
        <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <video 
            src={video.video_data.url} 
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
        </div>
      );
    }
    
    // Fallback para ícone
    return (
      <div className="w-16 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <Film className="h-6 w-6 text-white" />
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <span>Programação Semanal de Vídeos</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {approvedVideos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">Nenhum vídeo aprovado</p>
            <p className="text-sm">Aguarde a aprovação dos vídeos para visualizar a programação</p>
          </div>
        ) : (
          <div className="space-y-6">
            {DAYS_OF_WEEK.map(day => {
              const daySchedule = weeklySchedule[day.value] || [];
              
              return (
                <div key={day.value} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <span className="w-20">{day.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {daySchedule.length} vídeo(s)
                    </Badge>
                  </h3>
                  
                  {daySchedule.length === 0 ? (
                    <div className="text-gray-500 text-sm py-2">
                      Nenhum vídeo programado
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {daySchedule.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          {/* Thumbnail */}
                          {getVideoThumbnail(item.video)}
                          
                          {/* Informações do vídeo */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {item.title}
                              </span>
                              {item.type === 'scheduled' ? (
                                <Badge className="bg-blue-600 text-white">
                                  AGENDADO
                                </Badge>
                              ) : (
                                 <Badge variant="outline">
                                   Vídeo Principal
                                 </Badge>
                              )}
                              {item.video.selected_for_display && (
                                <Badge className="bg-green-600 text-white">
                                  <Play className="h-3 w-3 mr-1" />
                                  EM EXIBIÇÃO
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatTimeRange(item.startTime, item.endTime, item.isAllDay)}</span>
                              </span>
                              
                              {item.video.video_data?.duracao && (
                                <span>
                                  Duração: {Math.floor(item.video.video_data.duracao / 60)}:{String(item.video.video_data.duracao % 60).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};