import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Building2, CheckCircle } from 'lucide-react';

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
}

interface NotionStyleCalendarProps {
  buildings: Building[];
}

// Status colors for calendar cards
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Ativo': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Instalação': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  'Instalação Internet': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  'Subir Nuc': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  'Manutenção': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  'Troca painel': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  'Primeira Reunião': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  'Visita Técnica': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
};

const getStatusColor = (status: string | null) => {
  return STATUS_COLORS[status || ''] || { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' };
};

// Statuses that need maintenance work
const MAINTENANCE_STATUSES = ['Instalação Internet', 'Instalação', 'Subir Nuc', 'Troca painel', 'Manutenção'];

// Building card inside calendar cell
const CalendarBuildingCard = ({ building }: { building: Building }) => {
  const colors = getStatusColor(building.notion_status);
  
  return (
    <div 
      className={`px-1.5 py-1 rounded text-[10px] truncate cursor-pointer transition-all hover:opacity-80 ${colors.bg} ${colors.text} border ${colors.border}`}
      title={`${building.nome} - ${building.notion_status || 'Sem status'}`}
    >
      <span className="font-medium truncate block">{building.nome}</span>
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

  // Group buildings by work date
  const buildingsByDate = useMemo(() => {
    const map = new Map<string, Building[]>();
    buildings.forEach(b => {
      if (b.notion_data_trabalho) {
        const dateKey = b.notion_data_trabalho.split('T')[0];
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push(b);
      }
    });
    return map;
  }, [buildings]);

  // Buildings pending work (no date scheduled)
  const pendingWork = useMemo(() => {
    return buildings.filter(b => 
      MAINTENANCE_STATUSES.includes(b.notion_status || '') &&
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
      </div>

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
              {Object.entries(STATUS_COLORS).slice(0, 6).map(([status, colors]) => (
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
