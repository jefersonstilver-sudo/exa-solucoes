/**
 * Dashboard de Debug Global - Todos os logs do sistema
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoLogViewer } from './VideoLogViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Database, Code, AlertTriangle, Zap } from 'lucide-react';

export const GlobalDebugDashboard: React.FC = () => {
  return (
    <Tabs defaultValue="frontend" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="frontend">
          <Code className="w-4 h-4 mr-2" />
          Frontend
        </TabsTrigger>
        <TabsTrigger value="backend">
          <Database className="w-4 h-4 mr-2" />
          Backend
        </TabsTrigger>
        <TabsTrigger value="errors">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Errors
        </TabsTrigger>
        <TabsTrigger value="performance">
          <Zap className="w-4 h-4 mr-2" />
          Performance
        </TabsTrigger>
        <TabsTrigger value="console">
          <Activity className="w-4 h-4 mr-2" />
          Console
        </TabsTrigger>
      </TabsList>

      {/* Frontend Logs */}
      <TabsContent value="frontend">
        <Card>
          <CardHeader>
            <CardTitle>Frontend Logs</CardTitle>
            <CardDescription>Todos os logs do frontend (componentes, hooks, serviços)</CardDescription>
          </CardHeader>
          <CardContent>
            <VideoLogViewer />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Backend Logs */}
      <TabsContent value="backend">
        <Card>
          <CardHeader>
            <CardTitle>Backend Logs</CardTitle>
            <CardDescription>Edge Functions, RPC calls, Triggers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Backend logs disponíveis no Supabase Dashboard → Logs
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Errors */}
      <TabsContent value="errors">
        <Card>
          <CardHeader>
            <CardTitle>Error Tracking</CardTitle>
            <CardDescription>Todos os erros capturados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Erros são exibidos no Console e salvos em sessionStorage
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Performance */}
      <TabsContent value="performance">
        <Card>
          <CardHeader>
            <CardTitle>Performance Monitor</CardTitle>
            <CardDescription>Métricas de performance do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use o React DevTools Profiler para análise detalhada
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Console */}
      <TabsContent value="console">
        <Card>
          <CardHeader>
            <CardTitle>Console Logs</CardTitle>
            <CardDescription>Saída do console.log</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Abra o DevTools (F12) para ver todos os console logs
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
