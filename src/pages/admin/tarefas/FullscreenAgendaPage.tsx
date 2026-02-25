/**
 * FullscreenAgendaPage - Modo imersivo fullscreen da agenda
 * Layout limpo, sem header/sidebar, calendario ocupa 100% da tela
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, ChevronLeft, ChevronRight, X, Calendar, CalendarDays, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AgendaTask } from '@/components/admin/agenda/TaskCard';
import AgendaDayView from './components/AgendaDayView';
import AgendaWeekView from './components/AgendaWeekView';
import AgendaMonthView from './components/AgendaMonthView';
import EditTaskModal from '@/components/admin/agenda/EditTaskModal';

type AgendaView = 'dia' | 'semana' | 'mes';

const FullscreenAgendaPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<AgendaView>('mes');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalTask, setEditModalTask] = useState<AgendaTask | null>(null);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  // Same query as CentralTarefasPage
  const { data: tasks = [] } = useQuery({
    queryKey: ['agenda-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, titulo, descricao, prioridade, status, data_prevista, horario_limite, horario_inicio, created_by, created_at, updated_at, tipo_evento, subtipo_reuniao, departamento_id, local_evento, link_reuniao, escopo, concluida_por, data_conclusao, todos_responsaveis, task_responsaveis(user_id, users:user_id(nome))')
        .order('data_prevista', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as AgendaTask[];
    }
  });

  const handlePrev = useCallback(() => {
    if (view === 'dia') setCurrentDate(prev => subDays(prev, 1));
    else if (view === 'semana') setCurrentDate(prev => subWeeks(prev, 1));
    else setCurrentDate(prev => subMonths(prev, 1));
  }, [view]);

  const handleNext = useCallback(() => {
    if (view === 'dia') setCurrentDate(prev => addDays(prev, 1));
    else if (view === 'semana') setCurrentDate(prev => addWeeks(prev, 1));
    else setCurrentDate(prev => addMonths(prev, 1));
  }, [view]);

  const handleToday = useCallback(() => setCurrentDate(new Date()), []);

  const handleTaskClick = useCallback((task: AgendaTask) => {
    setEditModalTask(task);
    setEditModalOpen(true);
  }, []);

  const handleClose = useCallback(() => navigate(-1), [navigate]);

  // Period title
  const periodTitle = (() => {
    if (view === 'dia') return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    if (view === 'semana') return format(currentDate, "'Semana de' d 'de' MMMM", { locale: ptBR });
    return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
  })();

  return (
    <div className="h-screen w-full flex flex-col bg-background animate-fade-in overflow-hidden">
      {/* Minimal Header */}
      <header className="flex-shrink-0 h-12 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-3 md:px-6 z-10">
        {/* Left: Back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Voltar</span>
        </Button>

        {/* Center: Title + Navigation */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h1 className="text-sm md:text-base font-semibold text-foreground capitalize min-w-[140px] md:min-w-[220px] text-center">
            {periodTitle}
          </h1>
          
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs hidden sm:flex"
            onClick={handleToday}
          >
            Hoje
          </Button>
        </div>

        {/* Right: View tabs + Close */}
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as AgendaView)}>
            <TabsList className="h-8 bg-muted/50">
              <TabsTrigger value="dia" className="text-xs px-2 md:px-3 h-6 gap-1">
                <Calendar className="h-3 w-3" />
                <span className="hidden md:inline">Dia</span>
              </TabsTrigger>
              <TabsTrigger value="semana" className="text-xs px-2 md:px-3 h-6 gap-1">
                <CalendarDays className="h-3 w-3" />
                <span className="hidden md:inline">Semana</span>
              </TabsTrigger>
              <TabsTrigger value="mes" className="text-xs px-2 md:px-3 h-6 gap-1">
                <LayoutGrid className="h-3 w-3" />
                <span className="hidden md:inline">Mês</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Calendar Content - fills remaining space */}
      <main className="flex-1 overflow-y-auto p-2 md:p-4">
        <div className="transition-opacity duration-200">
          {view === 'dia' && (
            <AgendaDayView tasks={tasks} currentDate={currentDate} onTaskClick={handleTaskClick} fullscreen />
          )}
          {view === 'semana' && (
            <AgendaWeekView tasks={tasks} currentDate={currentDate} onTaskClick={handleTaskClick} fullscreen />
          )}
          {view === 'mes' && (
            <AgendaMonthView tasks={tasks} currentDate={currentDate} onTaskClick={handleTaskClick} fullscreen />
          )}
        </div>
      </main>

      {/* Edit Modal */}
      <EditTaskModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        task={editModalTask}
      />
    </div>
  );
};

export default FullscreenAgendaPage;
