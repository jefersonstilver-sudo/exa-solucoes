/**
 * Painel de Debug Contextual - Análise específica da página atual
 */

import React, { useState } from 'react';
import { usePageDebug } from '@/hooks/usePageDebug';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ConsoleTab } from './ConsoleTab';
import { DebugControlPanel } from './DebugControlPanel';
import { 
  AlertCircle, 
  FileCode, 
  Activity, 
  Database, 
  Zap,
  Download,
  ExternalLink,
  Globe,
  Clock,
  Terminal,
  TrendingUp
} from 'lucide-react';

interface ContextualDebugPanelProps {
  onOpenGlobalDebug: () => void;
}

export const ContextualDebugPanel: React.FC<ContextualDebugPanelProps> = ({ onOpenGlobalDebug }) => {
  const { debugData, exportDebugData, clearErrors } = usePageDebug();
  const { pageInfo, currentPath, detectedErrors, recentApiCalls, performanceMetrics, consoleHistory, sessionStartTime, componentState } = debugData;
  
  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  };
  
  const getSessionDuration = () => {
    const start = new Date(sessionStartTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (!pageInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-600">⚠️ Página Não Mapeada</CardTitle>
          <CardDescription>
            Esta página ainda não está registrada no sistema de debug.
            <br />Caminho atual: <code className="text-xs bg-muted px-1 py-0.5 rounded">{currentPath}</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onOpenGlobalDebug} variant="outline" className="w-full">
            <Globe className="w-4 h-4 mr-2" />
            Abrir Debug Global
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">🔍 {pageInfo.pageName}</CardTitle>
              <CardDescription className="mt-2 space-y-1">
                <code className="text-xs bg-muted px-2 py-1 rounded block">{pageInfo.pageFile}</code>
                <div className="flex items-center gap-4 text-xs mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Sessão: {getSessionDuration()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Iniciado em: {formatTimestamp(sessionStartTime)}
                  </span>
                </div>
              </CardDescription>
            </div>
            <Button onClick={onOpenGlobalDebug} variant="outline" size="sm">
              <Globe className="w-4 h-4 mr-2" />
              Debug Global
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Debug Control Panel */}
      <DebugControlPanel />

      {/* Tabs */}
      <Tabs defaultValue="errors" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="errors" className="relative">
            <AlertCircle className="w-4 h-4 mr-1" />
            Erros
            {detectedErrors.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {detectedErrors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="console" className="relative">
            <Terminal className="w-4 h-4 mr-1" />
            Console
            {consoleHistory.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {consoleHistory.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="apis">
            <Database className="w-4 h-4 mr-1" />
            APIs
          </TabsTrigger>
          <TabsTrigger value="state">
            <Zap className="w-4 h-4 mr-1" />
            Estado
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileCode className="w-4 h-4 mr-1" />
            Arquivos
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Activity className="w-4 h-4 mr-1" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Erros Detectados */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Erros Conhecidos desta Página</CardTitle>
                {detectedErrors.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearErrors}>
                    Limpar
                  </Button>
                )}
              </div>
              <CardDescription>
                Erros comuns mapeados para esta página
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {pageInfo.commonErrors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum erro comum mapeado</p>
                ) : (
                  <div className="space-y-4">
                    {pageInfo.commonErrors.map((error, idx) => (
                      <Card key={idx} className="border-destructive/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="destructive">{error.code}</Badge>
                                <Badge variant="outline" className="text-xs">
                                  Mapeado
                                </Badge>
                              </div>
                              <CardTitle className="text-base">{error.description}</CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-green-600">💡 Solução:</p>
                            <p className="text-sm text-muted-foreground">{error.solution}</p>
                          </div>
                          {error.sqlFix && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-blue-600">🔧 SQL Fix:</p>
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto font-mono">
                                {error.sqlFix}
                              </pre>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2"
                                onClick={() => {
                                  navigator.clipboard.writeText(error.sqlFix!);
                                }}
                              >
                                Copiar SQL
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    
                    {detectedErrors.length > 0 && (
                      <>
                        <Separator className="my-4" />
                        <h3 className="text-sm font-semibold mb-2 text-destructive">
                          Erros Detectados em Tempo Real ({detectedErrors.length})
                        </h3>
                        {detectedErrors.map((error, idx) => (
                          <Card key={idx} className="border-destructive">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="destructive">{error.code}</Badge>
                                    <Badge 
                                      variant={
                                        error.severity === 'critical' ? 'destructive' :
                                        error.severity === 'high' ? 'destructive' :
                                        'secondary'
                                      }
                                      className="text-xs"
                                    >
                                      {error.severity?.toUpperCase()}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatTimestamp(error.timestamp)}
                                    </span>
                                  </div>
                                  <CardTitle className="text-base">{error.description}</CardTitle>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div>
                                <p className="text-sm font-medium text-green-600">💡 Solução:</p>
                                <p className="text-sm text-muted-foreground">{error.solution}</p>
                              </div>
                              {error.data && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-blue-600">📊 Dados do Erro:</p>
                                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto font-mono max-h-32">
                                    {JSON.stringify(error.data, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {error.sqlFix && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-blue-600">🔧 SQL Fix:</p>
                                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto font-mono">
                                    {error.sqlFix}
                                  </pre>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-2"
                                    onClick={() => {
                                      navigator.clipboard.writeText(error.sqlFix!);
                                    }}
                                  >
                                    Copiar SQL
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Console */}
        <TabsContent value="console" className="space-y-4">
          <ConsoleTab consoleHistory={consoleHistory} formatTimestamp={formatTimestamp} />
        </TabsContent>

        {/* Arquivos Relacionados */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Arquivos Relacionados</CardTitle>
              <CardDescription>
                Componentes, hooks e serviços usados nesta página
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-6">
                  {/* Componentes */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center">
                      <FileCode className="w-4 h-4 mr-2" />
                      Componentes ({pageInfo.components.length})
                    </h3>
                    <div className="space-y-1">
                      {pageInfo.components.map((comp, idx) => (
                        <Badge key={idx} variant="secondary" className="mr-2 mb-2">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Hooks */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Hooks ({pageInfo.hooks.length})</h3>
                    <div className="space-y-1">
                      {pageInfo.hooks.map((hook, idx) => (
                        <Badge key={idx} variant="outline" className="mr-2 mb-2">
                          {hook}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Arquivos */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Arquivos ({pageInfo.relatedFiles.length})</h3>
                    <div className="space-y-1">
                      {pageInfo.relatedFiles.map((file, idx) => (
                        <div key={idx} className="text-xs bg-muted p-2 rounded font-mono">
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* APIs */}
        <TabsContent value="apis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Endpoints de API</CardTitle>
              <CardDescription>
                Chamadas recentes desta página
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {/* Endpoints esperados */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Endpoints Esperados:</h3>
                    <div className="space-y-1">
                      {pageInfo.apiEndpoints.map((endpoint, idx) => (
                        <div key={idx} className="text-xs bg-muted p-2 rounded font-mono">
                          {endpoint}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Chamadas recentes */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Chamadas Recentes ({recentApiCalls.length}):</h3>
                    {recentApiCalls.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma chamada registrada</p>
                    ) : (
                      <div className="space-y-2">
                        {recentApiCalls.map((call, idx) => (
                          <Card key={idx} className={call.error ? 'border-destructive' : ''}>
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={call.status >= 200 && call.status < 300 ? 'default' : 'destructive'}>
                                    {call.method} {call.status || 'ERR'}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {call.duration.toFixed(2)}ms
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground font-mono">
                                  {formatTimestamp(call.timestamp)}
                                </span>
                              </div>
                              <p className="text-xs font-mono break-all mb-2">{call.url}</p>
                              {call.requestBody && (
                                <details className="mb-2">
                                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                    📤 Request Body
                                  </summary>
                                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(call.requestBody, null, 2)}
                                  </pre>
                                </details>
                              )}
                              {call.responsePreview && (
                                <details className="mb-2">
                                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                    📥 Response Preview
                                  </summary>
                                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                                    {call.responsePreview}
                                  </pre>
                                </details>
                              )}
                              {call.error && (
                                <div className="mt-2 p-2 bg-destructive/10 rounded">
                                  <p className="text-xs font-semibold text-destructive mb-1">❌ Erro:</p>
                                  <p className="text-xs text-destructive">{call.error}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estado */}
        <TabsContent value="state" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado dos Componentes</CardTitle>
              <CardDescription>
                Estado atual dos componentes React e variáveis monitoradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {/* Variáveis Esperadas */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Variáveis Esperadas ({pageInfo.stateVariables.length}):</h3>
                    <div className="space-y-2">
                      {pageInfo.stateVariables.map((variable, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                          <code className="text-xs font-mono">{variable}</code>
                          <Badge variant="outline">Mapeado</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Estado Capturado */}
                  {componentState && Object.keys(componentState).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-semibold mb-2">Estado Capturado em Tempo Real:</h3>
                        <div className="space-y-2">
                          {Object.entries(componentState).map(([componentName, state]) => (
                            <Card key={componentName}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm">{componentName}</CardTitle>
                                  <Badge variant="secondary" className="text-xs">
                                    {formatTimestamp((state as any)._lastUpdate || new Date().toISOString())}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto font-mono max-h-48">
                                  {JSON.stringify(state, null, 2)}
                                </pre>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Métricas de Performance</CardTitle>
                  <CardDescription>
                    Tempo de carregamento, renderizações e uso de recursos
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Atualizado: {formatTimestamp(performanceMetrics.lastRenderTime)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded">
                    <div>
                      <p className="text-sm font-medium">Load Time</p>
                      <p className="text-xs text-muted-foreground">Primeira renderização</p>
                    </div>
                    <Badge variant="secondary" className="text-base">
                      {performanceMetrics.loadTime.toFixed(3)}ms
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded">
                    <div>
                      <p className="text-sm font-medium">Re-renders</p>
                      <p className="text-xs text-muted-foreground">Total de renderizações</p>
                    </div>
                    <Badge variant="secondary" className="text-base">
                      {performanceMetrics.renderCount}x
                    </Badge>
                  </div>

                  {performanceMetrics.domNodes && (
                    <div className="flex items-center justify-between p-4 bg-muted rounded">
                      <div>
                        <p className="text-sm font-medium">DOM Nodes</p>
                        <p className="text-xs text-muted-foreground">Elementos no DOM</p>
                      </div>
                      <Badge variant="secondary" className="text-base">
                        {performanceMetrics.domNodes.toLocaleString()}
                      </Badge>
                    </div>
                  )}

                  {performanceMetrics.memoryUsage && (
                    <div className="flex items-center justify-between p-4 bg-muted rounded">
                      <div>
                        <p className="text-sm font-medium">JS Heap Used</p>
                        <p className="text-xs text-muted-foreground">Memória utilizada</p>
                      </div>
                      <Badge variant="secondary" className="text-base">
                        {(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                  )}

                  {performanceMetrics.heapSize && (
                    <div className="flex items-center justify-between p-4 bg-muted rounded">
                      <div>
                        <p className="text-sm font-medium">Total Heap Size</p>
                        <p className="text-xs text-muted-foreground">Memória total alocada</p>
                      </div>
                      <Badge variant="secondary" className="text-base">
                        {(performanceMetrics.heapSize / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-muted rounded">
                    <div>
                      <p className="text-sm font-medium">API Calls</p>
                      <p className="text-xs text-muted-foreground">Total de chamadas</p>
                    </div>
                    <Badge variant="secondary" className="text-base">
                      {recentApiCalls.length}
                    </Badge>
                  </div>
                </div>

                {performanceMetrics.memoryUsage && performanceMetrics.heapSize && (
                  <div className="mt-4 p-4 bg-muted rounded">
                    <p className="text-sm font-medium mb-2">Memory Usage</p>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ 
                          width: `${(performanceMetrics.memoryUsage / performanceMetrics.heapSize * 100).toFixed(1)}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((performanceMetrics.memoryUsage / performanceMetrics.heapSize) * 100).toFixed(1)}% utilizado
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button onClick={exportDebugData} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Exportar Dados
            </Button>
            <Button onClick={onOpenGlobalDebug} variant="default" className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              Debug Global
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
