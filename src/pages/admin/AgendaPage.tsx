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
  LayoutGrid
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

const getPrioridadeColor = (prioridade: string | null) => {
  if (!prioridade) return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
  return PRIORIDADE_COLORS[prioridade] || { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
};

const TaskCard = ({ task, compact = false }: { task: NotionTask; compact?: boolean }) => {
  const statusColors = getStatusColor(task.status);
  const prioridadeColors = getPrioridadeColor(task.prioridade);
  
  if (compact) {
    return (
      <div 
        className={`px-2 py-1 rounded text-xs cursor-pointer transition-all hover:scale-105 ${statusColors.bg} ${statusColors.text} border ${statusColors.border}`}
        title={`${task.nome} - ${task.status || 'Sem status'}`}
      >
        <div className="flex items-center gap-1">
          {task.prioridade === 'Alta' && <AlertTriangle className="h-3 w-3 text-red-500" />}
          <span className="font-medium truncate">{task.nome}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {task.prioridade && (
              <Badge className={`text-[10px] ${prioridadeColors.bg} ${prioridadeColors.text} ${prioridadeColors.border}`}>
                {task.prioridade}
              </Badge>
            )}
            {task.status && (
              <Badge className={`text-[10px] ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                {task.status}
              </Badge>
            )}
          </div>
          <h3 className="font-medium text-gray-900 text-sm">{task.nome}</h3>
          {task.responsavel && (
            <p className="text-xs text-gray-500 mt-1">👤 {task.responsavel}</p>
          )}
          {task.data && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(parseISO(task.data), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
        {task.notion_url && (
          <a
            href={task.notion_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </a>
        )}
      </div>
    </div>
  );
};

const AgendaPage = () => {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['NÃO REALIZADO', 'REALIZADO', 'Concluído']);
  const [selectedPrioridades, setSelectedPrioridades] = useState<string[]>(['Alta', 'Baixa']);

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

  // Filter tasks
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

  // Tasks without date
  const tasksWithoutDate = useMemo(() => {
    return filteredTasks.filter(t => !t.data);
  }, [filteredTasks]);

  // Overdue tasks
  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return filteredTasks.filter(t => {
      if (!t.data) return false;
      if (t.status === 'Concluído') return false;
      const taskDate = parseISO(t.data);
      return isBefore(taskDate, today);
    });
  }, [filteredTasks]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    return {
      pending: tasks?.filter(t => t.status === 'NÃO REALIZADO').length || 0,
      overdue: overdueTasks.length,
      completed: tasks?.filter(t => t.status === 'Concluído').length || 0,
      today: tasks?.filter(t => t.data === todayStr).length || 0,
    };
  }, [tasks, overdueTasks]);

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
            className="bg-blue-600 hover:bg-blue-700 text-white"
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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
          <div className="text-xl md:text-2xl font-bold text-amber-700">{stats.pending}</div>
          <div className="text-[10px] text-amber-600">Pendentes</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-200">
          <div className="text-xl md:text-2xl font-bold text-red-700">{stats.overdue}</div>
          <div className="text-[10px] text-red-600">Atrasadas</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
          <div className="text-xl md:text-2xl font-bold text-emerald-700">{stats.completed}</div>
          <div className="text-[10px] text-emerald-600">Concluídas</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
          <div className="text-xl md:text-2xl font-bold text-blue-700">{stats.today}</div>
          <div className="text-[10px] text-blue-600">Hoje</div>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-700 text-sm">Tarefas Atrasadas</h3>
            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">{overdueTasks.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {overdueTasks.slice(0, 6).map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
          {overdueTasks.length > 6 && (
            <p className="text-xs text-red-500 mt-2">+{overdueTasks.length - 6} mais tarefas atrasadas</p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Calendar */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-4">
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

            {/* Calendar Grid */}
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
                      min-h-[100px] rounded-lg p-1.5 flex flex-col transition-all border
                      ${isCurrentMonth ? 'bg-gray-50 border-gray-100' : 'bg-white border-transparent'}
                      ${isTodayDate ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                    `}
                  >
                    <div className={`text-xs font-medium mb-1 ${isTodayDate ? 'text-blue-600' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {dayTasks.slice(0, 3).map(task => (
                        <TaskCard key={task.id} task={task} compact />
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-gray-400 pl-1">+{dayTasks.length - 3} mais</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <Clock className="h-4 w-4 text-amber-500" />
                <h3 className="font-medium text-gray-900 text-sm">Sem Data Definida</h3>
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">{tasksWithoutDate.length}</Badge>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {tasksWithoutDate.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Todas agendadas!</p>
                  </div>
                ) : (
                  tasksWithoutDate.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
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
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
          {tasksWithoutDate.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <h3 className="font-semibold text-amber-700 text-sm mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Sem Data Definida
                <Badge className="bg-amber-100 text-amber-700 text-[10px]">{tasksWithoutDate.length}</Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tasksWithoutDate.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgendaPage;
