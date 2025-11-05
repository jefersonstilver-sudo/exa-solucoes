import { Shield, AlertTriangle, AlertOctagon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { SecurityMetrics } from '@/types/security';

interface ThreatLevelIndicatorProps {
  metrics?: SecurityMetrics;
}

export const ThreatLevelIndicator = ({ metrics }: ThreatLevelIndicatorProps) => {
  const threatLevel = metrics?.threatLevel || 'low';
  const threatScore = metrics?.threatScore || 0;

  const config = {
    low: {
      icon: Shield,
      label: 'Nível de Ameaça: BAIXO',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Sistema operando normalmente'
    },
    medium: {
      icon: AlertTriangle,
      label: 'Nível de Ameaça: MÉDIO',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      description: 'Atividade suspeita detectada'
    },
    high: {
      icon: AlertOctagon,
      label: 'Nível de Ameaça: ALTO',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: 'Múltiplas ameaças detectadas!'
    }
  };

  const current = config[threatLevel];
  const Icon = current.icon;

  return (
    <Card className={`${current.borderColor} border-2 ${threatLevel === 'high' ? 'animate-pulse' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-4 rounded-full ${current.bgColor}`}>
            <Icon className={`h-8 w-8 ${current.color}`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${current.color}`}>
              {current.label}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {current.description}
            </p>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Score de Ameaça</span>
                <span className={`font-bold ${current.color}`}>{threatScore}/100</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    threatLevel === 'high' ? 'bg-red-500' :
                    threatLevel === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${threatScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
