import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  AlertTriangle,
  List,
  LayoutGrid,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, startOfWeek, endOfWeek, isBefore, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { DndContext, DragOverlay, closestCenter, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import CreateTaskModal from '@/components/admin/agenda/CreateTaskModal';
import EditTaskModal from '@/components/admin/agenda/EditTaskModal';
import TaskListModal from '@/components/admin/agenda/TaskListModal';
import ScheduleTimeModal from '@/components/admin/agenda/ScheduleTimeModal';
import TaskCard, { type AgendaTask } from '@/components/admin/agenda/TaskCard';
import DraggableTaskCard from '@/components/admin/agenda/DraggableTaskCard';
import DroppableCalendarDay from '@/components/admin/agenda/DroppableCalendarDay';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useAuth } from '@/hooks/useAuth';

const PRIORIDADE_OPTIONS = ['emergencia', 'alta', 'media', 'baixa'];
const STATUS_OPTIONS = ['pendente', 'em_andamento', 'aguardando_aprovacao', 'aguardando_insumo', 'concluida', 'nao_realizada', 'cancelada'];

const STATUS_LABELS: Record<string, string> = {
  'pendente': 'Pendente',
  'em_andamento': 'Em andamento',
  'aguardando_aprovacao': 'Aguardando aprovação',
  'aguardando_insumo': 'Aguardando insumo',
  'concluida': 'Concluída',
  'nao_realizada': 'Não realizada',
  'cancelada': 'Cancelada',
};

const AgendaPage = () => {
  const queryClient = useQueryClient();
  const { logUpdate } = useActivityLogger();
  const { userProfile } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['pendente', 'em_andamento', 'aguardando_aprovacao', 'aguardando_insumo']);
  const [selectedPrioridades, setSelectedPrioridades] = useState<string[]>(PRIORIDADE_OPTIONS);
  const [activeTask, setActiveTask] = useState<AgendaTask | null>(null);
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listModalFilter, setListModalFilter] = useState<'pending' | 'overdue' | 'completed' | 'today'>('pending');
  
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleModalTask, setScheduleModalTask] = useState<AgendaTask | null>(null);
  const [scheduleModalDate, setScheduleModalDate] = useState<string | null>(null);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalTask, setEditModalTask] = useState<AgendaTask | null>(null);

  // Fetch tasks from canonical table
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['agenda-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, titulo, descricao, prioridade, status, data_prevista, horario_limite, horario_inicio, created_by, created_at, updated_at, tipo_evento, subtipo_reuniao, departamento_id, local_evento, link_reuniao, escopo, concluida_por, data_conclusao')
        .order('data_prevista', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      return (data || []) as AgendaTask[];
    }
  });

  // Update task date mutation (for drag-and-drop)
  const updateTaskMutation = useMutation({
    mutationFn: async ({ 
      taskId, 
      newDate, 
      hora, 
      tipoHorario 
    }: { 
      taskId: string; 
      newDate: string; 
      hora: string; 
      tipoHorario: 'fixo' | 'ate';
    }) => {
      const updateData: any = {
        data_prevista: newDate,
      };
      if (tipoHorario === 'fixo') {
        updateData.horario_inicio = hora;
      } else {
        updateData.horario_limite = hora;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tarefa reagendada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['agenda-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['minha-manha-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['central-tarefas'] });
      setScheduleModalOpen(false);
      setScheduleModalTask(null);
      setScheduleModalDate(null);
    },
    onError: (error: any) => {
      toast.error(`Erro ao reagendar tarefa: ${error.message}`);
    }
  });

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks?.filter(t => {
      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(t.status);
      const prioridadeMatch = selectedPrioridades.length === 0 || selectedPrioridades.includes(t.prioridade);
      return statusMatch && prioridadeMatch;
    }) || [];
  }, [tasks, selectedStatuses, selectedPrioridades]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, AgendaTask[]>();
    filteredTasks.forEach(t => {
      if (t.data_prevista) {
        const dateKey = t.data_prevista.split('T')[0];
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push(t);
      }
    });
    return map;
  }, [filteredTasks]);

  const pendingTasksWithoutDate = useMemo(() => {
    return tasks?.filter(t => !['concluida', 'cancelada', 'nao_realizada'].includes(t.status) && !t.data_prevista) || [];
  }, [tasks]);

  const allPendingTasks = useMemo(() => {
    return tasks?.filter(t => !['concluida', 'cancelada', 'nao_realizada'].includes(t.status)) || [];
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks?.filter(t => {
      if (!t.data_prevista) return false;
      if (['concluida', 'cancelada', 'nao_realizada'].includes(t.status)) return false;
      return isBefore(parseISO(t.data_prevista), today);
    }) || [];
  }, [tasks]);

  const completedTasks = useMemo(() => {
    return tasks?.filter(t => t.status === 'concluida') || [];
  }, [tasks]);

  const todayTasks = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return tasks?.filter(t => t.data_prevista === todayStr) || [];
  }, [tasks]);

  const stats = useMemo(() => ({
    pending: allPendingTasks.length,
    overdue: overdueTasks.length,
    completed: completedTasks.length,
    today: todayTasks.length,
  }), [allPendingTasks, overdueTasks, completedTasks, todayTasks]);

  const getFilteredTasksForModal = () => {
    switch (listModalFilter) {
      case 'pending': return allPendingTasks;
      case 'overdue': return overdueTasks;
      case 'completed': return completedTasks;
      case 'today': return todayTasks;
      default: return [];
    }
  };

  const handleTaskClick = (task: AgendaTask) => {
    setEditModalTask(task);
    setEditModalOpen(true);
  };

  const openListModal = (filter: 'pending' | 'overdue' | 'completed' | 'today') => {
    setListModalFilter(filter);
    setListModalOpen(true);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as AgendaTask | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const newDate = over.id as string;
    const task = active.data.current?.task as AgendaTask | undefined;
    if (!task) return;
    if (task.data_prevista?.split('T')[0] === newDate) return;

    setScheduleModalTask(task);
    setScheduleModalDate(newDate);
    setScheduleModalOpen(true);
  };

  const handleScheduleConfirm = (hora: string, tipoHorario: 'fixo' | 'ate') => {
    if (!scheduleModalTask || !scheduleModalDate) return;
    updateTaskMutation.mutate({ 
      taskId: scheduleModalTask.id, 
      newDate: scheduleModalDate,
      hora,
      tipoHorario,
    });
    logUpdate('agenda_task', scheduleModalTask.id, {
      action: 'drag_reschedule',
      task_name: scheduleModalTask.titulo,
      previous_date: scheduleModalTask.data_prevista,
      new_date: scheduleModalDate,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-5 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            Agenda
          </h1>
          <p className="text-xs text-gray-500 mt-1 ml-11">
            {tasks?.length || 0} tarefas no sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateModalOpen(true)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
          <div className="flex items-center rounded-lg border border-gray-200 p-1">
            <Button
              size="sm"
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              className="h-7 px-2"
              onClick={() => setViewMode('calendar')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              className="h-7 px-2"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <button onClick={() => openListModal('pending')} className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-left hover:shadow-md hover:scale-[1.02] transition-all">
          <div className="text-xl md:text-2xl font-bold text-amber-700">{stats.pending}</div>
          <div className="text-[10px] text-amber-600">Pendentes</div>
        </button>
        <button onClick={() => openListModal('overdue')} className="bg-red-50 rounded-xl p-3 border border-red-200 text-left hover:shadow-md hover:scale-[1.02] transition-all">
          <div className="text-xl md:text-2xl font-bold text-red-700">{stats.overdue}</div>
          <div className="text-[10px] text-red-600">Atrasadas</div>
        </button>
        <button onClick={() => openListModal('completed')} className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-left hover:shadow-md hover:scale-[1.02] transition-all">
          <div className="text-xl md:text-2xl font-bold text-emerald-700">{stats.completed}</div>
          <div className="text-[10px] text-emerald-600">Concluídas</div>
        </button>
        <button onClick={() => openListModal('today')} className="bg-blue-50 rounded-xl p-3 border border-blue-200 text-left hover:shadow-md hover:scale-[1.02] transition-all">
          <div className="text-xl md:text-2xl font-bold text-blue-700">{stats.today}</div>
          <div className="text-[10px] text-blue-600">Hoje</div>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : viewMode === 'calendar' ? (
        <DndContext 
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="font-semibold text-gray-900 min-w-[160px] text-center capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </h2>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="ml-2 h-7 px-3 text-xs" onClick={() => setCurrentMonth(new Date())}>
                    Hoje
                  </Button>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 text-xs">
                      <Filter className="h-3.5 w-3.5 mr-1.5" />
                      Filtros
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-[180px]">
                    <DropdownMenuLabel className="text-xs text-gray-500">Status</DropdownMenuLabel>
                    {STATUS_OPTIONS.map(status => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={selectedStatuses.includes(status)}
                        onCheckedChange={() => {
                          setSelectedStatuses(prev => 
                            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                          );
                        }}
                        className="text-xs"
                      >
                        {STATUS_LABELS[status] || status}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-gray-500">Prioridade</DropdownMenuLabel>
                    {PRIORIDADE_OPTIONS.map(prio => (
                      <DropdownMenuCheckboxItem
                        key={prio}
                        checked={selectedPrioridades.includes(prio)}
                        onCheckedChange={() => {
                          setSelectedPrioridades(prev => 
                            prev.includes(prio) ? prev.filter(p => p !== prio) : [...prev, prio]
                          );
                        }}
                        className="text-xs capitalize"
                      >
                        {prio}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-xs text-gray-400 font-medium py-2 uppercase">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(day => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayTasks = tasksByDate.get(dateKey) || [];
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  return (
                    <DroppableCalendarDay
                      key={dateKey}
                      day={day}
                      tasks={dayTasks}
                      isCurrentMonth={isCurrentMonth}
                      onTaskClick={handleTaskClick}
                    />
                  );
                })}
              </div>
            </div>

            {/* Pending without date */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">Tarefas Pendentes (sem data)</h3>
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                    {pendingTasksWithoutDate.length}
                  </Badge>
                  <span className="text-[10px] text-gray-400 ml-2">Arraste para agendar</span>
                </div>
                <Button size="sm" variant="ghost" className="text-xs text-gray-500" onClick={() => openListModal('pending')}>
                  Ver todas
                </Button>
              </div>
              
              {pendingTasksWithoutDate.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <CheckCircle className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">Todas as tarefas já têm data!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pendingTasksWithoutDate.slice(0, 9).map(task => (
                    <DraggableTaskCard key={task.id} task={task} showCompleteButton />
                  ))}
                </div>
              )}
              {pendingTasksWithoutDate.length > 9 && (
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm" onClick={() => openListModal('pending')}>
                    Ver mais {pendingTasksWithoutDate.length - 9} tarefas
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="opacity-90 rotate-3 scale-105">
                <TaskCard task={activeTask} showCompleteButton={false} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="space-y-4">
          {Array.from(tasksByDate.entries()).map(([date, dayTasks]) => (
            <div key={date} className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                <Badge className="bg-gray-100 text-gray-600 text-[10px]">{dayTasks.length}</Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dayTasks.map(task => (
                  <TaskCard key={task.id} task={task} showCompleteButton onClick={() => handleTaskClick(task)} />
                ))}
              </div>
            </div>
          ))}
          {pendingTasksWithoutDate.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <h3 className="font-semibold text-amber-700 text-sm mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Sem Data Definida
                <Badge className="bg-amber-100 text-amber-700 text-[10px]">{pendingTasksWithoutDate.length}</Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingTasksWithoutDate.map(task => (
                  <TaskCard key={task.id} task={task} showCompleteButton onClick={() => handleTaskClick(task)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      <TaskListModal
        open={listModalOpen}
        onOpenChange={setListModalOpen}
        filterType={listModalFilter}
        tasks={getFilteredTasksForModal()}
      />
      <ScheduleTimeModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        task={scheduleModalTask}
        targetDate={scheduleModalDate}
        onConfirm={handleScheduleConfirm}
        isLoading={updateTaskMutation.isPending}
      />
      <EditTaskModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        task={editModalTask}
      />
    </div>
  );
};

export default AgendaPage;