import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { TimeDisplay } from './TimeDisplay';
import { CircularProgress } from './CircularProgress';
import { Play, Pause, RotateCcw, Save, Timer, Coffee, Zap, Clock, Hourglass } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type TimerState = 'idle' | 'running' | 'paused' | 'finished';

const PRESETS = [
  { label: '5 min', seconds: 300, icon: Coffee },
  { label: '10 min', seconds: 600, icon: Zap },
  { label: '15 min', seconds: 900, icon: Clock },
  { label: '30 min', seconds: 1800, icon: Hourglass },
  { label: '1 hora', seconds: 3600, icon: Timer },
];

export const TimerTab: React.FC = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<TimerState>('idle');
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [label, setLabel] = useState('');
  const [inputMinutes, setInputMinutes] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const startedAtRef = useRef<string>('');

  const startTimer = useCallback((seconds: number) => {
    setTotalSeconds(seconds);
    setRemaining(seconds);
    startedAtRef.current = new Date().toISOString();
    setState('running');
  }, []);

  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setState('finished');
            try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQo='); } catch {}
            toast.info('⏰ Temporizador finalizado!', { duration: 5000 });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [state]);

  const handlePause = () => { clearInterval(intervalRef.current); setState('paused'); };
  const handleResume = () => { setState('running'); };
  const handleReset = () => { clearInterval(intervalRef.current); setRemaining(0); setTotalSeconds(0); setState('idle'); };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    const duration = totalSeconds - remaining;
    const { error } = await supabase.from('time_sessions' as any).insert({
      user_id: session.user.id,
      type: 'timer',
      label: label || 'Temporizador',
      duration_seconds: duration,
      started_at: startedAtRef.current || new Date().toISOString(),
      ended_at: new Date().toISOString(),
    });
    if (error) { toast.error('Erro ao salvar sessão'); }
    else { toast.success('Sessão salva'); queryClient.invalidateQueries({ queryKey: ['time-sessions'] }); handleReset(); setLabel(''); }
  };

  const handleCustomStart = () => {
    const mins = parseInt(inputMinutes);
    if (mins > 0) { startTimer(mins * 60); setInputMinutes(''); }
  };

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  // Dynamic color: green -> amber -> red
  const remainPercent = totalSeconds > 0 ? remaining / totalSeconds : 1;
  const progressColor = remainPercent > 0.5
    ? 'hsl(142 76% 36%)' // green
    : remainPercent > 0.2
      ? 'hsl(38 92% 50%)' // amber
      : 'hsl(0 84% 60%)'; // red

  return (
    <div className="flex flex-col items-center gap-8">
      <Card className="rounded-2xl shadow-lg border-border/40 w-full max-w-lg bg-gradient-to-br from-card via-card to-accent/5 overflow-hidden">
        <CardContent className="p-8 md:p-12 flex flex-col items-center gap-8 relative">
          <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-primary/5 blur-3xl" />

          <Input
            placeholder="Nome do temporizador"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="max-w-sm text-center border-none bg-muted/30 rounded-xl focus:bg-muted/50 transition-colors"
          />

          <CircularProgress value={progress} size={260} strokeWidth={8} color={state !== 'idle' ? progressColor : undefined}>
            <TimeDisplay hours={hours} minutes={minutes} seconds={seconds} isRunning={state === 'running'} size="md" />
            {state === 'finished' && (
              <span className="text-sm font-medium text-primary animate-bounce mt-2">🎉 Finalizado!</span>
            )}
          </CircularProgress>

          {state === 'idle' ? (
            <div className="space-y-5 w-full">
              <div className="flex flex-wrap gap-2 justify-center">
                {PRESETS.map(p => (
                  <button
                    key={p.seconds}
                    onClick={() => startTimer(p.seconds)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-primary/10 hover:border-primary/30 transition-all text-sm font-medium text-foreground"
                  >
                    <p.icon className="h-3.5 w-3.5 text-primary/70" />
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 max-w-xs mx-auto">
                <Input
                  type="number"
                  placeholder="Minutos"
                  value={inputMinutes}
                  onChange={(e) => setInputMinutes(e.target.value)}
                  className="rounded-xl text-center"
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomStart()}
                />
                <Button onClick={handleCustomStart} className="rounded-xl gap-2 shadow-lg shadow-primary/20">
                  <Play className="h-4 w-4" /> Iniciar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {state === 'running' && (
                <Button size="lg" onClick={handlePause} className="rounded-xl gap-2 bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/20">
                  <Pause className="h-4 w-4" /> Pausar
                </Button>
              )}
              {state === 'paused' && (
                <>
                  <Button variant="destructive" size="lg" onClick={handleReset} className="rounded-xl gap-2 shadow-lg shadow-destructive/20">
                    <RotateCcw className="h-4 w-4" /> Resetar
                  </Button>
                  <Button size="lg" onClick={handleResume} className="rounded-xl gap-2 shadow-lg shadow-primary/20">
                    <Play className="h-4 w-4" /> Retomar
                  </Button>
                </>
              )}
              {(state === 'finished' || state === 'paused') && (
                <Button variant="outline" size="lg" onClick={handleSave} className="rounded-xl gap-2 border-border/60">
                  <Save className="h-4 w-4" /> Salvar
                </Button>
              )}
              {state === 'finished' && (
                <Button variant="destructive" size="lg" onClick={handleReset} className="rounded-xl gap-2 shadow-lg shadow-destructive/20">
                  <RotateCcw className="h-4 w-4" /> Novo
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
