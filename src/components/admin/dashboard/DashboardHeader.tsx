import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, RefreshCw } from 'lucide-react';
import { ElegantPeriodType } from './ElegantPeriodButton';
import ElegantPeriodButton from './ElegantPeriodButton';
import DashboardBreadcrumb from './DashboardBreadcrumb';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardHeaderProps {
  periodFilter: ElegantPeriodType;
  onPeriodChange: (period: ElegantPeriodType) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange?: (start: Date | undefined, end: Date | undefined) => void;
  onRefetch: () => void;
}

const DashboardHeader = ({
  periodFilter,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  onRefetch
}: DashboardHeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Atualiza a cada minuto
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Left: Logo + Title compacto */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-[#9C1E1E] to-[#180A0A] rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
          <Crown className="h-4 w-4 md:h-5 md:w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-semibold text-gray-900 truncate">Dashboard</h1>
          <DashboardBreadcrumb periodFilter={periodFilter} />
        </div>
      </div>
      
      {/* Right: Actions minimalistas */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Data e hora minimalista */}
        <div className="hidden md:flex flex-col items-end text-right mr-2">
          <span className="text-xs text-muted-foreground leading-tight">
            {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </span>
          <span className="text-[10px] text-muted-foreground/70 leading-tight">
            {format(currentTime, 'HH:mm')}
          </span>
        </div>

        <ElegantPeriodButton
          value={periodFilter}
          onChange={onPeriodChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={onCustomDateChange}
        />
        
        <NotificationCenter />
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onRefetch} 
          className="h-9 w-9"
          title="Atualizar"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;