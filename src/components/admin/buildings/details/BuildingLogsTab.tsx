
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface BuildingLogsTabProps {
  actionLogs: any[];
}

const BuildingLogsTab: React.FC<BuildingLogsTabProps> = ({ actionLogs }) => {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Histórico de Ações ({actionLogs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {actionLogs.length > 0 ? (
          <div className="space-y-4">
            {actionLogs.map((log: any) => (
              <div key={log.id} className="border-l-4 border-indexa-purple pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{log.action_description}</h4>
                    <p className="text-sm text-gray-600">
                      Tipo: <Badge variant="outline" className="text-xs">{log.action_type}</Badge>
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{formatDate(log.created_at)}</p>
                    <p>{log.users?.email || 'Sistema'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            Nenhuma ação registrada para este prédio
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BuildingLogsTab;
