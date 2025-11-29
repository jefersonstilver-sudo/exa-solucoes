import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WeeklyExhibition } from '@/hooks/useVideoReportData';

interface CampaignPerformanceChartProps {
  data: WeeklyExhibition[];
}

export const CampaignPerformanceChart = ({ data }: CampaignPerformanceChartProps) => {
  return (
    <div className="bg-gradient-to-br from-background via-background to-accent/5 backdrop-blur-xl border border-border/40 rounded-2xl p-6 shadow-sm">
      <h4 className="text-sm font-semibold text-foreground mb-4">
        📊 Evolução de Exibições por Semana
      </h4>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorExibicoes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9C1E1E" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#9C1E1E" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorProjecao" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9C1E1E" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#9C1E1E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="semana" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
              return value.toString();
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: '4px' }}
            formatter={(value: number, name: string) => [
              value.toLocaleString('pt-BR'),
              name === 'exibicoes' ? 'Exibições' : 'Projeção'
            ]}
          />
          <Area
            type="monotone"
            dataKey="exibicoes"
            stroke="#9C1E1E"
            strokeWidth={2}
            fill="url(#colorExibicoes)"
            name="exibicoes"
          />
          <Area
            type="monotone"
            dataKey="projecao"
            stroke="#9C1E1E"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="url(#colorProjecao)"
            name="projecao"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
