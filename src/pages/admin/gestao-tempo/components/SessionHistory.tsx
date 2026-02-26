import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Timer, Brain } from 'lucide-react';

const typeIcons = {
  stopwatch: Clock,
  timer: Timer,
  pomodoro: Brain,
};

const typeLabels = {
  stopwatch: 'Cronômetro',
  timer: 'Temporizador',
  pomodoro: 'Pomodoro',
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
    <Card className="rounded-2xl shadow-sm border-border/50">
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Histórico (7 dias)
        </h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 text-center py-6">Nenhuma sessão registrada</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sessions.map((s: any) => {
              const Icon = typeIcons[s.type as keyof typeof typeIcons] || Clock;
              return (
                <div key={s.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-muted/30 text-sm">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.label || typeLabels[s.type as keyof typeof typeLabels]}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(s.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  <span className="font-mono text-xs shrink-0">{formatDuration(s.duration_seconds)}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
