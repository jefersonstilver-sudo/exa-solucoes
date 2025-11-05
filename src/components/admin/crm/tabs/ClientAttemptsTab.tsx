import { Card } from '@/components/ui/card';
import { AlertCircle, Calendar, DollarSign, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientAttemptsTabProps {
  attempts: {
    total_attempts: number;
    total_abandoned_value: number;
    attempts: Array<{
      id: string;
      valor_total: number;
      created_at: string;
      predios_selecionados?: string[];
    }>;
  };
}

export function ClientAttemptsTab({ attempts }: ClientAttemptsTabProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (attempts.total_attempts === 0) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Este cliente não possui tentativas abandonadas</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Tentativas Abandonadas</p>
              <p className="text-3xl font-bold">{attempts.total_attempts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <DollarSign className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Valor Abandonado</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(attempts.total_abandoned_value)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Tentativas */}
      <div className="space-y-3">
        {attempts.attempts.map((attempt) => (
          <Card key={attempt.id} className="p-6 border-l-4 border-l-orange-500">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tentativa</p>
                  <p className="font-mono text-sm">{attempt.id.slice(0, 8)}...</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(attempt.valor_total)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Abandonado em</p>
                  <p className="font-medium">{formatDate(attempt.created_at)}</p>
                </div>
              </div>

              {attempt.predios_selecionados && attempt.predios_selecionados.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {attempt.predios_selecionados.length} prédio(s) no carrinho
                  </p>
                </div>
              )}

              <div className="pt-2 border-t bg-orange-50 -mx-6 -mb-6 px-6 py-3 rounded-b">
                <p className="text-xs text-orange-800 font-medium">
                  💡 Ação recomendada: Enviar cupom de desconto ou fazer contato direto
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
