import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UptimeChartProps {
  computerId: string;
}

export const UptimeChart = ({ computerId }: UptimeChartProps) => {
  const [period, setPeriod] = useState<'today' | '7days' | '30days'>('7days');
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUptimeData();
  }, [computerId, period]);

  const fetchUptimeData = async () => {
    setLoading(true);
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case '7days':
        startDate = subDays(now, 7);
        break;
      case '30days':
        startDate = subDays(now, 30);
        break;
    }

    // Fetch connection history
    const { data: history } = await supabase
      .from('connection_history')
      .select('*')
      .eq('computer_id', computerId)
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: true });

    // Calculate daily uptime
    const dailyData: Record<string, { date: string; uptime: number; offline: number; events: number }> = {};
    
    history?.forEach((event) => {
      const day = format(new Date(event.started_at), 'dd/MM', { locale: ptBR });
      if (!dailyData[day]) {
        dailyData[day] = { date: day, uptime: 0, offline: 0, events: 0 };
      }
      
      const duration = event.duration_seconds || 0;
      if (event.event_type === 'offline') {
        dailyData[day].offline += duration;
        dailyData[day].events += 1;
      } else {
        dailyData[day].uptime += duration;
      }
    });

    const chartArray = Object.values(dailyData).map(d => ({
      ...d,
      uptimePercentage: d.uptime + d.offline > 0 
        ? Math.round((d.uptime / (d.uptime + d.offline)) * 100) 
        : 100,
    }));

    setChartData(chartArray);

    // Calculate overall stats
    const totalOffline = chartArray.reduce((sum, d) => sum + d.offline, 0);
    const totalEvents = chartArray.reduce((sum, d) => sum + d.events, 0);
    const avgUptime = chartArray.length > 0 
      ? chartArray.reduce((sum, d) => sum + d.uptimePercentage, 0) / chartArray.length 
      : 100;

    setStats({
      avgUptime: avgUptime.toFixed(1),
      totalEvents,
      avgOfflineTime: totalEvents > 0 ? Math.round(totalOffline / totalEvents / 60) : 0,
    });

    setLoading(false);
  };

  if (loading) {
    return <div className="text-gray-400">Carregando estatísticas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={period === 'today' ? 'default' : 'outline'}
          onClick={() => setPeriod('today')}
        >
          Hoje
        </Button>
        <Button
          size="sm"
          variant={period === '7days' ? 'default' : 'outline'}
          onClick={() => setPeriod('7days')}
        >
          7 dias
        </Button>
        <Button
          size="sm"
          variant={period === '30days' ? 'default' : 'outline'}
          onClick={() => setPeriod('30days')}
        >
          30 dias
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Uptime Médio</p>
          <p className="text-2xl font-bold text-emerald-400">{stats?.avgUptime}%</p>
        </div>
        <div className="bg-white/5 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Total de Eventos</p>
          <p className="text-2xl font-bold text-white">{stats?.totalEvents}</p>
        </div>
        <div className="bg-white/5 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Tempo Médio Offline</p>
          <p className="text-2xl font-bold text-red-400">{stats?.avgOfflineTime}min</p>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="uptimePercentage" fill="#10b981" name="Uptime %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
