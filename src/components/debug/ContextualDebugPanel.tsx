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
import { 
  AlertCircle, 
  FileCode, 
  Activity, 
  Database, 
  Zap,
  Download,
  ExternalLink,
  Globe
} from 'lucide-react';

interface ContextualDebugPanelProps {
  onOpenGlobalDebug: () => void;
}

export const ContextualDebugPanel: React.FC<ContextualDebugPanelProps> = ({ onOpenGlobalDebug }) => {
  const { debugData, exportDebugData, clearErrors } = usePageDebug();
  const { pageInfo, currentPath, detectedErrors, recentApiCalls, performanceMetrics } = debugData;

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
            <div>
              <CardTitle className="text-2xl">🔍 {pageInfo.pageName}</CardTitle>
              <CardDescription className="mt-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">{pageInfo.pageFile}</code>
              </CardDescription>
            </div>
            <Button onClick={onOpenGlobalDebug} variant="outline" size="sm">
              <Globe className="w-4 h-4 mr-2" />
              Debug Global
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="errors" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="errors" className="relative">
            <AlertCircle className="w-4 h-4 mr-1" />
            Erros
            {detectedErrors.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {detectedErrors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileCode className="w-4 h-4 mr-1" />
            Arquivos
          </TabsTrigger>
          <TabsTrigger value="apis">
            <Database className="w-4 h-4 mr-1" />
            APIs
          </TabsTrigger>
          <TabsTrigger value="state">
            <Zap className="w-4 h-4 mr-1" />
            Estado
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
                            <div>
                              <Badge variant="destructive" className="mb-2">{error.code}</Badge>
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
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                {error.sqlFix}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
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
                                <Badge variant={call.status >= 200 && call.status < 300 ? 'default' : 'destructive'}>
                                  {call.method} {call.status || 'ERR'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {call.duration.toFixed(0)}ms
                                </span>
                              </div>
                              <p className="text-xs font-mono break-all">{call.url}</p>
                              {call.error && (
                                <p className="text-xs text-destructive mt-1">{call.error}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(call.timestamp).toLocaleTimeString()}
                              </p>
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
              <CardTitle>Variáveis de Estado</CardTitle>
              <CardDescription>
                Variáveis monitoradas nesta página
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {pageInfo.stateVariables.map((variable, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                      <code className="text-xs font-mono">{variable}</code>
                      <Badge variant="outline">Monitorado</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
              <CardDescription>
                Tempo de carregamento e renderizações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded">
                  <div>
                    <p className="text-sm font-medium">Tempo de Carregamento</p>
                    <p className="text-xs text-muted-foreground">Primeira renderização</p>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    {performanceMetrics.loadTime.toFixed(2)}ms
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded">
                  <div>
                    <p className="text-sm font-medium">Re-renderizações</p>
                    <p className="text-xs text-muted-foreground">Total de renders</p>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    {performanceMetrics.renderCount}
                  </Badge>
                </div>

                {performanceMetrics.memoryUsage && (
                  <div className="flex items-center justify-between p-4 bg-muted rounded">
                    <div>
                      <p className="text-sm font-medium">Uso de Memória</p>
                      <p className="text-xs text-muted-foreground">Heap size</p>
                    </div>
                    <Badge variant="secondary" className="text-lg">
                      {(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB
                    </Badge>
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
