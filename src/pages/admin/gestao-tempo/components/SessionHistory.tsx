import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Timer, Brain, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeConfig = {
  stopwatch: { icon: Clock, label: 'Cronômetro', badgeClass: 'bg-blue-500/10 text-blue-600' },
  timer: { icon: Timer, label: 'Temporizador', badgeClass: 'bg-amber-500/10 text-amber-600' },
  pomodoro: { icon: Brain, label: 'Pomodoro', badgeClass: 'bg-red-500/10 text-red-600' },
};

export const SessionHistory: React.FC = () => {
  const { session } = useAuth();

  const { data: sessions = [] } = useQuery({
    queryKey: ['time-sessions', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('time_sessions' as any)
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) return [];
      return data || [];
    },
    enabled: !!session?.user?.id,
  });

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}min`;
    if (m > 0) return `${m}min ${s}s`;
    return `${s}s`;
  };

  return (
    <Card className="rounded-2xl shadow-lg border-border/40 bg-gradient-to-b from-card to-accent/5 h-full">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-primary/70" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Histórico (7 dias)
          </h3>
        </div>
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground/60">Nenhuma sessão registrada</p>
            <p className="text-xs text-muted-foreground/40 mt-1">Use o cronômetro, temporizador ou pomodoro</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {sessions.map((s: any) => {
              const cfg = typeConfig[s.type as keyof typeof typeConfig] || typeConfig.stopwatch;
              const Icon = cfg.icon;
              return (
                <div key={s.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors text-sm">
                  <div className={cn('p-1.5 rounded-lg', cfg.badgeClass)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.label || cfg.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(s.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  <span className="font-mono text-xs shrink-0 bg-accent/50 px-2 py-1 rounded-md">{formatDuration(s.duration_seconds)}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
