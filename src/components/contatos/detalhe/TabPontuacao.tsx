import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Contact, CATEGORIAS_CONFIG } from '@/types/contatos';
import { useScoringRules } from '@/hooks/contatos';
import { cn } from '@/lib/utils';

interface TabPontuacaoProps {
  contact: Contact;
}

export const TabPontuacao: React.FC<TabPontuacaoProps> = ({ contact }) => {
  const { rules, getConfigForCategory, getMaxScore } = useScoringRules();
  
  const maxScore = getMaxScore();
  const scoringConfig = getConfigForCategory(contact.categoria);
  const minScore = scoringConfig?.pontuacao_minima || 50;
  const currentScore = contact.pontuacao_atual || 0;
  const percentage = Math.min((currentScore / maxScore) * 100, 100);
  const isAboveMinimum = currentScore >= minScore;

  // Calcular pontos por campo preenchido
  const getFieldPoints = () => {
    const fieldPoints: { field: string; label: string; filled: boolean; points: number }[] = [];
    
    rules.forEach(rule => {
      if (!rule.ativo) return;
      
      let isFilled = false;
      const fieldValue = (contact as any)[rule.campo];
      
      if (Array.isArray(fieldValue)) {
        isFilled = fieldValue.length > 0;
      } else if (typeof fieldValue === 'string') {
        isFilled = fieldValue.trim().length > 0;
      } else if (typeof fieldValue === 'number') {
        isFilled = fieldValue > 0;
      } else {
        isFilled = !!fieldValue;
      }
      
      fieldPoints.push({
        field: rule.campo,
        label: rule.label,
        filled: isFilled,
        points: rule.pontos
      });
    });
    
    return fieldPoints.sort((a, b) => b.points - a.points);
  };

  const fieldPoints = getFieldPoints();
  const filledPoints = fieldPoints.filter(f => f.filled);
  const missingPoints = fieldPoints.filter(f => !f.filled);

  return (
    <div className="space-y-4">
      {/* Score Principal */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Círculo de Score */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="stroke-muted"
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="10"
                />
                <circle
                  className={cn(
                    'transition-all duration-500',
                    contact.bloqueado ? 'stroke-red-500' : 'stroke-green-500'
                  )}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - percentage / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{currentScore}</span>
                <span className="text-xs text-muted-foreground">de {maxScore} pts</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                isAboveMinimum 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              )}>
                {isAboveMinimum ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Contato Liberado
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Bloqueado - Faltam {minScore - currentScore} pts
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Pontuação mínima para {CATEGORIAS_CONFIG[contact.categoria].label}: {minScore} pontos
              </p>
              <Progress 
                value={(currentScore / minScore) * 100} 
                className="mt-3 h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown de Pontos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Campos Preenchidos */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Campos Preenchidos ({filledPoints.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filledPoints.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum campo pontuável preenchido</p>
              ) : (
                filledPoints.map((field) => (
                  <div 
                    key={field.field}
                    className="flex items-center justify-between py-1.5 px-2 bg-green-50 rounded-lg"
                  >
                    <span className="text-sm">{field.label}</span>
                    <span className="text-sm font-bold text-green-700">+{field.points}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Campos Faltantes */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Campos Faltantes ({missingPoints.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {missingPoints.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todos os campos estão preenchidos!</p>
              ) : (
                missingPoints.map((field) => (
                  <div 
                    key={field.field}
                    className="flex items-center justify-between py-1.5 px-2 bg-red-50 rounded-lg"
                  >
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                    <span className="text-sm font-medium text-red-600">+{field.points}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TabPontuacao;
