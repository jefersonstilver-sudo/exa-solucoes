import React from 'react';
import { PageLayout } from '@/design-system/layouts/PageLayout';
import { AppleTabs, AppleTabsList, AppleTabsTrigger, AppleTabsContent } from '@/design-system/components/AppleTabs';
import { Clock, Timer, Brain } from 'lucide-react';
import { StopwatchTab } from './components/StopwatchTab';
import { TimerTab } from './components/TimerTab';
import { PomodoroTab } from './components/PomodoroTab';
import { SessionHistory } from './components/SessionHistory';
import { DayStats } from './components/DayStats';

const GestaoTempoPage: React.FC = () => {
  return (
    <PageLayout
      title="Gestão de Tempo"
      subtitle="Controle e otimize o tempo da sua equipe"
    >
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

      {/* Stats + History */}
      <div className="mt-8 space-y-6">
        <DayStats />
        <SessionHistory />
      </div>
    </PageLayout>
  );
};

export default GestaoTempoPage;
