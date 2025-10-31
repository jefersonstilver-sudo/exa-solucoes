import React from 'react';
import { Button } from '@/components/ui/button';
import { Crown, RefreshCw, Download } from 'lucide-react';
import MonthSelector from './MonthSelector';
import DashboardBreadcrumb from './DashboardBreadcrumb';
import { toast } from 'sonner';
interface DashboardHeaderProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onRefetch: () => void;
}
const DashboardHeader = ({
  selectedMonth,
  onMonthChange,
  onRefetch
}: DashboardHeaderProps) => {
  const handleExportReport = () => {
    toast.info('Funcionalidade de exportação será implementada em breve');
  };
  return <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#9C1E1E] to-[#180A0A] rounded-xl flex items-center justify-center shadow-lg">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Executivo</h1>
            
          </div>
        </div>
        
        <DashboardBreadcrumb selectedMonth={selectedMonth} />
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onRefetch} className="shadow-sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleExportReport} className="bg-[#9C1E1E] hover:bg-[#180A0A] shadow-lg">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
    </div>;
};
export default DashboardHeader;