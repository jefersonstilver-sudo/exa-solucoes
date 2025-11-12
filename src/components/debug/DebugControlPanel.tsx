/**
 * Painel de Controle do Debug Mode
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="border border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              Configurações de Debug
            </CardTitle>
            <CardDescription className="text-xs">
              Ferramentas avançadas de diagnóstico
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            <User className="w-3 h-3 mr-1" />
            {userEmail?.split('@')[0] || 'Guest'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle Debug Mode */}
        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5">
            <Label htmlFor="debug-mode" className="text-sm font-medium flex items-center gap-2">
              <Bug className="w-3.5 h-3.5 text-muted-foreground" />
              Modo Debug
            </Label>
            <p className="text-xs text-muted-foreground">
              Análise de erros e logs detalhados
            </p>
          </div>
          <Switch
            id="debug-mode"
            checked={isDebugMode}
            onCheckedChange={toggleDebugMode}
          />
        </div>

        <Separator />

        {/* Toggle Force Cleanup */}
        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5">
            <Label htmlFor="force-cleanup" className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
              Limpeza Forçada
            </Label>
            <p className="text-xs text-muted-foreground">
              Remoção de slots corrompidos
            </p>
          </div>
          <Switch
            id="force-cleanup"
            checked={forceCleanupEnabled}
            onCheckedChange={toggleForceCleanup}
            disabled={!isDebugMode}
          />
        </div>

        {/* Status compacto */}
        {(isDebugMode || forceCleanupEnabled) && (
          <>
            <Separator />
            <div className="flex gap-2 text-xs">
              {isDebugMode && (
                <Badge variant="secondary" className="text-xs">
                  Debug Ativo
                </Badge>
              )}
              {forceCleanupEnabled && (
                <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-600">
                  Cleanup Ativo
                </Badge>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
