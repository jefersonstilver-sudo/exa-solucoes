import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { TimeDisplay } from './TimeDisplay';
import { CircularProgress } from './CircularProgress';
import { Play, Pause, RotateCcw, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type TimerState = 'idle' | 'running' | 'paused' | 'finished';

const PRESETS = [
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 },
  { label: '1 hora', seconds: 3600 },
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
            // Play sound
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczIj2markup');
            } catch {}
            toast.info('⏰ Temporizador finalizado!', { duration: 5000 });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [state]);

  const handlePause = () => {
    clearInterval(intervalRef.current);
    setState('paused');
  };

  const handleResume = () => {
    setState('running');
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setRemaining(0);
    setTotalSeconds(0);
    setState('idle');
  };

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
    if (error) {
      toast.error('Erro ao salvar sessão');
    } else {
      toast.success('Sessão salva');
      queryClient.invalidateQueries({ queryKey: ['time-sessions'] });
      handleReset();
      setLabel('');
    }
  };

  const handleCustomStart = () => {
    const mins = parseInt(inputMinutes);
    if (mins > 0) {
      startTimer(mins * 60);
      setInputMinutes('');
    }
  };

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-8">
      <Card className="rounded-2xl shadow-sm border-border/50 w-full max-w-lg">
        <CardContent className="p-8 md:p-12 flex flex-col items-center gap-8">
          {/* Label */}
          <Input
            placeholder="Nome do temporizador"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="max-w-sm text-center border-none bg-muted/30 rounded-xl"
          />

          {/* Circular progress + time */}
          <CircularProgress value={progress} size={260} strokeWidth={8}>
            <TimeDisplay hours={hours} minutes={minutes} seconds={seconds} isRunning={state === 'running'} size="md" />
            {state === 'finished' && (
              <span className="text-sm font-medium text-primary animate-pulse mt-2">Finalizado!</span>
            )}
          </CircularProgress>

          {/* Presets or controls */}
          {state === 'idle' ? (
            <div className="space-y-4 w-full">
              <div className="flex flex-wrap gap-2 justify-center">
                {PRESETS.map(p => (
                  <Button key={p.seconds} variant="outline" className="rounded-xl" onClick={() => startTimer(p.seconds)}>
                    {p.label}
                  </Button>
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
                <Button onClick={handleCustomStart} className="rounded-xl gap-2">
                  <Play className="h-4 w-4" /> Iniciar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {state === 'running' && (
                <Button size="lg" onClick={handlePause} className="rounded-xl gap-2 bg-amber-600 hover:bg-amber-700">
                  <Pause className="h-4 w-4" /> Pausar
                </Button>
              )}
              {state === 'paused' && (
                <>
                  <Button variant="destructive" size="lg" onClick={handleReset} className="rounded-xl gap-2">
                    <RotateCcw className="h-4 w-4" /> Resetar
                  </Button>
                  <Button size="lg" onClick={handleResume} className="rounded-xl gap-2">
                    <Play className="h-4 w-4" /> Retomar
                  </Button>
                </>
              )}
              {(state === 'finished' || state === 'paused') && (
                <Button variant="outline" size="lg" onClick={handleSave} className="rounded-xl gap-2">
                  <Save className="h-4 w-4" /> Salvar
                </Button>
              )}
              {state === 'finished' && (
                <Button variant="destructive" size="lg" onClick={handleReset} className="rounded-xl gap-2">
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
