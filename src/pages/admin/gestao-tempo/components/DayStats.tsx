import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Hash, Timer, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const cardStyles = [
  { icon: Clock, label: 'Tempo Total Hoje', iconClass: 'text-blue-500 bg-blue-500/10', key: 'totalSeconds' },
  { icon: Hash, label: 'Sessões Hoje', iconClass: 'text-emerald-500 bg-emerald-500/10', key: 'count' },
  { icon: Timer, label: 'Média por Sessão', iconClass: 'text-amber-500 bg-amber-500/10', key: 'avgSeconds' },
  { icon: Brain, label: 'Pomodoros', iconClass: 'text-red-500 bg-red-500/10', key: 'pomodoros' },
];

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

  const values: Record<string, string> = {
    totalSeconds: formatDuration(stats?.totalSeconds || 0),
    count: String(stats?.count || 0),
    avgSeconds: formatDuration(stats?.avgSeconds || 0),
    pomodoros: String(stats?.pomodoros || 0),
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cardStyles.map((c) => (
        <Card key={c.label} className="rounded-2xl shadow-lg border-border/40 bg-gradient-to-br from-card to-accent/5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <CardContent className="p-5 flex flex-col items-center text-center gap-3">
            <div className={cn('p-2.5 rounded-xl', c.iconClass)}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="text-3xl font-bold text-foreground">{values[c.key]}</div>
            <div className="text-xs text-muted-foreground font-medium">{c.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
