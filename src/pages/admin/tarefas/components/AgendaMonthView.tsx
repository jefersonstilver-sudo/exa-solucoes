/**
 * AgendaMonthView - Calendário mensal com DnD
 * Extraído do AgendaPage.tsx original
 */

import React, { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DndContext, DragOverlay, closestCenter, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AgendaTask } from '@/components/admin/agenda/TaskCard';
import TaskCard from '@/components/admin/agenda/TaskCard';
import DraggableTaskCard from '@/components/admin/agenda/DraggableTaskCard';
import DroppableCalendarDay from '@/components/admin/agenda/DroppableCalendarDay';
import ScheduleTimeModal from '@/components/admin/agenda/ScheduleTimeModal';

interface AgendaMonthViewProps {
  tasks: AgendaTask[];
  currentDate: Date;
  onTaskClick?: (task: AgendaTask) => void;
}

const weekDays = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

const AgendaMonthView: React.FC<AgendaMonthViewProps> = ({ tasks, currentDate, onTaskClick }) => {
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<AgendaTask | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleModalTask, setScheduleModalTask] = useState<AgendaTask | null>(null);
  const [scheduleModalDate, setScheduleModalDate] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const tasksByDate = useMemo(() => {
    const map = new Map<string, AgendaTask[]>();
    tasks.forEach(t => {
      if (t.data_prevista) {
        const dateKey = t.data_prevista.split('T')[0];
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push(t);
      }
    });
    return map;
  }, [tasks]);

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, newDate, hora, tipoHorario }: { taskId: string; newDate: string; hora: string; tipoHorario: 'fixo' | 'ate' }) => {
      const updateData: Record<string, string> = { data_prevista: newDate };
      if (tipoHorario === 'fixo') updateData.horario_inicio = hora;
      else updateData.horario_limite = hora;

      const { error } = await supabase.from('tasks').update(updateData).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tarefa reagendada!');
      queryClient.invalidateQueries({ queryKey: ['agenda-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['minha-manha-tasks-v2'] });
      queryClient.invalidateQueries({ queryKey: ['central-tarefas'] });
      setScheduleModalOpen(false);
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as AgendaTask | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const task = active.data.current?.task as AgendaTask | undefined;
    if (!task) return;
    const newDate = over.id as string;
    if (task.data_prevista?.split('T')[0] === newDate) return;
    setScheduleModalTask(task);
    setScheduleModalDate(newDate);
    setScheduleModalOpen(true);
  };

  const handleScheduleConfirm = (hora: string, tipoHorario: 'fixo' | 'ate') => {
    if (!scheduleModalTask || !scheduleModalDate) return;
    updateTaskMutation.mutate({ taskId: scheduleModalTask.id, newDate: scheduleModalDate, hora, tipoHorario });
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* Month name */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h3>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2 uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDate.get(dateKey) || [];
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            return (
              <DroppableCalendarDay
                key={dateKey}
                day={day}
                tasks={dayTasks}
                isCurrentMonth={isCurrentMonth}
                onTaskClick={onTaskClick}
              />
            );
          })}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} compact />}
      </DragOverlay>

      {/* Schedule modal for DnD */}
      <ScheduleTimeModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        taskName={scheduleModalTask?.titulo || ''}
        targetDate={scheduleModalDate || ''}
        onConfirm={handleScheduleConfirm}
        isLoading={updateTaskMutation.isPending}
      />
    </DndContext>
  );
};

export default AgendaMonthView;
