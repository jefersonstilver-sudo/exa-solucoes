import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2, Brain, Code, Bug, CheckCircle2 } from 'lucide-react';

interface AIAnalysisProgressModalProps {
  open: boolean;
  progress: number;
  currentStep: string;
}

const getStepIcon = (step: string) => {
  if (step.includes('Coletando')) return <Code className="h-5 w-5 text-blue-500" />;
  if (step.includes('Enviando')) return <Loader2 className="h-5 w-5 text-purple-500 animate-spin" />;
  if (step.includes('Analisando')) return <Brain className="h-5 w-5 text-amber-500" />;
  if (step.includes('Salvando')) return <Bug className="h-5 w-5 text-green-500" />;
  if (step.includes('Concluído')) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  return <Loader2 className="h-5 w-5 animate-spin" />;
};

export const AIAnalysisProgressModal: React.FC<AIAnalysisProgressModalProps> = ({
  open,
  progress,
  currentStep
}) => {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
            Análise com IA em Progresso
          </DialogTitle>
          <DialogDescription>
            Analisando página com Inteligência Artificial...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Progresso</span>
              <span className="font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Step */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            {getStepIcon(currentStep)}
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{currentStep}</p>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Primeira análise: 5-15 segundos
            </p>
            <p className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
              Análises seguintes: Instantâneas (cache)
            </p>
            <p className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
              Consumo estimado: ~1 crédito Lovable AI
            </p>
          </div>

          {/* Animation */}
          <div className="flex justify-center">
            <div className="flex gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
