import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Building2, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SyncNotionPage = () => {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch buildings with notion data
  const { data: buildings, isLoading: loadingBuildings } = useQuery({
    queryKey: ['notion-buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, nome, endereco, bairro, status, notion_status, notion_page_id, notion_last_synced_at, notion_oti, notion_internal_id, numero_unidades, publico_estimado')
        .not('notion_page_id', 'is', null)
        .order('nome');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch sync logs
  const { data: syncLogs, isLoading: loadingLogs } = useQuery({
    queryKey: ['notion-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notion_sync_logs')
        .select('*')
        .order('sync_started_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Force sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      const { data, error } = await supabase.functions.invoke('sync-notion-buildings');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sincronização concluída! ${data?.created || 0} criados, ${data?.updated || 0} atualizados`);
      queryClient.invalidateQueries({ queryKey: ['notion-buildings'] });
      queryClient.invalidateQueries({ queryKey: ['notion-sync-logs'] });
    },
    onError: (error: any) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    },
    onSettled: () => {
      setIsSyncing(false);
    }
  });

  const lastSync = syncLogs?.[0];
  const totalBuildings = buildings?.length || 0;
  const activeBuildings = buildings?.filter(b => b.notion_status === 'Ativo')?.length || 0;
  const leadsBuildings = buildings?.filter(b => b.notion_status === 'Lead')?.length || 0;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'Ativo':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Ativo</Badge>;
      case 'Lead':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Lead</Badge>;
      case 'Instalação':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Instalação</Badge>;
      case 'Pausado':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Pausado</Badge>;
      default:
        return <Badge variant="outline">{status || 'N/A'}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <RefreshCw className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Sync Notion
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sincronização bidirecional com Notion
          </p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={isSyncing}
          className="bg-primary hover:bg-primary/90"
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Forçar Sincronização
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="glass-card-mobile-subtle">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Prédios</span>
            </div>
            <p className="text-xl md:text-2xl font-bold mt-1">{totalBuildings}</p>
          </CardContent>
        </Card>

        <Card className="glass-card-mobile-subtle">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Ativos</span>
            </div>
            <p className="text-xl md:text-2xl font-bold mt-1 text-emerald-500">{activeBuildings}</p>
          </CardContent>
        </Card>

        <Card className="glass-card-mobile-subtle">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Leads</span>
            </div>
            <p className="text-xl md:text-2xl font-bold mt-1 text-amber-500">{leadsBuildings}</p>
          </CardContent>
        </Card>

        <Card className="glass-card-mobile-subtle">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Última Sync</span>
            </div>
            <p className="text-sm md:text-base font-medium mt-1 truncate">
              {lastSync?.sync_started_at 
                ? format(new Date(lastSync.sync_started_at), "dd/MM HH:mm", { locale: ptBR })
                : 'Nunca'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Buildings List */}
      <Card className="glass-card-mobile-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Prédios Sincronizados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingBuildings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {buildings?.map((building) => (
                <div key={building.id} className="p-3 md:p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{building.nome}</span>
                        {getStatusBadge(building.notion_status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {building.endereco}, {building.bairro}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {building.notion_oti && (
                          <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
                            OTI: {building.notion_oti}
                          </span>
                        )}
                        {building.numero_unidades && (
                          <span>{building.numero_unidades} un.</span>
                        )}
                        {building.publico_estimado && (
                          <span>{building.publico_estimado.toLocaleString()} público</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0">
                      {building.notion_last_synced_at && (
                        <span>
                          {format(new Date(building.notion_last_synced_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {buildings?.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum prédio sincronizado ainda</p>
                  <p className="text-xs mt-1">Clique em "Forçar Sincronização" para começar</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Logs */}
      <Card className="glass-card-mobile-subtle">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico de Sincronizações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingLogs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {syncLogs?.map((log) => (
                <div key={log.id} className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : log.status === 'error' ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      )}
                      <span className="text-sm font-medium">
                        {format(new Date(log.sync_started_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {log.buildings_created > 0 && (
                        <span className="text-emerald-500">+{log.buildings_created}</span>
                      )}
                      {log.buildings_updated > 0 && (
                        <span className="text-blue-500">↻{log.buildings_updated}</span>
                      )}
                      {log.duration_ms && (
                        <span>{(log.duration_ms / 1000).toFixed(1)}s</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {syncLogs?.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma sincronização realizada</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncNotionPage;
