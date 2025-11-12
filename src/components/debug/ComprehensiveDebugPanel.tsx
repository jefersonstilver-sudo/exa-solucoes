import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useComprehensiveDebug } from '@/hooks/useComprehensiveDebug';
import { 
  Copy, 
  Download, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Network,
  Terminal,
  FileText,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

export const ComprehensiveDebugPanel: React.FC = () => {
  const { 
    debugData, 
    copyCompleteDebug, 
    exportCompleteDebug,
    clearAllDebugData,
    stats 
  } = useComprehensiveDebug();
  
  const [copying, setCopying] = useState(false);

  const handleCopyComplete = async () => {
    setCopying(true);
    try {
      const data = await copyCompleteDebug();
      toast.success('🎯 Debug completo copiado! Cole no chat para análise.');
      console.log('📋 Debug completo copiado:', data.length, 'caracteres');
    } catch (error) {
      toast.error('Erro ao copiar debug');
      console.error('Erro ao copiar:', error);
    } finally {
      setCopying(false);
    }
  };

  const handleDownload = () => {
    const data = exportCompleteDebug();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-completo-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Debug exportado com sucesso');
  };

  const handleClear = () => {
    if (confirm('Limpar todos os dados de debug?')) {
      clearAllDebugData();
      toast.success('Dados de debug limpos');
    }
  };

  if (!debugData) {
    return <div>Carregando debug...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header com botões principais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">🎯 Debug Completo do Sistema</CardTitle>
              <CardDescription>
                Sessão: {debugData.session_duration} | Horário: {debugData.brasilia_time}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCopyComplete}
                disabled={copying}
                size="sm"
                variant="default"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copying ? 'Copiando...' : 'Copiar Tudo'}
              </Button>
              <Button onClick={handleDownload} size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Baixar
              </Button>
              <Button onClick={handleClear} size="sm" variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded">
              <div className="text-2xl font-bold text-red-600">{stats.totalErrors}</div>
              <div className="text-xs text-muted-foreground">Erros</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
              <div className="text-2xl font-bold text-blue-600">{stats.totalToasts}</div>
              <div className="text-xs text-muted-foreground">Notificações</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded">
              <div className="text-2xl font-bold text-purple-600">{stats.totalLogs}</div>
              <div className="text-xs text-muted-foreground">Logs</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded">
              <div className="text-2xl font-bold text-green-600">{stats.totalRequests}</div>
              <div className="text-xs text-muted-foreground">Requisições</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contexto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Contexto da Página
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <span className="font-semibold">Rota:</span>{' '}
            <code className="text-xs bg-muted px-2 py-1 rounded">{debugData.current_route}</code>
          </div>
          <div className="text-sm">
            <span className="font-semibold">URL:</span>{' '}
            <code className="text-xs bg-muted px-2 py-1 rounded break-all">{debugData.page_context.url}</code>
          </div>
          <div className="text-sm">
            <span className="font-semibold">Título:</span> {debugData.page_context.title}
          </div>
        </CardContent>
      </Card>

      {/* Tabs com dados */}
      <Tabs defaultValue="errors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="errors" className="relative">
            <AlertCircle className="w-4 h-4 mr-1" />
            Erros
            {debugData.errors.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {debugData.errors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="toasts">
            <CheckCircle className="w-4 h-4 mr-1" />
            Toasts ({debugData.toasts.length})
          </TabsTrigger>
          <TabsTrigger value="network">
            <Network className="w-4 h-4 mr-1" />
            Network ({debugData.network_requests.length})
          </TabsTrigger>
          <TabsTrigger value="console">
            <Terminal className="w-4 h-4 mr-1" />
            Console ({debugData.console_logs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-2">
          <ScrollArea className="h-[500px]">
            {debugData.errors.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                ✅ Nenhum erro registrado
              </div>
            ) : (
              debugData.errors.map((error, idx) => (
                <Card key={idx} className="mb-2 border-red-500/50">
                  <CardHeader className="py-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive">{error.type}</Badge>
                          <Badge variant="outline" className="text-xs">{error.source}</Badge>
                          <span className="text-xs text-muted-foreground">{error.timestamp}</span>
                        </div>
                        <p className="text-sm font-medium">{error.message}</p>
                      </div>
                    </div>
                  </CardHeader>
                  {error.stack && (
                    <CardContent className="py-2">
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                        {error.stack}
                      </pre>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="toasts" className="space-y-2">
          <ScrollArea className="h-[500px]">
            {debugData.toasts.map((toast, idx) => (
              <div key={idx} className="mb-2 p-3 bg-muted rounded">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={
                    toast.type === 'error' ? 'destructive' :
                    toast.type === 'success' ? 'default' :
                    'secondary'
                  }>
                    {toast.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{toast.timestamp}</span>
                </div>
                <p className="text-sm">{toast.message}</p>
              </div>
            ))}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="network" className="space-y-2">
          <ScrollArea className="h-[500px]">
            {debugData.network_requests.map((req, idx) => (
              <div key={idx} className="mb-2 p-3 bg-muted rounded">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={req.status >= 200 && req.status < 300 ? 'default' : 'destructive'}>
                      {req.method} {req.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{req.duration}ms</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{req.timestamp}</span>
                </div>
                <p className="text-xs font-mono break-all">{req.url}</p>
                {req.error && (
                  <p className="text-xs text-red-600 mt-1">Error: {req.error}</p>
                )}
              </div>
            ))}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="console" className="space-y-2">
          <ScrollArea className="h-[500px]">
            {debugData.console_logs.map((log, idx) => (
              <div key={idx} className="mb-2 p-3 bg-muted rounded">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={
                    log.level === 'error' ? 'destructive' :
                    log.level === 'warn' ? 'secondary' :
                    'outline'
                  }>
                    {log.level}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                </div>
                <pre className="text-xs whitespace-pre-wrap break-all">{log.message}</pre>
              </div>
            ))}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
