import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check, Database } from 'lucide-react';

interface DataIntegrityBadgeProps {
  isRealData: boolean;
  dataSource?: string;
  recordCount?: number;
  lastUpdate?: string;
}

const DataIntegrityBadge: React.FC<DataIntegrityBadgeProps> = ({
  isRealData,
  dataSource = 'Supabase',
  recordCount,
  lastUpdate
}) => {
  if (isRealData) {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <Check className="h-3 w-3 mr-1" />
          DADOS REAIS
        </Badge>
        {recordCount !== undefined && (
          <Badge variant="outline" className="text-xs">
            <Database className="h-3 w-3 mr-1" />
            {recordCount} registros
          </Badge>
        )}
        {lastUpdate && (
          <span className="text-xs text-gray-500">
            Atualizado: {new Date(lastUpdate).toLocaleString('pt-BR')}
          </span>
        )}
      </div>
    );
  }

  return (
    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
      <AlertTriangle className="h-3 w-3 mr-1" />
      DADOS FICTÍCIOS DETECTADOS
    </Badge>
  );
};

export default DataIntegrityBadge;