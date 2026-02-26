import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/design-system/layouts/PageLayout';
import { AppleTabs, AppleTabsList, AppleTabsTrigger, AppleTabsContent } from '@/design-system/components/AppleTabs';
import { Clock, Timer, Brain } from 'lucide-react';
import { StopwatchTab } from './components/StopwatchTab';
import { TimerTab } from './components/TimerTab';
import { PomodoroTab } from './components/PomodoroTab';
import { SessionHistory } from './components/SessionHistory';
import { DayStats } from './components/DayStats';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LiveClock: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-border/30 px-6 py-4 mb-2">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-primary/70" />
        <span className="text-sm font-medium text-muted-foreground">
          {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </span>
      </div>
      <span className="font-mono text-2xl font-light tracking-wider text-foreground">
        {format(now, 'HH:mm:ss')}
      </span>
    </div>
  );
};

const GestaoTempoPage: React.FC = () => {
  return (
    <PageLayout
      title="Gestão de Tempo"
      subtitle="Controle e otimize o tempo da sua equipe"
    >
      <LiveClock />

      <AppleTabs defaultValue="stopwatch">
        <div className="flex justify-center">
          <AppleTabsList>
            <AppleTabsTrigger value="stopwatch" className="gap-2">
              <Clock className="h-4 w-4" /> Cronômetro
            </AppleTabsTrigger>
            <AppleTabsTrigger value="timer" className="gap-2">
              <Timer className="h-4 w-4" /> Temporizador
            </AppleTabsTrigger>
            <AppleTabsTrigger value="pomodoro" className="gap-2">
              <Brain className="h-4 w-4" /> Pomodoro
            </AppleTabsTrigger>
          </AppleTabsList>
        </div>

        <AppleTabsContent value="stopwatch">
          <StopwatchTab />
        </AppleTabsContent>
        <AppleTabsContent value="timer">
          <TimerTab />
        </AppleTabsContent>
        <AppleTabsContent value="pomodoro">
          <PomodoroTab />
        </AppleTabsContent>
      </AppleTabs>

      {/* Stats + History side by side on desktop */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DayStats />
        </div>
        <div>
          <SessionHistory />
        </div>
      </div>
    </PageLayout>
  );
};

export default GestaoTempoPage;
