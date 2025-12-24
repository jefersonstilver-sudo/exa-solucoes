import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, Users, AlertCircle } from 'lucide-react';
import { ChartData } from '@/hooks/useSupabaseData';
interface DashboardChartsProps {
  data: ChartData;
}
const DashboardCharts: React.FC<DashboardChartsProps> = ({
  data
}) => {
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;
  const EmptyState = ({
    title,
    description
  }: {
    title: string;
    description: string;
  }) => <div className="flex flex-col items-center justify-center h-[180px] text-center p-4">
      <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{description}</p>
    </div>;
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Receita Mensal */}
      <Card className="bg-gradient-to-br from-background via-background to-accent/5 rounded-2xl border border-border/40 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all">
        
        
      </Card>

      {/* Status dos Pedidos */}
      

      {/* Crescimento de Usuários */}
      <Card className="bg-gradient-to-br from-background via-background to-accent/5 rounded-2xl border border-border/40 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all lg:col-span-2">
        <CardHeader className="pb-2">
          
          
        </CardHeader>
        
      </Card>
    </div>;
};
export default DashboardCharts;