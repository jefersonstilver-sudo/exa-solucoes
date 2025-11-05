import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserRound, Mail, Phone, Calendar, CreditCard, TrendingUp } from 'lucide-react';
import { type UnifiedClientData } from '@/services/crmService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientSummaryTabProps {
  data: UnifiedClientData;
}

export function ClientSummaryTab({ data }: ClientSummaryTabProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Informações Pessoais */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserRound className="h-5 w-5" />
          Dados Pessoais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{data.user.email}</p>
              </div>
            </div>

            {data.user.telefone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="font-medium">{data.user.telefone}</p>
                </div>
              </div>
            )}

            {data.user.cpf && (
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">CPF</p>
                  <p className="font-medium">{data.user.cpf}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Cliente desde</p>
                <p className="font-medium">{formatDate(data.user.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline">{data.user.role}</Badge>
            </div>

            {data.behavior?.last_visit && (
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Última visita</p>
                  <p className="font-medium">{formatDate(data.behavior.last_visit)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Resumo de Atividade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Total de Pedidos</p>
            <p className="text-4xl font-bold text-green-600">{data.orders.total_orders}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Total Gasto</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.orders.total_spent)}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Tentativas Abandonadas</p>
            <p className="text-4xl font-bold text-orange-600">{data.attempts.total_attempts}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Valor: {formatCurrency(data.attempts.total_abandoned_value)}
            </p>
          </div>
        </Card>
      </div>

      {/* Score de Engajamento */}
      {data.behavior && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Engajamento</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Sessões</p>
              <p className="text-2xl font-bold">{data.behavior.total_sessions || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tempo Total</p>
              <p className="text-2xl font-bold">
                {Math.floor((data.behavior.total_time_spent || 0) / 60)}min
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Carrinhos Abandonados</p>
              <p className="text-2xl font-bold">{data.behavior.cart_abandonments || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Score IA</p>
              <p className="text-2xl font-bold text-primary">
                {data.behavior.purchase_intent_score || 0}%
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
