import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
    sent: day.sent,
    received: day.received,
    responseTime: Math.round(day.avgResponseTime)
  }));

  // Detectar dark mode
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-[var(--exa-bg-card)] p-4 rounded-lg border border-[var(--exa-border)]">
        {/* Seletor de Agente */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[var(--exa-text-secondary)] uppercase tracking-wide">
            Agente:
          </label>
          <Select value={selectedAgent || 'all'} onValueChange={onAgentChange}>
            <SelectTrigger className="w-[180px] bg-[var(--exa-bg-primary)] border-[var(--exa-border)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Agentes</SelectItem>
              {agentMetrics.map((agent) => (
                <SelectItem key={agent.agentKey} value={agent.agentKey} className="capitalize">
                  {agent.agentKey}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seletor de Tipo de Gráfico */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[var(--exa-text-secondary)] uppercase tracking-wide">
            Visualização:
          </label>
          <Select value={chartType} onValueChange={(value: 'messages' | 'response_time') => setChartType(value)}>
            <SelectTrigger className="w-[200px] bg-[var(--exa-bg-primary)] border-[var(--exa-border)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="messages">📊 Mensagens por Dia</SelectItem>
              <SelectItem value="response_time">⏱️ Tempo de Resposta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Gráfico */}
      <div className="exa-content-card p-6">
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'messages' ? (
            <LineChart data={chartData}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
              />
              <XAxis 
                dataKey="date" 
                stroke={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                labelStyle={{ color: isDark ? '#fff' : '#000' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sent" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Enviadas"
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line 
                type="monotone" 
                dataKey="received" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Recebidas"
                dot={{ fill: '#10b981', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
              />
              <XAxis 
                dataKey="date" 
                stroke={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                labelStyle={{ color: isDark ? '#fff' : '#000' }}
              />
              <Legend />
              <Bar 
                dataKey="responseTime" 
                fill="#8b5cf6" 
                name="Tempo de Resposta (min)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Métricas por Agente */}
      {selectedAgent && selectedAgent !== 'all' && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-[var(--exa-bg-card)] rounded-lg border border-[var(--exa-border)]">
          {agentMetrics
            .filter(agent => agent.agentKey === selectedAgent)
            .map((agent) => (
              <React.Fragment key={agent.agentKey}>
                <div>
                  <p className="text-xs text-[var(--exa-text-secondary)] uppercase tracking-wide">Enviadas</p>
                  <p className="text-2xl font-bold text-[var(--exa-text-primary)] mt-1">{agent.messagesSent}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--exa-text-secondary)] uppercase tracking-wide">Recebidas</p>
                  <p className="text-2xl font-bold text-[var(--exa-text-primary)] mt-1">{agent.messagesReceived}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--exa-text-secondary)] uppercase tracking-wide">Tempo Médio</p>
                  <p className="text-2xl font-bold text-[var(--exa-text-primary)] mt-1">
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