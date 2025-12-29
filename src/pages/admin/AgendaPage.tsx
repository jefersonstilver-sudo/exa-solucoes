import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  ExternalLink,
  AlertTriangle,
  List,
  LayoutGrid,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, startOfWeek, endOfWeek, isBefore, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import CreateTaskModal from '@/components/admin/agenda/CreateTaskModal';
import TaskListModal from '@/components/admin/agenda/TaskListModal';
import TaskCard from '@/components/admin/agenda/TaskCard';

interface NotionTask {
  id: string;
  nome: string;
  prioridade: string | null;
  status: string | null;
  responsavel: string | null;
  responsavel_avatar: string | null;
  data: string | null;
  finalizado_por: string | null;
  categoria: string | null;
  notion_url: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'NÃO REALIZADO': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'REALIZADO': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Concluído': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const PRIORIDADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Alta': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'Baixa': { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
};

const getStatusColor = (status: string | null) => {
  if (!status) return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
  return STATUS_COLORS[status] || { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
};

const AgendaPage = () => {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['NÃO REALIZADO', 'REALIZADO', 'Concluído']);
  const [selectedPrioridades, setSelectedPrioridades] = useState<string[]>(['Alta', 'Baixa']);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listModalFilter, setListModalFilter] = useState<'pending' | 'overdue' | 'completed' | 'today'>('pending');

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['notion-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notion_tasks' as any)
        .select('*')
        .order('data', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      return (data || []) as unknown as NotionTask[];
    }
  });

  // Fetch sync logs
  const { data: syncLogs } = useQuery({
    queryKey: ['notion-task-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notion_task_sync_logs' as any)
        .select('*')
        .order('sync_started_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data as any[] || [];
    }
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-notion-tasks', {
        body: { force: true }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sincronização concluída! ${data?.stats?.created || 0} criadas, ${data?.stats?.updated || 0} atualizadas`);
      queryClient.invalidateQueries({ queryKey: ['notion-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['notion-task-sync-logs'] });
    },
    onError: (error: any) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    }
  });

  // Filter tasks for calendar view
  const filteredTasks = useMemo(() => {
    return tasks?.filter(t => {
      const statusMatch = selectedStatuses.length === 0 || 
        (t.status && selectedStatuses.includes(t.status));
      const prioridadeMatch = selectedPrioridades.length === 0 || 
        !t.prioridade || selectedPrioridades.includes(t.prioridade);
      return statusMatch && prioridadeMatch;
    }) || [];
  }, [tasks, selectedStatuses, selectedPrioridades]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, NotionTask[]>();
    filteredTasks.forEach(t => {
      if (t.data) {
        const dateKey = t.data.split('T')[0];
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push(t);
      }
    });
    return map;
  }, [filteredTasks]);

  // Pending tasks (not completed, with or without date)
  const pendingTasks = useMemo(() => {
    return tasks?.filter(t => t.status !== 'Concluído') || [];
  }, [tasks]);

  // Overdue tasks
  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks?.filter(t => {
      if (!t.data) return false;
      if (t.status === 'Concluído') return false;
      const taskDate = parseISO(t.data);
      return isBefore(taskDate, today);
    }) || [];
  }, [tasks]);

  // Completed tasks
  const completedTasks = useMemo(() => {
    return tasks?.filter(t => t.status === 'Concluído') || [];
  }, [tasks]);

  // Today's tasks
  const todayTasks = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return tasks?.filter(t => t.data === todayStr) || [];
  }, [tasks]);

  // Stats
  const stats = useMemo(() => {
    return {
      pending: pendingTasks.length,
      overdue: overdueTasks.length,
      completed: completedTasks.length,
      today: todayTasks.length,
    };
  }, [pendingTasks, overdueTasks, completedTasks, todayTasks]);

  // Get filtered tasks for modal
  const getFilteredTasksForModal = () => {
    switch (listModalFilter) {
      case 'pending': return pendingTasks;
      case 'overdue': return overdueTasks;
      case 'completed': return completedTasks;
      case 'today': return todayTasks;
      default: return [];
    }
  };

  // Open list modal with filter
  const openListModal = (filter: 'pending' | 'overdue' | 'completed' | 'today') => {
    setListModalFilter(filter);
    setListModalOpen(true);
  };

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

  const lastSync = syncLogs?.[0];

  const getTimeSinceLastSync = () => {
    if (!lastSync?.sync_started_at) return null;
    const lastSyncDate = new Date(lastSync.sync_started_at);
    const now = new Date();
    const diffMs = now.getTime() - lastSyncDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins} min`;
    return `${Math.floor(diffMins / 60)}h`;
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
          <div className="flex items-center gap-3 mt-1 ml-11">
            <p className="text-xs text-gray-500">
              {tasks?.length || 0} tarefas
            </p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-600 font-medium">Sincronizado</span>
            </div>
            {getTimeSinceLastSync() && (
              <span className="text-[10px] text-gray-400">
                Última sync: {getTimeSinceLastSync()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateModalOpen(true)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Compromisso
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
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            size="sm"
            variant="outline"
          >
            {syncMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Stats - Clickable Cards */}
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => openListModal('pending')}
          className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-left hover:shadow-md hover:scale-[1.02] transition-all"
        >
          <div className="text-xl md:text-2xl font-bold text-amber-700">{stats.pending}</div>
          <div className="text-[10px] text-amber-600">Pendentes</div>
        </button>
        <button
          onClick={() => openListModal('overdue')}
          className="bg-red-50 rounded-xl p-3 border border-red-200 text-left hover:shadow-md hover:scale-[1.02] transition-all"
        >
          <div className="text-xl md:text-2xl font-bold text-red-700">{stats.overdue}</div>
          <div className="text-[10px] text-red-600">Atrasadas</div>
        </button>
        <button
          onClick={() => openListModal('completed')}
          className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-left hover:shadow-md hover:scale-[1.02] transition-all"
        >
          <div className="text-xl md:text-2xl font-bold text-emerald-700">{stats.completed}</div>
          <div className="text-[10px] text-emerald-600">Concluídas</div>
        </button>
        <button
          onClick={() => openListModal('today')}
          className="bg-blue-50 rounded-xl p-3 border border-blue-200 text-left hover:shadow-md hover:scale-[1.02] transition-all"
        >
          <div className="text-xl md:text-2xl font-bold text-blue-700">{stats.today}</div>
          <div className="text-[10px] text-blue-600">Hoje</div>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="space-y-6">
          {/* Calendar - Full Width */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="font-semibold text-gray-900 min-w-[160px] text-center capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </h2>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2 h-7 px-3 text-xs"
                  onClick={() => setCurrentMonth(new Date())}
                >
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
                  {Object.keys(STATUS_COLORS).map(status => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={() => {
                        setSelectedStatuses(prev => 
                          prev.includes(status) 
                            ? prev.filter(s => s !== status)
                            : [...prev, status]
                        );
                      }}
                      className="text-xs"
                    >
                      {status}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-gray-500">Prioridade</DropdownMenuLabel>
                  {Object.keys(PRIORIDADE_COLORS).map(prio => (
                    <DropdownMenuCheckboxItem
                      key={prio}
                      checked={selectedPrioridades.includes(prio)}
                      onCheckedChange={() => {
                        setSelectedPrioridades(prev => 
                          prev.includes(prio) 
                            ? prev.filter(p => p !== prio)
                            : [...prev, prio]
                        );
                      }}
                      className="text-xs"
                    >
                      {prio}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs text-gray-400 font-medium py-2 uppercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid - Larger cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayTasks = tasksByDate.get(dateKey) || [];
                const isTodayDate = isToday(day);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

                return (
                  <div 
                    key={dateKey}
                    className={`
                      min-h-[120px] rounded-lg p-2 flex flex-col transition-all border
                      ${isCurrentMonth ? 'bg-gray-50 border-gray-100' : 'bg-white border-transparent'}
                      ${isTodayDate ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                    `}
                  >
                    <div className={`text-xs font-medium mb-1.5 ${isTodayDate ? 'text-blue-600' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {dayTasks.slice(0, 4).map(task => (
                        <TaskCard key={task.id} task={task} compact />
                      ))}
                      {dayTasks.length > 4 && (
                        <div className="text-[10px] text-gray-400 pl-1">+{dayTasks.length - 4} mais</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Tasks Section Below Calendar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Tarefas Pendentes</h3>
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                  {pendingTasks.length}
                </Badge>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-xs text-gray-500"
                onClick={() => openListModal('pending')}
              >
                Ver todas
              </Button>
            </div>
            
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <CheckCircle className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma tarefa pendente!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingTasks.slice(0, 9).map(task => (
                  <TaskCard key={task.id} task={task} showCompleteButton />
                ))}
              </div>
            )}
            {pendingTasks.length > 9 && (
              <div className="text-center mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openListModal('pending')}
                >
                  Ver mais {pendingTasks.length - 9} tarefas
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
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
                  <TaskCard key={task.id} task={task} showCompleteButton />
                ))}
              </div>
            </div>
          ))}
          {pendingTasks.filter(t => !t.data).length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <h3 className="font-semibold text-amber-700 text-sm mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Sem Data Definida
                <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                  {pendingTasks.filter(t => !t.data).length}
                </Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingTasks.filter(t => !t.data).map(task => (
                  <TaskCard key={task.id} task={task} showCompleteButton />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
      />
      <TaskListModal
        open={listModalOpen}
        onOpenChange={setListModalOpen}
        filterType={listModalFilter}
        tasks={getFilteredTasksForModal()}
      />
    </div>
  );
};

export default AgendaPage;
