import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MiniCalendarProps {
  selectedDate?: Date;
  highlightedDates?: Date[];
  onDateSelect?: (date: Date) => void;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  selectedDate,
  highlightedDates = [],
  onDateSelect
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const isHighlighted = (date: Date) => 
    highlightedDates.some(d => isSameDay(d, date));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const hasEvent = isHighlighted(day);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={i}
              onClick={() => onDateSelect?.(day)}
              className={cn(
                "relative w-7 h-7 flex items-center justify-center rounded-full text-xs transition-all",
                !isCurrentMonth && "text-gray-300",
                isCurrentMonth && !isSelected && "text-gray-700 hover:bg-gray-100",
                isSelected && "bg-[#9C1E1E] text-white font-medium",
                isToday && !isSelected && "border border-[#9C1E1E] text-[#9C1E1E] font-medium"
              )}
            >
              {format(day, 'd')}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#9C1E1E]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
