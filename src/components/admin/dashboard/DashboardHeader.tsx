import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, RefreshCw, Download } from 'lucide-react';
import AdminPeriodSelector, { PeriodType } from '@/components/admin/common/AdminPeriodSelector';
import DashboardBreadcrumb from './DashboardBreadcrumb';
import { toast } from 'sonner';

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
  const handleExportReport = () => {
    toast.info('Funcionalidade de exportação será implementada em breve');
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#9C1E1E] to-[#180A0A] rounded-xl flex items-center justify-center shadow-lg">
            <Crown className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Executivo</h1>
          </div>
        </div>
        
        <DashboardBreadcrumb periodFilter={periodFilter} />
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <AdminPeriodSelector
          value={periodFilter}
          onChange={onPeriodChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={onCustomDateChange}
        />
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefetch} className="shadow-sm flex-1 sm:flex-none touch-target">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <Button onClick={handleExportReport} className="bg-[#9C1E1E] hover:bg-[#180A0A] shadow-lg flex-1 sm:flex-none touch-target">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;