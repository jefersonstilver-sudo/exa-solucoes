import React from 'react';
import { DetailedContextStats } from '../../../hooks/useConversationContextDetailed';
import { MessageCircle, User, Bot, Calendar } from 'lucide-react';

interface ContextStatsProps {
  stats: DetailedContextStats;
}

export const ContextStats: React.FC<ContextStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Contato */}
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Contato</span>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.messagesByContact}
          </p>
          <p className="text-xs text-muted-foreground">
            {stats.totalMessages > 0 
              ? `${Math.round((stats.messagesByContact / stats.totalMessages) * 100)}% das mensagens`
              : '0%'}
          </p>
        </div>
      </div>

      {/* Agente */}
      <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Agente</span>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.messagesByAgent}
          </p>
          <p className="text-xs text-muted-foreground">
            {stats.totalMessages > 0 
              ? `${Math.round((stats.messagesByAgent / stats.totalMessages) * 100)}% das mensagens`
              : '0%'}
          </p>
        </div>
      </div>

      {/* Iniciador */}
      <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Iniciador</span>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {stats.whoStarted === 'contact' ? 'Contato' : stats.whoStarted === 'agent' ? 'Agente' : 'Desconhecido'}
          </p>
          <p className="text-xs text-muted-foreground">
            {stats.firstMessageDate 
              ? new Date(stats.firstMessageDate).toLocaleDateString('pt-BR')
              : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};
