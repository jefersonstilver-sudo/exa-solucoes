import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PanelAccessLog {
  id: string;
  user_id: string;
  panel_id: string;
  access_type: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

const PanelAccessMonitor: React.FC = () => {
  const [logs, setLogs] = useState<PanelAccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  const checkAccess = async () => {
    try {
      const { data, error } = await supabase.rpc('can_access_panel_credentials');
      if (error) throw error;
      setCanAccess(data);
    } catch (error) {
      setCanAccess(false);
    }
  };

  const fetchLogs = async () => {
    if (!canAccess) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('panel_access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching panel access logs:', error);
      toast.error('Erro ao carregar logs de acesso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAccess().then(() => {
      if (canAccess) {
        fetchLogs();
      } else {
        setLoading(false);
      }
    });
  }, [canAccess]);

  if (!canAccess) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            Acesso Restrito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Apenas super administradores podem visualizar logs de acesso aos painéis.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Monitor de Acesso aos Painéis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando logs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAccessTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      'UPDATE': 'default',
      'VIEW_CREDENTIALS': 'secondary',
      'DELETE': 'destructive'
    };
    
    return (
      <Badge variant={variants[type] || 'default'}>
        {type}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Monitor de Acesso aos Painéis
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum log de acesso encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <AlertTriangle className="h-4 w-4" />
              Últimos 50 acessos aos painéis
            </div>
            
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card"
                >
                  <div className="flex items-center gap-3">
                    {getAccessTypeBadge(log.access_type)}
                    <div className="text-sm">
                      <div className="font-medium">
                        Usuário: <span className="font-mono">{log.user_id.substring(0, 8)}...</span>
                      </div>
                      <div className="text-muted-foreground">
                        Painel: <span className="font-mono">{log.panel_id.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{new Date(log.created_at).toLocaleDateString('pt-BR')}</div>
                    <div>{new Date(log.created_at).toLocaleTimeString('pt-BR')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PanelAccessMonitor;