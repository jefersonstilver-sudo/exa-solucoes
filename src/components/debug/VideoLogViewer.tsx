/**
 * Componente de debug para visualizar logs de ações de vídeo
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Trash2, Filter } from 'lucide-react';
import { videoLogger, createVideoChangeDump } from '@/services/logger/VideoActionLogger';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const VideoLogViewer: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const logs = videoLogger.exportLogs(
    categoryFilter === 'all' && levelFilter === 'all'
      ? undefined
      : {
          category: categoryFilter === 'all' ? undefined : categoryFilter,
          level: levelFilter === 'all' ? undefined : levelFilter
        }
  );

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      info: 'text-blue-600',
      warn: 'text-orange-600',
      error: 'text-red-600',
      debug: 'text-gray-600'
    };
    return colors[level] || 'text-gray-600';
  };

  const getLevelBadge = (level: string) => {
    const badges: Record<string, string> = {
      info: 'bg-blue-100 text-blue-800',
      warn: 'bg-orange-100 text-orange-800',
      error: 'bg-red-100 text-red-800',
      debug: 'bg-gray-100 text-gray-800'
    };
    return badges[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Video Action Logs ({logs.length})</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => videoLogger.clearLogs()}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={createVideoChangeDump}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              <SelectItem value="UI_USER_ACTION">UI User Action</SelectItem>
              <SelectItem value="DATA_FETCH">Data Fetch</SelectItem>
              <SelectItem value="EXTERNAL_API">External API</SelectItem>
              <SelectItem value="RPC_CALL">RPC Call</SelectItem>
              <SelectItem value="PROCESS">Process</SelectItem>
              <SelectItem value="CONTEXT">Context</SelectItem>
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Níveis</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warn</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log encontrado com os filtros selecionados
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelBadge(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-primary">
                    {log.category}
                  </span>
                </div>
                <div className="font-medium mb-1">{log.action}</div>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
                {log.stackTrace && (
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer">
                      Stack Trace
                    </summary>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto mt-1">
                      {log.stackTrace}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
