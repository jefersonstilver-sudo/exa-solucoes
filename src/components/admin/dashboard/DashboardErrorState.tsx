
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface DashboardErrorStateProps {
  error: string;
  onRefetch: () => void;
}

const DashboardErrorState = ({ error, onRefetch }: DashboardErrorStateProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="text-red-600 text-lg font-semibold">Erro ao carregar dashboard</div>
        <p className="text-gray-600">{error}</p>
        <Button onClick={onRefetch} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    </div>
  );
};

export default DashboardErrorState;
