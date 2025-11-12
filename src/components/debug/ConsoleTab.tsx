/**
 * Tab de Console do Debug Contextual
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Terminal, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ConsoleLog {
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: string;
  timestampMs: number;
  args?: any[];
}

interface ConsoleTabProps {
  consoleHistory: ConsoleLog[];
  formatTimestamp: (iso: string) => string;
}

export const ConsoleTab: React.FC<ConsoleTabProps> = ({ consoleHistory, formatTimestamp }) => {
  const getIconForType = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Terminal className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-destructive/50 bg-destructive/5';
      case 'warn':
        return 'border-yellow-600/50 bg-yellow-50 dark:bg-yellow-950/20';
      case 'info':
        return 'border-blue-600/50 bg-blue-50 dark:bg-blue-950/20';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Console Output</CardTitle>
        <CardDescription>
          Logs em tempo real do console (log, warn, error, info) - Últimas 50 mensagens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          {consoleHistory.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Nenhum log de console capturado ainda
            </div>
          ) : (
            <div className="space-y-2">
              {consoleHistory.map((log, idx) => (
                <Card key={idx} className={getColorForType(log.type)}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIconForType(log.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {log.type.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                          {log.message}
                        </pre>
                        {log.args && log.args.length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              Ver argumentos originais ({log.args.length})
                            </summary>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                              {log.args.map((arg, i) => (
                                <div key={i} className="mb-1">
                                  [{i}]: {typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)}
                                </div>
                              ))}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
