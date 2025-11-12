import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bot, History, Info, Shield } from 'lucide-react';
import type { SystemConfiguration } from '@/hooks/useConfigurationsData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DebugAITabProps {
  config: SystemConfiguration | null;
  stats: {
    totalAnalyses: number;
    totalErrors: number;
    totalTokens: number;
    avgDuration: number;
  };
  onToggleDebugAI: (checked: boolean) => void;
  onShowHistory: () => void;
}

export const DebugAITab: React.FC<DebugAITabProps> = ({ 
  config, 
  stats,
  onToggleDebugAI,
  onShowHistory 
}) => {
  return (
    <div className="space-y-6">
      {/* Debug AI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-500" />
            Debug com Inteligência Artificial
          </CardTitle>
          <CardDescription>
            Análise automática de páginas usando Google Gemini 2.5 Flash
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Status do Debug AI</p>
              {config?.debug_ai_enabled ? (
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="gap-1">
                    <Bot className="w-3 h-3" />
                    ATIVO
                  </Badge>
                  {config?.debug_ai_activated_at && (
                    <span className="text-xs text-muted-foreground">
                      desde {format(new Date(config.debug_ai_activated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </div>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  INATIVO
                </Badge>
              )}
            </div>
            <Switch
              checked={config?.debug_ai_enabled || false}
              onCheckedChange={onToggleDebugAI}
            />
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            Modelo: Google Gemini 2.5 Flash
          </div>

          {config?.debug_ai_enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Análises Realizadas</p>
                  <p className="text-2xl font-bold">{stats.totalAnalyses}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Erros Detectados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.totalErrors}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tokens Consumidos</p>
                  <p className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Duração Média</p>
                  <p className="text-2xl font-bold">{(stats.avgDuration / 1000).toFixed(2)}s</p>
                </div>
              </div>

              <Button
                onClick={onShowHistory}
                variant="outline"
                className="w-full"
              >
                <History className="w-4 h-4 mr-2" />
                Ver Histórico de Análises
              </Button>
            </>
          )}

          <div className="rounded-md bg-purple-500/10 border border-purple-500/20 p-3">
            <p className="text-sm text-purple-700 dark:text-purple-400">
              <Shield className="w-4 h-4 inline mr-1" />
              Requer autenticação com senha - Restrito a jefersonstilver@gmail.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
