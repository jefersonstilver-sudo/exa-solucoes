/**
 * Aba 4: Auditoria
 * Timeline unificada de eventos do usuário
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RefreshCw,
  Clock,
  LogIn,
  LogOut,
  Shield,
  Building2,
  User,
  Activity,
  Ban,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { AuditTabProps, AuditEntry } from '@/types/userConsoleTypes';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const getEventIcon = (type: AuditEntry['type']) => {
  const icons: Record<AuditEntry['type'], React.ReactNode> = {
    'login': <LogIn className="h-4 w-4 text-green-500" />,
    'logout': <LogOut className="h-4 w-4 text-gray-500" />,
    'role_change': <Shield className="h-4 w-4 text-purple-500" />,
    'department_change': <Building2 className="h-4 w-4 text-blue-500" />,
    'permission': <Shield className="h-4 w-4 text-indigo-500" />,
    'profile': <User className="h-4 w-4 text-amber-500" />,
    'action': <Activity className="h-4 w-4 text-gray-500" />,
    'blocked': <Ban className="h-4 w-4 text-red-500" />,
    'unblocked': <Unlock className="h-4 w-4 text-green-500" />
  };
  return icons[type] || <Activity className="h-4 w-4 text-gray-500" />;
};

const getEventBadgeClass = (type: AuditEntry['type']) => {
  const classes: Record<AuditEntry['type'], string> = {
    'login': 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300',
    'logout': 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300',
    'role_change': 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300',
    'department_change': 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
    'permission': 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300',
    'profile': 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300',
    'action': 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300',
    'blocked': 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300',
    'unblocked': 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300'
  };
  return classes[type] || classes['action'];
};

const getEventLabel = (type: AuditEntry['type']) => {
  const labels: Record<AuditEntry['type'], string> = {
    'login': 'Login',
    'logout': 'Logout',
    'role_change': 'Alteração de Cargo',
    'department_change': 'Alteração de Departamento',
    'permission': 'Permissão',
    'profile': 'Perfil',
    'action': 'Ação',
    'blocked': 'Bloqueado',
    'unblocked': 'Desbloqueado'
  };
  return labels[type] || 'Evento';
};

export const AuditTab: React.FC<AuditTabProps> = ({
  userId,
  entries,
  isLoading,
  onRefresh
}) => {
  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateString));
    } catch {
      return 'Data inválida';
    }
  };

  const formatRelativeDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      });
    } catch {
      return '';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Histórico de Auditoria
            </CardTitle>
            <CardDescription>
              Últimas 50 ações registradas
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando histórico...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma atividade registrada</p>
            <p className="text-xs mt-1">As ações do usuário aparecerão aqui</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {entries.map((entry, idx) => (
                <TimelineEntry
                  key={entry.id}
                  entry={entry}
                  isLast={idx === entries.length - 1}
                  formatDate={formatDate}
                  formatRelativeDate={formatRelativeDate}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

// === COMPONENTES AUXILIARES ===

interface TimelineEntryProps {
  entry: AuditEntry;
  isLast: boolean;
  formatDate: (date: string) => string;
  formatRelativeDate: (date: string) => string;
}

const TimelineEntry: React.FC<TimelineEntryProps> = ({
  entry,
  isLast,
  formatDate,
  formatRelativeDate
}) => (
  <div className={cn(
    "relative pl-8 pb-4",
    !isLast && "border-l-2 border-muted"
  )}>
    {/* Ícone */}
    <div className="absolute left-[-13px] top-0 w-6 h-6 rounded-full bg-background border-2 border-muted flex items-center justify-center">
      {getEventIcon(entry.type)}
    </div>

    {/* Conteúdo */}
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={cn("text-xs font-medium", getEventBadgeClass(entry.type))}>
          {getEventLabel(entry.type)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(entry.timestamp)}
        </span>
      </div>

      {/* Título */}
      <p className="text-sm font-medium">{entry.title}</p>

      {/* Descrição */}
      {entry.description && (
        <p className="text-sm text-muted-foreground">{entry.description}</p>
      )}

      {/* Metadados */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="font-mono">{formatDate(entry.timestamp)}</span>
        
        {entry.performedByEmail && (
          <span>
            Por: <strong>{entry.performedByEmail}</strong>
          </span>
        )}
        
        {entry.ip && (
          <span>IP: <span className="font-mono">{entry.ip}</span></span>
        )}
      </div>

      {/* Metadados expandíveis */}
      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer hover:text-foreground text-muted-foreground">
            Ver detalhes
          </summary>
          <pre className="mt-2 p-2 bg-muted/50 rounded text-xs overflow-x-auto">
            {JSON.stringify(entry.metadata, null, 2)}
          </pre>
        </details>
      )}
    </div>
  </div>
);
