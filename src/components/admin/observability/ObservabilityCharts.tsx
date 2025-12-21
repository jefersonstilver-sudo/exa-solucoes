import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  PieChart as PieChartIcon 
} from 'lucide-react';
import { MessagesByHour, DeliveryStatusDistribution } from '@/hooks/useObservabilityData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ObservabilityChartsProps {
  messagesByHour: MessagesByHour[];
  deliveryDistribution: DeliveryStatusDistribution[];
}

const COLORS = {
  delivered: '#22c55e',
  pending: '#f59e0b',
  failed: '#ef4444',
  suspected_delivery_failure: '#f97316',
  unknown: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  delivered: 'Entregue',
  pending: 'Pendente',
  failed: 'Falhou',
  suspected_delivery_failure: 'Suspeita',
  unknown: 'Desconhecido',
};

export const ObservabilityCharts: React.FC<ObservabilityChartsProps> = ({
  messagesByHour,
  deliveryDistribution,
}) => {
  // Formatar dados para o gráfico de barras
  const formattedHourData = messagesByHour.map((item) => ({
    ...item,
    hour: format(new Date(item.hour), 'HH:mm', { locale: ptBR }),
  }));

  // Formatar dados para o gráfico de pizza
  const formattedPieData = deliveryDistribution.map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    status: item.status,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Gráfico de Mensagens por Hora */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Mensagens por Hora (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formattedHourData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formattedHourData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="inbound" 
                  name="Recebidas" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="outbound" 
                  name="Enviadas" 
                  fill="#22c55e" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Sem dados disponíveis
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Distribuição de Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-green-500" />
            Status de Entrega (Outbound)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formattedPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formattedPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formattedPieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.status as keyof typeof COLORS] || COLORS.unknown} 
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Sem dados disponíveis
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
