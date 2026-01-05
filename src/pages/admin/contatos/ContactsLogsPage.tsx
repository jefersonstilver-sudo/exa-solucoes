import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Filter, Download, Calendar, User, Tag, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useContactLogs, ContactLog } from '@/hooks/contatos/useContactLogs';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  create: { label: 'Criado', color: 'bg-green-100 text-green-700', icon: '➕' },
  update: { label: 'Atualizado', color: 'bg-blue-100 text-blue-700', icon: '✏️' },
  delete: { label: 'Excluído', color: 'bg-red-100 text-red-700', icon: '🗑️' },
  view: { label: 'Visualizado', color: 'bg-gray-100 text-gray-700', icon: '👁️' },
  export: { label: 'Exportado', color: 'bg-purple-100 text-purple-700', icon: '📤' },
};

const PERIOD_OPTIONS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: 'all', label: 'Todo o período' },
];

const ContactsLogsPage = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  
  const [period, setPeriod] = useState('30');
  const [actionType, setActionType] = useState<string>('all');

  const startDate = period === 'all' ? undefined : startOfDay(subDays(new Date(), parseInt(period)));
  const endDate = period === 'all' ? undefined : endOfDay(new Date());

  const { logs, loading, hasMore, loadMore, refetch } = useContactLogs({
    limit: 50,
    filters: {
      startDate,
      endDate,
      actionType: actionType === 'all' ? undefined : actionType,
    }
  });

  const getActionInfo = (log: ContactLog) => {
    const baseAction = ACTION_LABELS[log.action_type] || { 
      label: log.action_type, 
      color: 'bg-gray-100 text-gray-700', 
      icon: '📝' 
    };

    // Enrich with metadata action
    const metaAction = log.metadata?.action;
    if (metaAction) {
      switch (metaAction) {
        case 'categoria_changed':
          return { ...baseAction, label: 'Categoria alterada', icon: '🏷️' };
        case 'temperatura_changed':
          return { ...baseAction, label: 'Temperatura alterada', icon: '🌡️' };
        case 'status_changed':
          return { ...baseAction, label: 'Status alterado', icon: '📊' };
        case 'fields_updated':
          return { ...baseAction, label: 'Campos editados', icon: '✏️' };
        case 'consolidated':
          return { ...baseAction, label: 'Consolidado', icon: '🔗' };
      }
    }

    return baseAction;
  };

  const formatLogDetails = (log: ContactLog): string => {
    const meta = log.metadata;
    if (!meta) return '';

    if (meta.action === 'categoria_changed' && meta.old_values && meta.new_values) {
      return `${meta.old_values.categoria || '?'} → ${meta.new_values.categoria || '?'}`;
    }
    if (meta.action === 'temperatura_changed' && meta.old_values && meta.new_values) {
      return `${meta.old_values.temperatura || 'Não definido'} → ${meta.new_values.temperatura || 'Não definido'}`;
    }
    if (meta.action === 'status_changed' && meta.old_values && meta.new_values) {
      return `${meta.old_values.status || '?'} → ${meta.new_values.status || '?'}`;
    }
    if (meta.action === 'fields_updated' && meta.changed_fields) {
      return `Campos: ${meta.changed_fields.join(', ')}`;
    }
    if (log.action_type === 'delete' && meta.contact_name) {
      return `"${meta.contact_name}" - ${meta.contact_phone || ''}`;
    }

    return log.action_description || '';
  };

  const groupLogsByDate = (logs: ContactLog[]) => {
    const groups: Record<string, ContactLog[]> = {};
    
    logs.forEach(log => {
      const dateKey = format(new Date(log.created_at), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });

    return Object.entries(groups).map(([date, logs]) => ({
      date,
      displayDate: format(new Date(date), "EEEE, d 'de' MMMM", { locale: ptBR }),
      logs
    }));
  };

  const groupedLogs = groupLogsByDate(logs);

  const handleExportCSV = () => {
    const csvContent = [
      ['Data/Hora', 'Usuário', 'Contato', 'Ação', 'Detalhes'].join(','),
      ...logs.map(log => [
        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm'),
        log.user_name || '-',
        log.contact_name || '-',
        getActionInfo(log).label,
        formatLogDetails(log).replace(/,/g, ';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs-contatos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-background dark:to-muted/20 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(buildPath('contatos/configuracoes/pontuacao'))}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-lg font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Histórico de Alterações
          </h1>
          <p className="text-sm text-muted-foreground">
            Registro de todas as alterações feitas em contatos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 dark:bg-card/50 backdrop-blur-sm border-white/20">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger className="w-[180px] h-8 text-sm">
                  <SelectValue placeholder="Tipo de ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="create">Criação</SelectItem>
                  <SelectItem value="update">Atualização</SelectItem>
                  <SelectItem value="delete">Exclusão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto text-sm text-muted-foreground">
              {logs.length} registros
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <div className="space-y-4">
        {loading && logs.length === 0 ? (
          <Card className="bg-white/80 dark:bg-card/50">
            <CardContent className="py-8 text-center text-muted-foreground">
              Carregando logs...
            </CardContent>
          </Card>
        ) : logs.length === 0 ? (
          <Card className="bg-white/80 dark:bg-card/50">
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum log encontrado para os filtros selecionados
            </CardContent>
          </Card>
        ) : (
          groupedLogs.map(group => (
            <div key={group.date} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground capitalize px-1">
                {group.displayDate}
              </h3>
              <div className="space-y-2">
                {group.logs.map(log => {
                  const actionInfo = getActionInfo(log);
                  const details = formatLogDetails(log);

                  return (
                    <Card 
                      key={log.id} 
                      className="bg-white/80 dark:bg-card/50 backdrop-blur-sm border-white/20 hover:bg-white/90 transition-colors"
                    >
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <div className="text-xl">{actionInfo.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {log.user_name}
                              </span>
                              <Badge variant="secondary" className={`text-xs ${actionInfo.color}`}>
                                {actionInfo.label}
                              </Badge>
                              {log.contact_name && (
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="h-auto p-0 text-xs text-primary"
                                  onClick={() => log.entity_id && navigate(buildPath(`contatos/${log.entity_id}`))}
                                >
                                  {log.contact_name}
                                </Button>
                              )}
                            </div>
                            {details && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {details}
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(log.created_at), 'HH:mm')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {hasMore && (
          <div className="text-center pt-4">
            <Button 
              variant="outline" 
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Carregando...' : 'Carregar mais'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsLogsPage;
