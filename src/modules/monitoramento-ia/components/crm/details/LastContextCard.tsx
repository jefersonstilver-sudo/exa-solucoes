import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, HelpCircle, AlertTriangle } from 'lucide-react';
import { ConversationContext } from '../../../hooks/useConversationContext';
import { cn } from '@/lib/utils';

interface LastContextCardProps {
  context: ConversationContext;
  currentContactType: string | null;
  onSuggestType?: (type: string) => void;
}

export const LastContextCard: React.FC<LastContextCardProps> = ({
  context,
  currentContactType,
  onSuggestType
}) => {
  const getStatusIcon = () => {
    switch (context.currentStatus) {
      case 'resolved':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'awaiting_client':
        return <HelpCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, { label: string; variant: any; className: string }> = {
      resolved: { 
        label: 'Resolvido', 
        variant: 'default',
        className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
      },
      pending: { 
        label: 'Pendente', 
        variant: 'default',
        className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
      },
      awaiting_client: { 
        label: 'Aguardando Cliente', 
        variant: 'default',
        className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
      },
      unknown: { 
        label: 'Status Indefinido', 
        variant: 'outline',
        className: 'bg-muted/5 text-muted-foreground border-muted-foreground/20'
      }
    };

    const status = variants[context.currentStatus] || variants.unknown;
    return (
      <Badge variant={status.variant} className={cn('gap-1', status.className)}>
        {getStatusIcon()}
        {status.label}
      </Badge>
    );
  };

  if (context.loading) {
    return (
      <div className="glass-card p-6 rounded-xl animate-pulse">
        <div className="h-6 bg-muted/20 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-muted/20 rounded w-full mb-2"></div>
        <div className="h-4 bg-muted/20 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-xl space-y-4 border-l-4 border-primary">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          Último Contexto
        </h3>
        {getStatusBadge()}
      </div>

      {/* Resumo Contextual */}
      <p className="text-sm leading-relaxed text-foreground/90">
        {context.contextSummary}
      </p>

      {/* Indicadores Adicionais */}
      <div className="flex flex-wrap gap-2">
        {context.hasExaAlert && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            EXA Alert
          </Badge>
        )}
        {context.hasFinancialActivity && (
          <Badge variant="secondary" className="gap-1">
            💰 Financeiro
          </Badge>
        )}
        {context.lastManualSend && (
          <Badge variant="outline" className="gap-1">
            📎 {context.lastManualSend.type}
          </Badge>
        )}
      </div>

      {/* Sugestão de Tipo de Contato */}
      {context.suggestedContactType && (!currentContactType || currentContactType === 'unknown') && (
        <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              🤖
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-foreground">
                Sugestão de Tipo de Contato
              </p>
              <p className="text-xs text-muted-foreground">
                {context.suggestedContactType.reason}
              </p>
              {onSuggestType && (
                <button
                  onClick={() => onSuggestType(context.suggestedContactType!.type)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Aplicar sugestão: {context.suggestedContactType.type === 'sindico' ? 'Síndico' : 'Cliente'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detalhes Expandidos (se houver) */}
      {(context.lastProblem || context.lastAction) && (
        <div className="pt-3 border-t border-border/50 space-y-2 text-xs text-muted-foreground">
          {context.lastProblem && (
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-[80px]">Problema:</span>
              <span className="flex-1">{context.lastProblem}</span>
            </div>
          )}
          {context.lastAction && (
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-[80px]">Última Ação:</span>
              <span className="flex-1">
                {context.lastAction.agent} - {context.lastAction.action}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
