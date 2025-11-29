import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BuildingReach } from '@/hooks/useVideoReportData';

interface BuildingReachChartProps {
  data: BuildingReach[];
}

export const BuildingReachChart = ({ data }: BuildingReachChartProps) => {
  return (
    <div className="bg-gradient-to-br from-background via-background to-accent/5 backdrop-blur-xl border border-border/40 rounded-2xl p-6 shadow-sm">
      <h4 className="text-sm font-semibold text-foreground mb-4">
        🎯 Alcance por Prédio
      </h4>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50)}>
        <BarChart 
          data={data} 
          layout="vertical"
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            type="number" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return value.toString();
            }}
          />
          <YAxis 
            type="category" 
            dataKey="nome" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={120}
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
            formatter={(value: number, name: string, props: any) => [
              `${value.toLocaleString('pt-BR')} pessoas`,
              `${props.payload.telas} tela${props.payload.telas > 1 ? 's' : ''}`
            ]}
          />
          <Bar dataKey="alcance" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#9C1E1E" opacity={0.8 + (index * 0.05)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
