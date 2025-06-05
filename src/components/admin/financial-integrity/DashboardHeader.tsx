
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  onRefresh: () => void;
  onRunAudit: () => void;
  loading: boolean;
  lastUpdate: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onRefresh,
  onRunAudit,
  loading,
  lastUpdate
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Integridade Financeira</h2>
          <p className="text-gray-600">Monitoramento em tempo real da saúde financeira do sistema</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={onRefresh} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            onClick={onRunAudit}
            disabled={loading}
            variant="destructive"
            size="sm"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Auditoria Emergencial
          </Button>
        </div>
      </div>

      {lastUpdate && (
        <p className="text-sm text-gray-500">
          Última atualização: {lastUpdate}
        </p>
      )}
    </div>
  );
};

export default DashboardHeader;
