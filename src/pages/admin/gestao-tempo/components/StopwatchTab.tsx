import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { TimeDisplay } from './TimeDisplay';
import { Play, Pause, RotateCcw, Flag, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Lap {
  id: number;
  time: number;
  delta: number;
}

type StopwatchState = 'stopped' | 'running' | 'paused';

export const StopwatchTab: React.FC = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<StopwatchState>('stopped');
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [label, setLabel] = useState('');
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);
  const startedAtRef = useRef<string>('');

  const tick = useCallback(() => {
    const now = performance.now();
    setElapsed(accumulatedRef.current + (now - startTimeRef.current));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handleStart = () => {
    if (state === 'stopped') {
      startedAtRef.current = new Date().toISOString();
      accumulatedRef.current = 0;
    }
    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    setState('running');
  };

  const handlePause = () => {
    cancelAnimationFrame(rafRef.current);
    accumulatedRef.current = elapsed;
    setState('paused');
  };

  const handleReset = () => {
    cancelAnimationFrame(rafRef.current);
    setElapsed(0);
    setLaps([]);
    accumulatedRef.current = 0;
    setState('stopped');
  };

  const handleLap = () => {
    const lastLapTime = laps.length > 0 ? laps[laps.length - 1].time : 0;
    setLaps(prev => [...prev, {
      id: prev.length + 1,
      time: elapsed,
      delta: elapsed - lastLapTime,
    }]);
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    const durationSeconds = Math.round(elapsed / 1000);
    const { error } = await supabase.from('time_sessions' as any).insert({
      user_id: session.user.id,
      type: 'stopwatch',
      label: label || 'Cronômetro',
      duration_seconds: durationSeconds,
      started_at: startedAtRef.current || new Date().toISOString(),
      ended_at: new Date().toISOString(),
      laps: laps.map(l => ({ id: l.id, time: l.time, delta: l.delta })),
    });
    if (error) {
      toast.error('Erro ao salvar sessão');
    } else {
      toast.success('Sessão salva com sucesso');
      queryClient.invalidateQueries({ queryKey: ['time-sessions'] });
      handleReset();
      setLabel('');
    }
  };

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const totalMs = Math.floor(elapsed);
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const ms = Math.floor((totalMs % 1000) / 10);

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main display */}
      <div className="lg:col-span-2">
        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardContent className="p-8 md:p-12 flex flex-col items-center gap-8">
            {/* Label input */}
            <Input
              placeholder="Nome da sessão (ex: Sprint de Design)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="max-w-sm text-center border-none bg-muted/30 rounded-xl"
            />

            {/* Time display */}
            <TimeDisplay
              hours={hours}
              minutes={minutes}
              seconds={seconds}
              milliseconds={ms}
              isRunning={state === 'running'}
            />

            {/* Controls */}
            <div className="flex items-center gap-3">
              {state === 'running' && (
                <>
                  <Button variant="outline" size="lg" onClick={handleLap} className="rounded-xl gap-2">
                    <Flag className="h-4 w-4" /> Lap
                  </Button>
                  <Button size="lg" onClick={handlePause} className="rounded-xl gap-2 bg-amber-600 hover:bg-amber-700">
                    <Pause className="h-4 w-4" /> Pausar
                  </Button>
                </>
              )}
              {state === 'paused' && (
                <>
                  <Button variant="destructive" size="lg" onClick={handleReset} className="rounded-xl gap-2">
                    <RotateCcw className="h-4 w-4" /> Resetar
                  </Button>
                  <Button size="lg" onClick={handleStart} className="rounded-xl gap-2">
                    <Play className="h-4 w-4" /> Retomar
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleSave} className="rounded-xl gap-2">
                    <Save className="h-4 w-4" /> Salvar
                  </Button>
                </>
              )}
              {state === 'stopped' && (
                <Button size="lg" onClick={handleStart} className="rounded-xl gap-2 px-8">
                  <Play className="h-4 w-4" /> Iniciar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Laps panel */}
      <div>
        <Card className="rounded-2xl shadow-sm border-border/50 h-full">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Voltas</h3>
            {laps.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 text-center py-8">Nenhuma volta registrada</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {[...laps].reverse().map((lap) => (
                  <div key={lap.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 text-sm">
                    <span className="font-mono text-muted-foreground">#{lap.id}</span>
                    <span className="font-mono">{formatTime(lap.delta)}</span>
                    <span className="font-mono text-muted-foreground/60 text-xs">{formatTime(lap.time)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
