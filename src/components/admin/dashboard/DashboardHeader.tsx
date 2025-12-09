import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChartBar } from 'lucide-react';
import { ElegantPeriodType } from './ElegantPeriodButton';
import ElegantPeriodButton from './ElegantPeriodButton';

interface DashboardHeaderProps {
  periodFilter: ElegantPeriodType;
  onPeriodChange: (period: ElegantPeriodType) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange?: (start: Date | undefined, end: Date | undefined) => void;
  onRefetch: () => void;
  showSecondaryStats?: boolean;
  onToggleSecondaryStats?: () => void;
  savePeriodEnabled?: boolean;
  onSavePeriodChange?: (enabled: boolean) => void;
}

const DashboardHeader = ({
  periodFilter,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  onRefetch,
  showSecondaryStats = false,
  onToggleSecondaryStats,
  savePeriodEnabled = false,
  onSavePeriodChange
}: DashboardHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
        <ElegantPeriodButton 
          value={periodFilter} 
          onChange={onPeriodChange} 
          customStartDate={customStartDate} 
          customEndDate={customEndDate} 
          onCustomDateChange={onCustomDateChange}
          savePeriodEnabled={savePeriodEnabled}
          onSavePeriodChange={onSavePeriodChange}
        />
        
        {onToggleSecondaryStats && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleSecondaryStats}
            className={`h-9 w-9 ${showSecondaryStats ? 'bg-accent' : ''}`}
            title="Métricas de Agentes"
          >
            <ChartBar className="h-4 w-4" />
          </Button>
        )}
        
        <Button variant="ghost" size="icon" onClick={onRefetch} className="h-9 w-9" title="Atualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;