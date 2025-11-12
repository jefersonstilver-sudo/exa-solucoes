import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Code, 
  FileCode, 
  Zap, 
  Shield,
  ChevronRight,
  Copy,
  ExternalLink
} from 'lucide-react';
import { AIAnalysis } from '@/hooks/useAIDebug';

interface AIGeneratedDebugPanelProps {
  analysis: AIAnalysis;
  onClose: () => void;
  onReanalyze?: () => void;
}

export const AIGeneratedDebugPanel: React.FC<AIGeneratedDebugPanelProps> = ({ analysis, onClose, onReanalyze }) => {
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />;
      case 'low':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="h-5 w-5 text-purple-600" />
            Análise com IA - Debug Inteligente
          </h2>
          <p className="text-sm text-muted-foreground">
            Powered by Google Gemini 2.5 Flash
          </p>
        </div>
        <div className="flex gap-2">
          {onReanalyze && (
            <Button variant="secondary" size="sm" onClick={onReanalyze}>
              🔄 Reanalizar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">📊 Resumo</TabsTrigger>
            <TabsTrigger value="errors">🐛 Erros ({analysis.summary.totalIssues})</TabsTrigger>
            <TabsTrigger value="components">📁 Arquivos</TabsTrigger>
            <TabsTrigger value="raw">📜 JSON</TabsTrigger>
          </TabsList>

          {/* RESUMO EXECUTIVO */}
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumo Executivo</CardTitle>
                <CardDescription>Visão geral dos problemas detectados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-red-600 font-medium">Críticos</p>
                    <p className="text-2xl font-bold text-red-900">{analysis.summary.criticalCount}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-600 font-medium">Altos</p>
                    <p className="text-2xl font-bold text-orange-900">{analysis.summary.highCount}</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-600 font-medium">Médios</p>
                    <p className="text-2xl font-bold text-yellow-900">{analysis.summary.mediumCount}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">Baixos</p>
                    <p className="text-2xl font-bold text-blue-900">{analysis.summary.lowCount}</p>
                  </div>
                </div>

                {analysis.summary.criticalCount > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-semibold text-red-900 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Ação Imediata Necessária
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      {analysis.summary.criticalCount} erro(s) crítico(s) detectado(s). Requer atenção imediata.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Issues */}
            {analysis.performanceIssues && analysis.performanceIssues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Problemas de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.performanceIssues.map((issue, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">{issue.issue}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Impacto: {issue.impact}
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        ✓ {issue.recommendation}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Security Concerns */}
            {analysis.securityConcerns && analysis.securityConcerns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    Preocupações de Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.securityConcerns.map((concern, idx) => (
                    <div key={idx} className="p-3 border border-red-200 rounded-lg bg-red-50">
                      <p className="font-medium text-sm text-red-900">{concern.concern}</p>
                      <p className="text-xs text-red-700 mt-1">Risco: {concern.risk}</p>
                      <p className="text-xs text-green-700 mt-2">🛡️ {concern.mitigation}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ERROS DETECTADOS */}
          <TabsContent value="errors" className="space-y-3">
            {analysis.errors && analysis.errors.length > 0 ? (
              analysis.errors.map((error) => (
                <Card key={error.id} className="border-l-4" style={{
                  borderLeftColor: error.severity === 'critical' ? '#ef4444' : 
                                  error.severity === 'high' ? '#f97316' :
                                  error.severity === 'medium' ? '#eab308' : '#3b82f6'
                }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getSeverityColor(error.severity)}>
                            {getSeverityIcon(error.severity)}
                            <span className="ml-1 uppercase">{error.severity}</span>
                          </Badge>
                          <Badge variant="outline">{error.category}</Badge>
                        </div>
                        <CardTitle className="text-base">{error.title}</CardTitle>
                        <CardDescription className="mt-1">{error.description}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedError(expandedError === error.id ? null : error.id)}
                      >
                        <ChevronRight className={`h-4 w-4 transition-transform ${expandedError === error.id ? 'rotate-90' : ''}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {expandedError === error.id && (
                    <CardContent className="space-y-3 pt-0">
                      <Separator />
                      
                      <div>
                        <p className="text-sm font-semibold mb-1">📍 Arquivos Afetados:</p>
                        <div className="flex flex-wrap gap-1">
                          {error.affectedFiles.map((file, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              <FileCode className="h-3 w-3 mr-1" />
                              {file}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold mb-1">🔍 Detalhes:</p>
                        <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                          {error.errorDetails}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold mb-1 text-green-600">✓ Solução Sugerida:</p>
                        <p className="text-sm p-2 bg-green-50 rounded border border-green-200">
                          {error.suggestedFix}
                        </p>
                      </div>

                      {error.codeExample && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold">💻 Exemplo de Código:</p>
                            <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(error.codeExample!)}>
                              <Copy className="h-3 w-3 mr-1" />
                              Copiar
                            </Button>
                          </div>
                          <pre className="text-xs p-3 bg-slate-900 text-slate-100 rounded overflow-x-auto">
                            <code>{error.codeExample}</code>
                          </pre>
                        </div>
                      )}

                      {error.sqlQuickFix && (
                        <div>
                          <p className="text-sm font-semibold mb-1 text-purple-600">⚡ Quick Fix SQL:</p>
                          <pre className="text-xs p-3 bg-purple-50 border border-purple-200 rounded overflow-x-auto">
                            <code>{error.sqlQuickFix}</code>
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold">Nenhum erro detectado!</p>
                  <p className="text-sm text-muted-foreground">Esta página está funcionando perfeitamente.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ARQUIVOS ANALISADOS */}
          <TabsContent value="components" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Componentes Detectados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.detectedComponents && analysis.detectedComponents.length > 0 ? (
                  analysis.detectedComponents.map((comp, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{comp.name}</p>
                          <p className="text-xs text-muted-foreground">{comp.path}</p>
                        </div>
                        <Badge variant="outline">{comp.type}</Badge>
                      </div>
                      {comp.dependencies.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {comp.dependencies.map((dep, didx) => (
                            <Badge key={didx} variant="secondary" className="text-xs">{dep}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum componente detectado</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hooks Utilizados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.detectedHooks && analysis.detectedHooks.length > 0 ? (
                  analysis.detectedHooks.map((hook, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <p className="font-medium text-sm">{hook.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{hook.usage}</p>
                      {hook.potentialIssues.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {hook.potentialIssues.map((issue, iidx) => (
                            <p key={iidx} className="text-xs text-amber-600">⚠️ {issue}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum hook detectado</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* RAW JSON */}
          <TabsContent value="raw">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Análise Completa (JSON)</CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `ai-debug-${Date.now()}.json`;
                      a.click();
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs p-4 bg-slate-900 text-slate-100 rounded overflow-x-auto max-h-96">
                  <code>{JSON.stringify(analysis, null, 2)}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
};
