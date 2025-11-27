import React from 'react';
import { Button } from '@/components/ui/button';
import { Crown, RefreshCw } from 'lucide-react';
import { PeriodType } from '@/components/admin/common/AdminPeriodSelector';
import ElegantPeriodButton from './ElegantPeriodButton';
import DashboardBreadcrumb from './DashboardBreadcrumb';

interface DashboardHeaderProps {
  periodFilter: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
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
        <ElegantPeriodButton
          value={periodFilter}
          onChange={onPeriodChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={onCustomDateChange}
        />
        
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