import React from 'react';
import { Button } from '@/components/ui/button';
import { Crown, RefreshCw } from 'lucide-react';
import { ElegantPeriodType } from './ElegantPeriodButton';
import ElegantPeriodButton from './ElegantPeriodButton';
import DashboardBreadcrumb from './DashboardBreadcrumb';
import NotificationCenter from '@/components/notifications/NotificationCenter';
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
  return <div className="flex items-center justify-between gap-3">
      {/* Left: Logo + Title compacto */}
      
      
      {/* Right: Actions minimalistas */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <ElegantPeriodButton value={periodFilter} onChange={onPeriodChange} customStartDate={customStartDate} customEndDate={customEndDate} onCustomDateChange={onCustomDateChange} />
        
        <NotificationCenter />
        
        <Button variant="ghost" size="icon" onClick={onRefetch} className="h-9 w-9" title="Atualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>;
};
export default DashboardHeader;