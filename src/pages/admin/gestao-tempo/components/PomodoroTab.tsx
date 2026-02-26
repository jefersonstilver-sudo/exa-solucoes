import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TimeDisplay } from './TimeDisplay';
import { CircularProgress } from './CircularProgress';
import { Play, Pause, RotateCcw, Settings, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type PomodoroPhase = 'focus' | 'short_break' | 'long_break';
type PomodoroState = 'idle' | 'running' | 'paused';

const DEFAULT_CONFIG = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
};

export const PomodoroTab: React.FC = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [config] = useState(() => {
    try {
      const saved = localStorage.getItem('pomodoro-config');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  });

  const [state, setState] = useState<PomodoroState>('idle');
  const [phase, setPhase] = useState<PomodoroPhase>('focus');
  const [remaining, setRemaining] = useState(config.focusMinutes * 60);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [totalFocusSeconds, setTotalFocusSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const startedAtRef = useRef<string>('');

  const getPhaseSeconds = useCallback((p: PomodoroPhase) => {
    switch (p) {
      case 'focus': return config.focusMinutes * 60;
      case 'short_break': return config.shortBreakMinutes * 60;
      case 'long_break': return config.longBreakMinutes * 60;
    }
  }, [config]);

  const getPhaseLabel = (p: PomodoroPhase) => {
    switch (p) {
      case 'focus': return 'Foco';
      case 'short_break': return 'Pausa Curta';
      case 'long_break': return 'Pausa Longa';
    }
  };

  const handlePhaseComplete = useCallback(() => {
    clearInterval(intervalRef.current);
    try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQo='); } catch {}
    
    if (phase === 'focus') {
      const newCycles = cyclesCompleted + 1;
      setCyclesCompleted(newCycles);
      setTotalFocusSeconds(prev => prev + config.focusMinutes * 60);
      
      if (newCycles % config.cyclesBeforeLongBreak === 0) {
        setPhase('long_break');
        setRemaining(config.longBreakMinutes * 60);
        toast.info('🎉 Pausa longa! Você completou um conjunto de ciclos.');
      } else {
        setPhase('short_break');
        setRemaining(config.shortBreakMinutes * 60);
        toast.info('☕ Pausa curta! Descanse um pouco.');
      }
    } else {
      setPhase('focus');
      setRemaining(config.focusMinutes * 60);
      toast.info('🎯 Hora de focar!');
    }
    setState('idle');
  }, [phase, cyclesCompleted, config]);

  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [state, handlePhaseComplete]);

  const handleStart = () => {
    if (state === 'idle') startedAtRef.current = new Date().toISOString();
    setState('running');
  };

  const handlePause = () => {
    clearInterval(intervalRef.current);
    setState('paused');
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setPhase('focus');
    setRemaining(config.focusMinutes * 60);
    setCyclesCompleted(0);
    setTotalFocusSeconds(0);
    setState('idle');
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    const { error } = await supabase.from('time_sessions' as any).insert({
      user_id: session.user.id,
      type: 'pomodoro',
      label: `Pomodoro - ${cyclesCompleted} ciclos`,
      duration_seconds: totalFocusSeconds,
      started_at: startedAtRef.current || new Date().toISOString(),
      ended_at: new Date().toISOString(),
      laps: Array.from({ length: cyclesCompleted }, (_, i) => ({ cycle: i + 1, focusMinutes: config.focusMinutes })),
    });
    if (error) {
      toast.error('Erro ao salvar sessão');
    } else {
      toast.success('Sessão Pomodoro salva');
      queryClient.invalidateQueries({ queryKey: ['time-sessions'] });
      handleReset();
    }
  };

  const phaseTotal = getPhaseSeconds(phase);
  const progress = phaseTotal > 0 ? ((phaseTotal - remaining) / phaseTotal) * 100 : 0;
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const phaseColors: Record<PomodoroPhase, string> = {
    focus: 'hsl(var(--primary))',
    short_break: 'hsl(142 76% 36%)',
    long_break: 'hsl(217 91% 60%)',
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <Card className={cn(
        'rounded-2xl shadow-sm border-border/50 w-full max-w-lg transition-all duration-500',
        phase !== 'focus' && state === 'running' && 'ring-2 ring-primary/20'
      )}>
        <CardContent className="p-8 md:p-12 flex flex-col items-center gap-6">
          {/* Phase label */}
          <div className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium',
            phase === 'focus' && 'bg-primary/10 text-primary',
            phase === 'short_break' && 'bg-green-100 text-green-700',
            phase === 'long_break' && 'bg-blue-100 text-blue-700',
          )}>
            {getPhaseLabel(phase)}
          </div>

          {/* Cycle indicators */}
          <div className="flex items-center gap-2">
            {Array.from({ length: config.cyclesBeforeLongBreak }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-full transition-all duration-300',
                  i < (cyclesCompleted % config.cyclesBeforeLongBreak)
                    ? 'bg-primary scale-110'
                    : 'bg-muted'
                )}
              />
            ))}
          </div>

          {/* Timer */}
          <CircularProgress value={progress} size={240} strokeWidth={6}>
            <TimeDisplay hours={hours} minutes={minutes} seconds={seconds} isRunning={state === 'running'} size="md" />
          </CircularProgress>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {state === 'running' ? (
              <Button size="lg" onClick={handlePause} className="rounded-xl gap-2 bg-amber-600 hover:bg-amber-700">
                <Pause className="h-4 w-4" /> Pausar
              </Button>
            ) : (
              <Button size="lg" onClick={handleStart} className="rounded-xl gap-2 px-8">
                <Play className="h-4 w-4" /> {state === 'paused' ? 'Retomar' : 'Iniciar'}
              </Button>
            )}
            {state !== 'idle' && (
              <Button variant="destructive" size="lg" onClick={handleReset} className="rounded-xl gap-2">
                <RotateCcw className="h-4 w-4" /> Resetar
              </Button>
            )}
            {cyclesCompleted > 0 && state !== 'running' && (
              <Button variant="outline" size="lg" onClick={handleSave} className="rounded-xl gap-2">
                <Save className="h-4 w-4" /> Salvar
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4 border-t border-border/50 w-full justify-center">
            <div className="text-center">
              <div className="text-2xl font-semibold text-foreground">{cyclesCompleted}</div>
              <div>Ciclos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-foreground">{Math.round(totalFocusSeconds / 60)}</div>
              <div>Min foco</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
