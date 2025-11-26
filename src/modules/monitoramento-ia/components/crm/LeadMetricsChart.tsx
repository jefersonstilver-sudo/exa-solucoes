import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MessageMetrics {
  date: string;
  sent: number;
  received: number;
  avgResponseTime: number;
}

interface AgentMetrics {
  agentKey: string;
  messagesSent: number;
  messagesReceived: number;
  avgResponseTime: number;
}

interface LeadMetricsChartProps {
  messagesByDay: MessageMetrics[];
  agentMetrics: AgentMetrics[];
  selectedAgent?: string;
  onAgentChange: (agent: string) => void;
}

export const LeadMetricsChart: React.FC<LeadMetricsChartProps> = ({
  messagesByDay,
  agentMetrics,
  selectedAgent,
  onAgentChange
}) => {
  const [chartType, setChartType] = useState<'messages' | 'response_time'>('messages');

  // Preparar dados para o gráfico
  const chartData = messagesByDay.map(day => ({
    date: format(new Date(day.date), 'dd/MM', { locale: ptBR }),
    'Enviadas': day.sent,
    'Recebidas': day.received,
    'Tempo Resposta (min)': Math.round(day.avgResponseTime)
  }));

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs mb-2 block">Filtrar por Agente</Label>
          <Select value={selectedAgent || 'all'} onValueChange={onAgentChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os agentes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os agentes</SelectItem>
              {agentMetrics.map((agent) => (
                <SelectItem key={agent.agentKey} value={agent.agentKey}>
                  {agent.agentKey}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs mb-2 block">Tipo de Gráfico</Label>
          <Select value={chartType} onValueChange={(v) => setChartType(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="messages">Mensagens por Dia</SelectItem>
              <SelectItem value="response_time">Tempo de Resposta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'messages' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Enviadas" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line 
                type="monotone" 
                dataKey="Recebidas" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--secondary))' }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar 
                dataKey="Tempo Resposta (min)" 
                fill="hsl(var(--accent))" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Métricas por Agente */}
      {selectedAgent && selectedAgent !== 'all' && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          {agentMetrics
            .filter(agent => agent.agentKey === selectedAgent)
            .map((agent) => (
              <React.Fragment key={agent.agentKey}>
                <div>
                  <p className="text-xs text-muted-foreground">Enviadas</p>
                  <p className="text-lg font-semibold">{agent.messagesSent}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recebidas</p>
                  <p className="text-lg font-semibold">{agent.messagesReceived}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tempo Médio</p>
                  <p className="text-lg font-semibold">
                    {Math.round(agent.avgResponseTime)}min
                  </p>
                </div>
              </React.Fragment>
            ))}
        </div>
      )}
    </div>
  );
};
