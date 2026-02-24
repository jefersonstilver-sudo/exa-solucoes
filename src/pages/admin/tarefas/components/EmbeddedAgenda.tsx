/**
 * EmbeddedAgenda - Wrapper com 3 sub-abas (Dia/Semana/Mês)
 * Recebe tasks como prop, controla navegação de datas internamente
 */

import React, { useState } from 'react';
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays, Calendar, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { AgendaTask } from '@/components/admin/agenda/TaskCard';
import AgendaDayView from './AgendaDayView';
import AgendaWeekView from './AgendaWeekView';
import AgendaMonthView from './AgendaMonthView';
import EditTaskModal from '@/components/admin/agenda/EditTaskModal';

interface EmbeddedAgendaProps {
  tasks: AgendaTask[];
  filterTrigger?: React.ReactNode;
}

type AgendaView = 'dia' | 'semana' | 'mes';

const EmbeddedAgenda: React.FC<EmbeddedAgendaProps> = ({ tasks, filterTrigger }) => {
  const [view, setView] = useState<AgendaView>('dia');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalTask, setEditModalTask] = useState<AgendaTask | null>(null);

  const handlePrev = () => {
    if (view === 'dia') setCurrentDate(prev => subDays(prev, 1));
    else if (view === 'semana') setCurrentDate(prev => subWeeks(prev, 1));
    else setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNext = () => {
    if (view === 'dia') setCurrentDate(prev => addDays(prev, 1));
    else if (view === 'semana') setCurrentDate(prev => addWeeks(prev, 1));
    else setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleTaskClick = (task: AgendaTask) => {
    setEditModalTask(task);
    setEditModalOpen(true);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-foreground">Agenda</h2>
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={handleToday}>
              Hoje
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter trigger slot */}
          {filterTrigger}

          {/* View tabs */}
          <Tabs value={view} onValueChange={(v) => setView(v as AgendaView)}>
            <TabsList className="h-8">
              <TabsTrigger value="dia" className="text-xs px-3 h-6 gap-1">
                <Calendar className="h-3 w-3" />
                Dia
              </TabsTrigger>
              <TabsTrigger value="semana" className="text-xs px-3 h-6 gap-1">
                <CalendarDays className="h-3 w-3" />
                Semana
              </TabsTrigger>
              <TabsTrigger value="mes" className="text-xs px-3 h-6 gap-1">
                <LayoutGrid className="h-3 w-3" />
                Mês
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      {view === 'dia' && (
        <AgendaDayView tasks={tasks} currentDate={currentDate} onTaskClick={handleTaskClick} />
      )}
      {view === 'semana' && (
        <AgendaWeekView tasks={tasks} currentDate={currentDate} onTaskClick={handleTaskClick} />
      )}
      {view === 'mes' && (
        <AgendaMonthView tasks={tasks} currentDate={currentDate} onTaskClick={handleTaskClick} />
      )}

      {/* Edit Modal */}
      <EditTaskModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        task={editModalTask}
      />
    </div>
  );
};

export default EmbeddedAgenda;
