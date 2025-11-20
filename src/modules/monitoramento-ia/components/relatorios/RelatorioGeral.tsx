import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Clock, MessageSquare, Target, Bell } from 'lucide-react';

export const RelatorioGeral = () => {
  const [metrics, setMetrics] = useState({
    clientesIrritados48h: 0,
    sindicosIrritados: 0,
    conversasCriticas: 0,
    leadsQuentes: 0,
    conversasEscaladas: 0,
    alertasEXA: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchMetrics();
  }, []);
  
  const fetchMetrics = async () => {
    const now = new Date();
    const hours48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    try {
      // Clientes irritados (últimas 48h)
      const { count: clientesIrritados } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .in('sentiment', ['negative', 'angry'])
        .gte('last_message_at', hours48Ago.toISOString());
      
      // Síndicos irritados
      const { count: sindicosIrritados } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('is_sindico', true)
        .in('sentiment', ['negative', 'angry']);
      
      // Conversas críticas
      const { count: conversasCriticas } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('is_critical', true);
      
      // Leads quentes
      const { count: leadsQuentes } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('is_hot_lead', true);
      
      // Conversas escaladas
      const { count: conversasEscaladas } = await supabase
        .from('conversation_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'escalated')
        .gte('created_at', hours48Ago.toISOString());
      
      // Alertas EXA
      const { count: alertasEXA } = await supabase
        .from('conversation_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'alerted')
        .gte('created_at', hours48Ago.toISOString());
      
      setMetrics({
        clientesIrritados48h: clientesIrritados || 0,
        sindicosIrritados: sindicosIrritados || 0,
        conversasCriticas: conversasCriticas || 0,
        leadsQuentes: leadsQuentes || 0,
        conversasEscaladas: conversasEscaladas || 0,
        alertasEXA: alertasEXA || 0
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="text-center py-8">Carregando métricas...</div>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Clientes Irritados (48h)
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {metrics.clientesIrritados48h}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Últimas 48 horas
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Síndicos Irritados
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {metrics.sindicosIrritados}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Requer atenção especial
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Conversas Críticas
          </CardTitle>
          <MessageSquare className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {metrics.conversasCriticas}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Alta prioridade
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Leads Quentes
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {metrics.leadsQuentes}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Score ≥ 75
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Escaladas (48h)
          </CardTitle>
          <Target className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {metrics.conversasEscaladas}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Para Eduardo
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Alertas EXA (48h)
          </CardTitle>
          <Bell className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {metrics.alertasEXA}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Notificações enviadas
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
