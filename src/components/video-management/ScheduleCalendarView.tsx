import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Edit, Trash2, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScheduleEntry {
  id: string;
  videoName: string;
  videoId: string;
  days: number[];
  startTime: string;
  endTime: string;
  isActive: boolean;
  isAllDay: boolean;
}

interface ScheduleCalendarViewProps {
  orderId: string;
  onEdit?: (scheduleId: string) => void;
  onDelete?: (scheduleId: string) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
  { value: 1, label: 'Seg', fullLabel: 'Segunda-feira' },
  { value: 2, label: 'Ter', fullLabel: 'Terça-feira' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta-feira' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta-feira' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta-feira' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  orderId,
  onEdit,
  onDelete
}) => {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    loadSchedules();
  }, [orderId]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      console.log('📅 [CALENDAR] Carregando agendamentos para pedido:', orderId);

      const { data, error } = await supabase
        .from('campaign_schedule_rules')
        .select(`
          id,
          days_of_week,
          start_time,
          end_time,
          is_active,
          campaign_video_schedule_id,
          campaign_video_schedules!inner (
            video_id,
            pedido_id,
            videos!inner (
              id,
              nome
            )
          )
        `)
        .eq('campaign_video_schedules.pedido_id', orderId);

      if (error) throw error;

      const entries: ScheduleEntry[] = (data || []).map(rule => {
        const videoData = (rule as any).campaign_video_schedules?.videos;
        const isAllDay = rule.start_time === '00:00' && rule.end_time === '23:59';

        return {
          id: rule.id,
          videoName: videoData?.nome || 'Vídeo desconhecido',
          videoId: videoData?.id || '',
          days: rule.days_of_week,
          startTime: rule.start_time,
          endTime: rule.end_time,
          isActive: rule.is_active,
          isAllDay
        };
      });

      setSchedules(entries);
      console.log('✅ [CALENDAR] Agendamentos carregados:', entries.length);

    } catch (error) {
      console.error('❌ [CALENDAR] Erro ao carregar agendamentos:', error);
      toast.error('Erro ao carregar visualização do calendário');
    } finally {
      setLoading(false);
    }
  };

  const getSchedulesForDay = (dayValue: number) => {
    return schedules
      .filter(s => s.days.includes(dayValue))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const filteredDays = selectedDay !== null 
    ? DAYS_OF_WEEK.filter(d => d.value === selectedDay)
    : DAYS_OF_WEEK;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Carregando calendário...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Calendário de Agendamentos
          </CardTitle>
          
          {/* Filtro de Dia */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedDay === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDay(null)}
            >
              Todos
            </Button>
            {DAYS_OF_WEEK.map(day => (
              <Button
                key={day.value}
                variant={selectedDay === day.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay(day.value)}
              >
                {day.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum agendamento configurado ainda</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDays.map(day => {
              const daySchedules = getSchedulesForDay(day.value);
              
              if (daySchedules.length === 0 && selectedDay === null) {
                return null; // Não mostrar dias vazios na visualização "Todos"
              }

              return (
                <Card key={day.value} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Badge variant="outline" className="text-base">
                        {day.fullLabel}
                      </Badge>
                      {daySchedules.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          ({daySchedules.length} {daySchedules.length === 1 ? 'agendamento' : 'agendamentos'})
                        </span>
                      )}
                    </h3>

                    {daySchedules.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        Nenhum agendamento para este dia
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {daySchedules.map(schedule => (
                          <div 
                            key={schedule.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              schedule.isActive 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-gray-50 border-gray-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Video className="h-4 w-4 text-primary" />
                              <div>
                                <p className="font-medium text-sm">{schedule.videoName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {schedule.isAllDay 
                                      ? 'Dia inteiro' 
                                      : `${schedule.startTime} - ${schedule.endTime}`
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!schedule.isActive && (
                                <Badge variant="outline" className="text-xs">
                                  Inativo
                                </Badge>
                              )}
                              {onEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(schedule.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {onDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDelete(schedule.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};