import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, HelpCircle, AlertTriangle, MessageCircle, TrendingUp } from 'lucide-react';
import { useConversationContextDetailed } from '../../../hooks/useConversationContextDetailed';
import { MessagePreview } from './MessagePreview';
import { ContextStats } from './ContextStats';
import { cn } from '@/lib/utils';

interface LastContextCardProps {
  conversationId: string | null;
  currentContactType: string | null;
  onSuggestType?: (type: string) => void;
}

export const LastContextCard: React.FC<LastContextCardProps> = ({
  conversationId,
  currentContactType,
  onSuggestType
}) => {
  const context = useConversationContextDetailed(conversationId, currentContactType);

  const getStatusIcon = () => {
    switch (context.conversationStatus) {
      case 'resolved':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'waiting_response':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'dormant':
        return <HelpCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, { label: string; className: string }> = {
      resolved: { 
        label: 'Resolvido', 
        className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
      },
      waiting_response: { 
        label: 'Aguardando Resposta', 
        className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
      },
      dormant: { 
        label: 'Inativo', 
        className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20'
      },
      active: { 
        label: 'Ativo', 
        className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
      }
    };

    const status = variants[context.conversationStatus] || variants.active;
    return (
      <Badge variant="default" className={cn('gap-1', status.className)}>
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
    <div className="glass-card p-6 rounded-xl space-y-6 border-l-4 border-primary">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          Último Contexto Real
        </h3>
        {getStatusBadge()}
      </div>

      {/* Resumo Contextual */}
      <p className="text-sm leading-relaxed text-foreground/90">
        {context.contextSummary}
      </p>

      {/* Estatísticas em Cards */}
      <ContextStats stats={context.stats} />

      {/* Quem domina a conversa */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
        <div className="flex items-center gap-2 flex-1">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Fala mais:</span>
          <span className="text-sm text-muted-foreground">
            {context.stats.dominantSpeaker} ({context.stats.dominantPercentage}%)
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Há {context.stats.daysSinceFirstContact} {context.stats.daysSinceFirstContact === 1 ? 'dia' : 'dias'}
        </div>
      </div>

      {/* Últimas Mensagens Preview */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          📝 Últimas {context.lastMessages.length} Mensagens
        </h4>
        <div className="space-y-1 max-h-[300px] overflow-y-auto bg-muted/5 rounded-lg border border-border/30">
          {context.lastMessages.map((msg) => (
            <MessagePreview key={msg.id} message={msg} />
          ))}
        </div>
      </div>

      {/* Análise Adicional */}
      {(context.lastIssue || context.lastResolution || context.pendingAction) && (
        <div className="pt-4 border-t border-border/50 space-y-3">
          <h4 className="text-sm font-semibold">💡 Análise Contextual</h4>
          
          {context.lastIssue && (
            <div className="flex items-start gap-2 text-xs">
              <span className="font-medium text-orange-600 dark:text-orange-400 min-w-[100px]">
                Último Problema:
              </span>
              <span className="flex-1 text-foreground/80 line-clamp-2">
                {context.lastIssue}
              </span>
            </div>
          )}
          
          {context.lastResolution && (
            <div className="flex items-start gap-2 text-xs">
              <span className="font-medium text-green-600 dark:text-green-400 min-w-[100px]">
                Resolução:
              </span>
              <span className="flex-1 text-foreground/80 line-clamp-2">
                {context.lastResolution}
              </span>
            </div>
          )}
          
          {context.pendingAction && (
            <div className="flex items-start gap-2 text-xs">
              <span className="font-medium text-blue-600 dark:text-blue-400 min-w-[100px]">
                Ação Pendente:
              </span>
              <span className="flex-1 text-foreground/80 line-clamp-2">
                {context.pendingAction}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Indicadores Especiais */}
      <div className="flex flex-wrap gap-2">
        {context.hasExaAlerts && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            EXA Alert
          </Badge>
        )}
        {context.hasFinancialMentions && (
          <Badge variant="secondary" className="gap-1">
            💰 Financeiro
          </Badge>
        )}
        {context.hasMediaSent && (
          <Badge variant="outline" className="gap-1">
            📎 Mídia Enviada
          </Badge>
        )}
        {context.hasPendingQuestion && (
          <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
            ❓ Pergunta Pendente
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
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                  {context.suggestedContactType.type.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {context.suggestedContactType.confidence}% confiança
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {context.suggestedContactType.reason}
              </p>
              {onSuggestType && (
                <Button
                  onClick={() => onSuggestType(context.suggestedContactType!.type)}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Aplicar Sugestão
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
