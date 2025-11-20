/**
 * Dashboard de Análise de Conversas
 * Análise de leads e síndicos vindos do ManyChat
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, MessageSquare, TrendingUp, Users, PhoneCall, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Conversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  status: string;
  first_message_at: string;
  last_message_at: string;
}

interface Analysis {
  conversation_id: string;
  intent: string;
  opportunity: boolean;
  summary: string;
}

interface Stats {
  totalConversations: number;
  totalLeads: number;
  totalSyndics: number;
  activeConversations: number;
  conversionRate: number;
}

export const ConversationsAnalysisDashboard = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalConversations: 0,
    totalLeads: 0,
    totalSyndics: 0,
    activeConversations: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Buscar conversas
      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(50);

      // Buscar análises
      const { data: analysisData } = await supabase
        .from('analyses')
        .select('*')
        .order('analysis_at', { ascending: false });

      setConversations(convData || []);
      setAnalyses(analysisData || []);

      // Calcular estatísticas
      const totalConversations = convData?.length || 0;
      const totalLeads = analysisData?.filter(a => a.intent === 'lead_qualification').length || 0;
      const totalSyndics = analysisData?.filter(a => a.intent === 'sindico_contact').length || 0;
      const activeConversations = convData?.filter(c => c.status === 'active').length || 0;
      const opportunities = analysisData?.filter(a => a.opportunity).length || 0;
      const conversionRate = totalConversations > 0 ? (opportunities / totalConversations) * 100 : 0;

      setStats({
        totalConversations,
        totalLeads,
        totalSyndics,
        activeConversations,
        conversionRate: Math.round(conversionRate)
      });

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncConversations = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('manychat-sync-conversations');
      
      if (error) throw error;
      
      console.log('Sync result:', data);
      await loadData(); // Reload data after sync
      
    } catch (error) {
      console.error('Error syncing conversations:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getIntentBadge = (intent: string) => {
    switch (intent) {
      case 'lead_qualification':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Lead</Badge>;
      case 'sindico_contact':
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Síndico</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Geral</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-module-primary flex items-center gap-3">
              📊 Análise de Conversas - Eduardo
            </h1>
            <p className="text-module-secondary mt-2">
              Número Comercial: +55 45 99141-5856
            </p>
          </div>
          <Button 
            onClick={syncConversations}
            disabled={syncing}
            className="bg-[#9C1E1E] hover:bg-[#7A1616] text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar ManyChat'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-module-card border-module p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-module-tertiary text-sm">Total Conversas</p>
              <p className="text-2xl font-bold text-module-primary">{stats.totalConversations}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-module-card border-module p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-module-tertiary text-sm">Leads</p>
              <p className="text-2xl font-bold text-module-primary">{stats.totalLeads}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-module-card border-module p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-module-tertiary text-sm">Síndicos</p>
              <p className="text-2xl font-bold text-module-primary">{stats.totalSyndics}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-module-card border-module p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-module-tertiary text-sm">Ativas</p>
              <p className="text-2xl font-bold text-module-primary">{stats.activeConversations}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-module-card border-module p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#9C1E1E]/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-[#9C1E1E]" />
            </div>
            <div>
              <p className="text-module-tertiary text-sm">Conversão</p>
              <p className="text-2xl font-bold text-module-primary">{stats.conversionRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Conversations List */}
      <Card className="bg-module-card border-module">
        <div className="p-6 border-b border-module">
          <h2 className="text-xl font-bold text-module-primary">Conversas Recentes</h2>
        </div>
        
        <div className="divide-y divide-module">
          {loading ? (
            <div className="p-8 text-center text-module-secondary">
              Carregando conversas...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-module-secondary">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma conversa encontrada</p>
              <p className="text-sm mt-1">Clique em "Sincronizar ManyChat" para buscar conversas</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const analysis = analyses.find(a => a.conversation_id === conv.id);
              
              return (
                <div key={conv.id} className="p-6 hover:bg-module-hover transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <PhoneCall className="w-5 h-5 text-module-accent" />
                        <h3 className="font-semibold text-module-primary">{conv.contact_name}</h3>
                        {analysis && getIntentBadge(analysis.intent)}
                        {analysis?.opportunity && (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                            Oportunidade
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-module-secondary text-sm mb-1">
                        📱 {conv.contact_phone}
                      </p>
                      
                      {analysis?.summary && (
                        <p className="text-module-tertiary text-sm mt-2">
                          {analysis.summary}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-module-tertiary">
                        <span>Primeira mensagem: {formatDate(conv.first_message_at)}</span>
                        <span>•</span>
                        <span>Última atividade: {formatDate(conv.last_message_at)}</span>
                      </div>
                    </div>
                    
                    <Badge variant={conv.status === 'active' ? 'default' : 'secondary'}>
                      {conv.status}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};