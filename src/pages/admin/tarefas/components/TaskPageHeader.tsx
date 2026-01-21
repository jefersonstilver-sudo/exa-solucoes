/**
 * TaskPageHeader - Header reutilizável para páginas de tarefas
 * Inclui: título, data, filtros rápidos, ícone de calendário e botão CTA
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  RefreshCw, 
  Loader2,
  Clock,
  CalendarDays,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export type QuickFilter = 'hoje' | 'semana' | 'atrasadas' | 'todas';

interface TaskPageHeaderProps {
  titulo: string;
  subtitulo?: string;
  icone: React.ReactNode;
  onNovaTarefa: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  // Filtros rápidos
  quickFilter?: QuickFilter;
  onQuickFilterChange?: (filter: QuickFilter) => void;
  atrasadasCount?: number;
  // Mobile
  showCreateButtonDesktop?: boolean;
}

const quickFilterOptions: { value: QuickFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'hoje', label: 'Hoje', icon: <Clock className="h-3.5 w-3.5" /> },
  { value: 'semana', label: 'Semana', icon: <CalendarDays className="h-3.5 w-3.5" /> },
  { value: 'atrasadas', label: 'Atrasadas', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
];

export const TaskPageHeader: React.FC<TaskPageHeaderProps> = ({
  titulo,
  subtitulo,
  icone,
  onNovaTarefa,
  onRefresh,
  isRefreshing,
  quickFilter = 'hoje',
  onQuickFilterChange,
  atrasadasCount = 0,
  showCreateButtonDesktop = true
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleCalendarClick = () => {
    navigate('/super_admin/agenda');
  };

  return (
    <div className="space-y-4">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            {icone}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {titulo}
            </h1>
            <p className="text-sm text-gray-500">
              {subtitulo || format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Agenda */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCalendarClick}
            className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Agenda</span>
          </Button>

          {/* Botão Atualizar */}
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          {/* Botão Nova Tarefa - Desktop */}
          {showCreateButtonDesktop && !isMobile && (
            <Button
              onClick={onNovaTarefa}
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            >
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          )}
        </div>
      </div>

      {/* Filtros Rápidos */}
      {onQuickFilterChange && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {quickFilterOptions.map((option) => (
            <Button
              key={option.value}
              variant={quickFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onQuickFilterChange(option.value)}
              className={cn(
                "gap-1.5 whitespace-nowrap transition-all",
                quickFilter === option.value 
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" 
                  : "hover:bg-gray-50"
              )}
            >
              {option.icon}
              {option.label}
              {option.value === 'atrasadas' && atrasadasCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-1 h-5 px-1.5 text-[10px] font-bold",
                    quickFilter === option.value 
                      ? "bg-white/20 text-white" 
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {atrasadasCount}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskPageHeader;
