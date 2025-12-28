import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Building2, CheckCircle, Filter, X, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface Building {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  status: string;
  notion_status: string | null;
  notion_page_id: string | null;
  notion_last_synced_at: string | null;
  notion_oti: string | null;
  notion_internal_id: number | null;
  numero_unidades: number | null;
  publico_estimado: number | null;
  notion_fotos: any;
  imagem_principal: string | null;
  notion_data_trabalho: string | null;
  notion_horario_trabalho?: string | null;
}

interface NotionStyleCalendarProps {
  buildings: Building[];
}

// Status colors for calendar cards - includes all possible statuses
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Ativo': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Online': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Instalação': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  'Instalaçao': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' }, // accent variation
  'Instalação Internet': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  'Instalaçao Internet': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' }, // accent variation
  'Subir Nuc': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  'Manutenção': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  'Manut': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  'Troca painel': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  'Primeira Reunião': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  'Visita Técnica': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'Offline': { bg: 'bg-gray-600/20', text: 'text-gray-500', border: 'border-gray-600/30' },
};

// Normalize status for comparisons (remove accents, lowercase)
const normalizeStatus = (status: string | null): string => {
  if (!status) return '';
  return status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const getStatusColor = (status: string | null) => {
  if (!status) return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' };
  // Direct match first
  if (STATUS_COLORS[status]) return STATUS_COLORS[status];
  // Try normalized match
  const normalized = normalizeStatus(status);
  for (const [key, value] of Object.entries(STATUS_COLORS)) {
    if (normalizeStatus(key) === normalized) return value;
  }
  return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' };
};

// All work-related statuses (for sidebar and filters) - INCLUDES Ativo/Online
const WORK_STATUSES = [
  'Ativo',
  'Online',
  'Instalação', 
  'Instalação Internet', 
  'Subir Nuc', 
  'Troca painel', 
  'Manutenção', 
  'Manut',
  'Visita Técnica',
  'Primeira Reunião'
];

// Helper to check if a status matches any work status (normalized comparison)
const matchesWorkStatus = (status: string | null): boolean => {
  if (!status) return false;
  const normalized = normalizeStatus(status);
  return WORK_STATUSES.some(ws => normalizeStatus(ws) === normalized);
};

// Building card inside calendar cell
const CalendarBuildingCard = ({ building }: { building: Building }) => {
  const colors = getStatusColor(building.notion_status);
  
  return (
    <div 
      className={`px-1.5 py-1 rounded text-[10px] cursor-pointer transition-all hover:opacity-80 ${colors.bg} ${colors.text} border ${colors.border}`}
      title={`${building.nome} - ${building.notion_status || 'Sem status'}${building.notion_horario_trabalho ? ` às ${building.notion_horario_trabalho}` : ''}`}
    >
      <div className="flex items-center gap-1">
        {building.notion_horario_trabalho && (
          <span className="font-bold flex-shrink-0">{building.notion_horario_trabalho}</span>
        )}
        <span className="font-medium truncate">{building.nome}</span>
      </div>
    </div>
  );
};

// Pending work sidebar item
const PendingWorkItem = ({ building }: { building: Building }) => {
  const colors = getStatusColor(building.notion_status);
  
  return (
    <div 
      className="flex items-center justify-between p-2.5 bg-[#3D3D3D] rounded-lg hover:bg-[#454545] transition-colors cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <span className="text-white text-sm font-medium truncate block">{building.nome}</span>
        <span className="text-gray-400 text-[10px] truncate block">{building.bairro}</span>
      </div>
      <Badge className={`text-[9px] ml-2 flex-shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}>
        {building.notion_status}
      </Badge>
    </div>
  );
};

export const NotionStyleCalendar = ({ buildings }: NotionStyleCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(WORK_STATUSES);
  const [showOnlyWithDate, setShowOnlyWithDate] = useState(false);

  // Filter buildings based on selected statuses (with normalized comparison)
  const filteredBuildings = useMemo(() => {
    return buildings.filter(b => {
      const buildingStatusNormalized = normalizeStatus(b.notion_status);
      const matchesStatus = selectedStatuses.length === 0 || 
        selectedStatuses.some(selected => normalizeStatus(selected) === buildingStatusNormalized);
      const matchesDateFilter = !showOnlyWithDate || b.notion_data_trabalho;
      return matchesStatus && matchesDateFilter;
    });
  }, [buildings, selectedStatuses, showOnlyWithDate]);

  // Group buildings by work date
  const buildingsByDate = useMemo(() => {
    const map = new Map<string, Building[]>();
    filteredBuildings.forEach(b => {
      if (b.notion_data_trabalho) {
        const dateKey = b.notion_data_trabalho.split('T')[0];
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push(b);
      }
    });
    // Sort buildings by time within each day
    map.forEach((dayBuildings) => {
      dayBuildings.sort((a, b) => {
        const timeA = a.notion_horario_trabalho || '99:99';
        const timeB = b.notion_horario_trabalho || '99:99';
        return timeA.localeCompare(timeB);
      });
    });
    return map;
  }, [filteredBuildings]);

  // Buildings pending work (no date scheduled) - uses normalized comparison
  const pendingWork = useMemo(() => {
    return buildings.filter(b => 
      matchesWorkStatus(b.notion_status) &&
      !b.notion_data_trabalho
    );
  }, [buildings]);

  // Calendar grid calculation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

  const goToToday = () => setCurrentMonth(new Date());

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const selectAllStatuses = () => setSelectedStatuses(WORK_STATUSES);
  const clearAllStatuses = () => setSelectedStatuses([]);

  // Count buildings per status for the filter
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    buildings.forEach(b => {
      const status = b.notion_status || 'Sem status';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [buildings]);

  return (
    <div className="bg-[#252525] rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-white font-semibold text-base min-w-[160px] text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="ml-2 h-7 px-3 text-xs bg-transparent border-gray-600 text-gray-300 hover:bg-white/10 hover:text-white"
            onClick={goToToday}
          >
            Hoje
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs bg-transparent border-gray-600 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                Status
                {selectedStatuses.length < WORK_STATUSES.length && (
                  <Badge className="ml-1.5 bg-blue-500/20 text-blue-400 text-[9px] px-1">
                    {selectedStatuses.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#2D2D2D] border-gray-700 min-w-[200px]">
              <DropdownMenuLabel className="text-gray-400 text-xs">Filtrar por Status</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <div className="flex gap-1 px-2 py-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 text-[10px] text-gray-400 hover:text-white"
                  onClick={selectAllStatuses}
                >
                  Todos
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 text-[10px] text-gray-400 hover:text-white"
                  onClick={clearAllStatuses}
                >
                  Limpar
                </Button>
              </div>
              <DropdownMenuSeparator className="bg-gray-700" />
              {WORK_STATUSES.map(status => {
                const colors = getStatusColor(status);
                return (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => toggleStatus(status)}
                    className="text-white text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className={`w-2 h-2 rounded ${colors.bg} ${colors.border} border`} />
                      <span className="flex-1">{status}</span>
                      <span className="text-gray-500 text-[10px]">{statusCounts[status] || 0}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            variant={showOnlyWithDate ? "default" : "outline"}
            className={`h-8 px-3 text-xs ${
              showOnlyWithDate 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-transparent border-gray-600 text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => setShowOnlyWithDate(!showOnlyWithDate)}
          >
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Com Data
          </Button>
        </div>
      </div>

      {/* Active filters display */}
      {selectedStatuses.length < WORK_STATUSES.length && selectedStatuses.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selectedStatuses.map(status => {
            const colors = getStatusColor(status);
            return (
              <Badge 
                key={status}
                className={`text-[10px] cursor-pointer ${colors.bg} ${colors.text} ${colors.border}`}
                onClick={() => toggleStatus(status)}
              >
                {status}
                <X className="h-2.5 w-2.5 ml-1" />
              </Badge>
            );
          })}
        </div>
      )}

      {/* Main content: Calendar + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs text-gray-500 font-medium py-2 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayBuildings = buildingsByDate.get(dateKey) || [];
              const isTodayDate = isToday(day);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

              return (
                <div 
                  key={dateKey}
                  className={`
                    min-h-[100px] rounded-lg p-1.5 flex flex-col
                    transition-all duration-200 border
                    ${isCurrentMonth ? 'bg-[#2D2D2D] border-gray-700/50' : 'bg-[#1E1E1E] border-transparent'}
                    ${isTodayDate ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-[#252525]' : ''}
                  `}
                >
                  {/* Day number */}
                  <div className={`
                    text-xs font-medium mb-1
                    ${isTodayDate ? 'text-blue-400' : isCurrentMonth ? 'text-gray-300' : 'text-gray-600'}
                  `}>
                    {format(day, 'd')}
                  </div>

                  {/* Building cards */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {dayBuildings.slice(0, 3).map(building => (
                      <CalendarBuildingCard key={building.id} building={building} />
                    ))}
                    {dayBuildings.length > 3 && (
                      <div className="text-[10px] text-gray-500 pl-1">
                        +{dayBuildings.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-gray-700/50">
            <div className="flex flex-wrap gap-3 text-[10px]">
              {Object.entries(STATUS_COLORS).slice(0, 8).map(([status, colors]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded ${colors.bg} ${colors.border} border`} />
                  <span className="text-gray-400">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Pending Work */}
        <div className="lg:col-span-1">
          <div className="bg-[#2D2D2D] rounded-xl p-3 border border-gray-700/50">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700/50">
              <Building2 className="h-4 w-4 text-amber-400" />
              <h3 className="text-white font-medium text-sm">Aguardando Agendamento</h3>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                {pendingWork.length}
              </Badge>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {pendingWork.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Todos agendados!</p>
                </div>
              ) : (
                pendingWork.map(building => (
                  <PendingWorkItem key={building.id} building={building} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotionStyleCalendar;