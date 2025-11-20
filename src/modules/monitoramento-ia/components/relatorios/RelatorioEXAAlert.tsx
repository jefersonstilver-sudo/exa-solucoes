import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Zap, Activity } from 'lucide-react';

export const RelatorioEXAAlert = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas Enviados
            </CardTitle>
            <Bell className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Em breve</div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos 7 dias
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas Críticos
            </CardTitle>
            <Zap className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Em breve</div>
            <p className="text-xs text-muted-foreground mt-1">
              Alta urgência
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Resposta
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Em breve</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tempo médio de ação
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            O sistema EXA Alert monitora automaticamente situações críticas e
            envia notificações para a equipe responsável. Métricas detalhadas
            serão implementadas na próxima fase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
