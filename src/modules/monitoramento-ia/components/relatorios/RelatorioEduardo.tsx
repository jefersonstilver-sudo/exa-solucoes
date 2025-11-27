import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertCircle, MessageCircle } from 'lucide-react';
import { DailyReportConfig } from './DailyReportConfig';

export const RelatorioEduardo = () => {
  return (
    <div className="space-y-6">
      {/* Header com Botão de Configuração */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance do Eduardo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas e análise de comportamento do agente
          </p>
        </div>
        <DailyReportConfig />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo Médio de Resposta
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Em breve</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média dos últimos 7 dias
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversas Perdidas
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Em breve</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sem resposta &gt; 1 hora
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Atendimentos Hoje
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Em breve</div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Implementação Futura</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Métricas detalhadas do Eduardo serão implementadas na próxima fase,
            incluindo análise de desempenho, conversões e satisfação do cliente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
