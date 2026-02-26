import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Hash, Timer, Brain } from 'lucide-react';

export const DayStats: React.FC = () => {
  const { session } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['time-sessions-stats', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('time_sessions' as any)
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', today.toISOString());

      if (error || !data) return { totalSeconds: 0, count: 0, avgSeconds: 0, pomodoros: 0 };

      const totalSeconds = data.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0);
      const pomodoros = data.filter((s: any) => s.type === 'pomodoro').length;

      return {
        totalSeconds,
        count: data.length,
        avgSeconds: data.length > 0 ? Math.round(totalSeconds / data.length) : 0,
        pomodoros,
      };
    },
    enabled: !!session?.user?.id,
  });

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
  };

  const cards = [
    { icon: Clock, label: 'Tempo Total Hoje', value: formatDuration(stats?.totalSeconds || 0) },
    { icon: Hash, label: 'Sessões Hoje', value: String(stats?.count || 0) },
    { icon: Timer, label: 'Média por Sessão', value: formatDuration(stats?.avgSeconds || 0) },
    { icon: Brain, label: 'Pomodoros', value: String(stats?.pomodoros || 0) },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="rounded-2xl shadow-sm border-border/50">
          <CardContent className="p-5 flex flex-col items-center text-center gap-2">
            <c.icon className="h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-semibold text-foreground">{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
