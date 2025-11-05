import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target, Loader2 } from 'lucide-react';
import { type AIAnalysis } from '@/services/crmService';

interface ClientAIAnalysisTabProps {
  analysis: AIAnalysis | null;
  onRunAnalysis: () => void;
  loading: boolean;
}

export function ClientAIAnalysisTab({ analysis, onRunAnalysis, loading }: ClientAIAnalysisTabProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getInterestLevelBadge = (level: string) => {
    const config: Record<string, { label: string; className: string }> = {
      very_high: { label: 'MUITO ALTO 🔥', className: 'bg-red-500 hover:bg-red-600' },
      high: { label: 'ALTO ⚡', className: 'bg-orange-500 hover:bg-orange-600' },
      medium: { label: 'MÉDIO 📊', className: 'bg-yellow-500 hover:bg-yellow-600' },
      low: { label: 'BAIXO 📉', className: 'bg-gray-400 hover:bg-gray-500' },
    };

    const { label, className } = config[level] || config.low;
    return <Badge className={className}>{label}</Badge>;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return '🔴';
    if (priority === 'medium') return '🟡';
    return '🟢';
  };

  if (!analysis) {
    return (
      <Card className="p-12 text-center space-y-4">
        <Brain className="h-16 w-16 mx-auto text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold mb-2">Análise IA não executada</h3>
          <p className="text-muted-foreground mb-4">
            Execute a análise comportamental com IA para obter insights sobre este cliente
          </p>
          <Button onClick={onRunAnalysis} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Executar Análise IA
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score de Interesse */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Score de Interesse IA
          </h3>
          {getInterestLevelBadge(analysis.interest_level)}
        </div>

        <div className="text-center py-6">
          <p className={`text-7xl font-bold ${getScoreColor(analysis.interest_score)}`}>
            {analysis.interest_score}
          </p>
          <p className="text-2xl text-muted-foreground mt-2">/ 100</p>
        </div>

        {analysis.conversion_probability_percent !== undefined && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Probabilidade de Conversão</p>
              <Badge variant="outline">{analysis.conversion_probability_percent}%</Badge>
            </div>
          </div>
        )}
      </Card>

      {/* Resumo do Comportamento */}
      {analysis.behavior_summary && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resumo do Comportamento
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {analysis.behavior_summary}
          </p>
        </Card>
      )}

      {/* Interesses Principais */}
      {analysis.main_interests && analysis.main_interests.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Interesses Principais
          </h3>
          <div className="space-y-2">
            {analysis.main_interests.map((interest, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <p className="text-sm">{interest}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Ações Recomendadas */}
      {analysis.recommended_actions && analysis.recommended_actions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Ações Recomendadas
          </h3>
          <div className="space-y-4">
            {analysis.recommended_actions.map((action, index) => (
              <Card key={index} className="p-4 border-l-4 border-l-primary">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getPriorityIcon(action.priority)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{action.action}</p>
                      <Badge variant="outline" className="capitalize">
                        {action.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.reasoning}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Próxima Melhor Ação */}
      {analysis.next_best_action && (
        <Card className="p-6 bg-primary/5 border-primary">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Próxima Melhor Ação
          </h3>
          <p className="text-sm font-medium">{analysis.next_best_action}</p>
        </Card>
      )}

      {/* Risco de Churn */}
      {analysis.churn_risk && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risco de Perda (Churn)
          </h3>
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className={
                analysis.churn_risk === 'high'
                  ? 'border-red-500 text-red-500'
                  : analysis.churn_risk === 'medium'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-green-500 text-green-500'
              }
            >
              {analysis.churn_risk === 'high' && 'ALTO RISCO ⚠️'}
              {analysis.churn_risk === 'medium' && 'RISCO MÉDIO ⚡'}
              {analysis.churn_risk === 'low' && 'BAIXO RISCO ✅'}
            </Badge>
          </div>
        </Card>
      )}

      {/* Insights Adicionais */}
      {analysis.insights && analysis.insights.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Insights Adicionais
          </h3>
          <div className="space-y-2">
            {analysis.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-primary font-bold">💡</span>
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Data da Análise */}
      {analysis.analyzed_at && (
        <p className="text-xs text-center text-muted-foreground">
          Análise realizada em: {new Date(analysis.analyzed_at).toLocaleString('pt-BR')}
        </p>
      )}
    </div>
  );
}
