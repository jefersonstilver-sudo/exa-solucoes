/**
 * Painel de Controle do Debug Mode
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useDebugContext } from '@/contexts/DebugContext';
import { Shield, AlertTriangle, Bug, User } from 'lucide-react';

export const DebugControlPanel: React.FC = () => {
  const { 
    isDebugMode, 
    isDebugAuthorized, 
    forceCleanupEnabled, 
    toggleDebugMode, 
    toggleForceCleanup,
    userEmail
  } = useDebugContext();

  return (
    <Card className="border-2 border-destructive/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-destructive" />
              Controle do Debug Master
            </CardTitle>
            <CardDescription>
              Configurações avançadas de debug - Acesso restrito
            </CardDescription>
          </div>
          {isDebugAuthorized ? (
            <Badge variant="default" className="bg-green-600">
              <User className="w-3 h-3 mr-1" />
              Autorizado
            </Badge>
          ) : (
            <Badge variant="destructive">
              Acesso Negado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações do Usuário */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Usuário Atual:</h3>
          <div className="p-3 bg-muted rounded">
            <p className="text-sm font-mono">{userEmail || 'Não autenticado'}</p>
            {!isDebugAuthorized && userEmail && (
              <p className="text-xs text-destructive mt-1">
                ⚠️ Apenas jefersonstilver@gmail.com pode ativar debug mode
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Toggle Debug Mode */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4" />
              <Label htmlFor="debug-mode" className="font-semibold">
                Modo Debug
              </Label>
            </div>
            <Switch
              id="debug-mode"
              checked={isDebugMode}
              onCheckedChange={toggleDebugMode}
              disabled={!isDebugAuthorized}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Ativa análise contextual de erros, monitoramento de APIs e logs detalhados
          </p>
          {isDebugMode && (
            <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-600/50">
              <p className="text-xs text-green-700 dark:text-green-400">
                ✅ Debug mode ATIVO - Auto-detecção de erros em execução
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Toggle Force Cleanup */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <Label htmlFor="force-cleanup" className="font-semibold">
                Force Cleanup (Remoção Forçada)
              </Label>
            </div>
            <Switch
              id="force-cleanup"
              checked={forceCleanupEnabled}
              onCheckedChange={toggleForceCleanup}
              disabled={!isDebugAuthorized || !isDebugMode}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Habilita botão de limpeza forçada para remover slots corrompidos bypassando validações
          </p>
          {forceCleanupEnabled && (
            <div className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-600/50">
              <p className="text-xs text-orange-700 dark:text-orange-400">
                ⚠️ Force Cleanup ATIVO - Use com cautela! Remove dados sem validações
              </p>
            </div>
          )}
          {!isDebugMode && (
            <p className="text-xs text-muted-foreground italic">
              Requer Debug Mode ativo
            </p>
          )}
        </div>

        <Separator />

        {/* Status Summary */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Status:</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-muted rounded text-center">
              <p className="text-xs text-muted-foreground">Debug Mode</p>
              <p className="font-semibold">{isDebugMode ? '🟢 ON' : '🔴 OFF'}</p>
            </div>
            <div className="p-2 bg-muted rounded text-center">
              <p className="text-xs text-muted-foreground">Force Cleanup</p>
              <p className="font-semibold">{forceCleanupEnabled ? '🟠 ON' : '⚪ OFF'}</p>
            </div>
          </div>
        </div>

        {/* Instruções */}
        {!isDebugAuthorized && (
          <div className="p-3 bg-destructive/10 rounded border border-destructive/50">
            <p className="text-xs text-destructive font-semibold mb-1">
              🔒 Acesso Restrito
            </p>
            <p className="text-xs text-muted-foreground">
              Apenas a conta jefersonstilver@gmail.com pode ativar o modo debug e force cleanup.
              Faça login com a conta autorizada para acessar estas funcionalidades.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
