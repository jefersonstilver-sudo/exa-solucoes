import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Briefcase, 
  Phone, 
  User, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Power,
  PowerOff,
  ExternalLink,
  Building2,
  Target,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getWhatsAppLink } from '@/utils/whatsapp';

interface Escalacao {
  id: string;
  conversation_id: string | null;
  phone_number: string;
  lead_name: string | null;
  lead_segment: string | null;
  lead_interest: string | null;
  plans_interested: string[] | null;
  first_message: string | null;
  conversation_summary: string | null;
  ai_analysis: string | null;
  status: 'pendente' | 'em_atendimento' | 'concluido' | 'cancelado';
  assigned_to: string;
  created_at: string;
  attended_at: string | null;
  notes: string | null;
}

interface Vendedor {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
  recebe_escalacoes: boolean;
}

interface Message {
  id: string;
  body: string;
  direction: 'inbound' | 'outbound';
  created_at: string;
  from_role?: string;
}

export default function EscalacoesComerciais() {
  const [escalacoes, setEscalacoes] = useState<Escalacao[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEscalacao, setSelectedEscalacao] = useState<Escalacao | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [escalacoesRes, vendedoresRes] = await Promise.all([
        supabase
          .from('escalacoes_comerciais')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('escalacao_vendedores')
          .select('*')
          .order('nome')
      ]);

      if (escalacoesRes.data) setEscalacoes(escalacoesRes.data as Escalacao[]);
      if (vendedoresRes.data) setVendedores(vendedoresRes.data as Vendedor[]);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationHistory = async (conversationId: string) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, body, direction, created_at, from_role')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setConversationHistory(data as Message[] || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast.error('Erro ao carregar histórico da conversa');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Realtime subscription
    const channel = supabase
      .channel('escalacoes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escalacoes_comerciais' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Buscar histórico quando selecionar uma escalação
  useEffect(() => {
    if (selectedEscalacao?.conversation_id) {
      fetchConversationHistory(selectedEscalacao.conversation_id);
    } else {
      setConversationHistory([]);
    }
  }, [selectedEscalacao?.conversation_id]);

  const toggleVendedorStatus = async (vendedor: Vendedor, field: 'ativo' | 'recebe_escalacoes') => {
    try {
      const { error } = await supabase
        .from('escalacao_vendedores')
        .update({ [field]: !vendedor[field] })
        .eq('id', vendedor.id);

      if (error) throw error;
      
      toast.success(`${vendedor.nome} ${field === 'recebe_escalacoes' ? 'notificações' : 'status'} atualizado`);
      fetchData();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar vendedor');
    }
  };

  const updateEscalacaoStatus = async (id: string, status: string) => {
    try {
      const updateData: any = { status };
      if (status === 'em_atendimento') {
        updateData.attended_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('escalacoes_comerciais')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Status atualizado');
      fetchData();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'em_atendimento': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'concluido': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelado': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'em_atendimento': return 'Em Atendimento';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const stats = {
    total: escalacoes.length,
    pendentes: escalacoes.filter(e => e.status === 'pendente').length,
    emAtendimento: escalacoes.filter(e => e.status === 'em_atendimento').length,
    concluidos: escalacoes.filter(e => e.status === 'concluido').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header simples */}
      <div className="sticky top-0 z-20 glass-card backdrop-blur-xl border-b border-border/50">
        <div className="px-4 lg:px-8 py-4 flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Escalações Comerciais</h1>
          <Badge variant="outline" className="ml-2">Eduardo</Badge>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pendentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Em Atendimento</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.emAtendimento}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Concluídos</p>
                  <p className="text-2xl font-bold text-green-400">{stats.concluidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuração de Vendedores */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendedores.map((vendedor) => (
                <div 
                  key={vendedor.id} 
                  className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        vendedor.ativo ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        <User className={`w-5 h-5 ${vendedor.ativo ? 'text-green-400' : 'text-red-400'}`} />
                      </div>
                      <div>
                        <p className="font-medium">{vendedor.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          +55 {vendedor.telefone.slice(2, 4)} {vendedor.telefone.slice(4, 9)}-{vendedor.telefone.slice(9)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={getWhatsAppLink(vendedor.telefone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-green-400" />
                    </a>
                  </div>

                  <Separator className="bg-border/50" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {vendedor.ativo ? (
                        <Power className="w-4 h-4 text-green-400" />
                      ) : (
                        <PowerOff className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm">Ativo</span>
                    </div>
                    <Switch
                      checked={vendedor.ativo}
                      onCheckedChange={() => toggleVendedorStatus(vendedor, 'ativo')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Receber Escalações</span>
                    </div>
                    <Switch
                      checked={vendedor.recebe_escalacoes}
                      onCheckedChange={() => toggleVendedorStatus(vendedor, 'recebe_escalacoes')}
                    />
                  </div>
                </div>
              ))}

              {vendedores.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum vendedor configurado
                </p>
              )}
            </CardContent>
          </Card>

          {/* Lista de Escalações */}
          <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Escalações Recentes
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {escalacoes.map((escalacao) => (
                    <div
                      key={escalacao.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-accent/50 ${
                        selectedEscalacao?.id === escalacao.id
                          ? 'bg-accent/50 border-primary/50'
                          : 'bg-background/50 border-border/50'
                      }`}
                      onClick={() => setSelectedEscalacao(escalacao)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">
                              {escalacao.lead_name || escalacao.phone_number}
                            </span>
                            <Badge className={getStatusColor(escalacao.status)}>
                              {getStatusLabel(escalacao.status)}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {escalacao.phone_number}
                          </p>

                          {escalacao.lead_segment && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Building2 className="w-3 h-3" />
                              {escalacao.lead_segment}
                            </p>
                          )}

                          {escalacao.first_message && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 bg-background/50 p-2 rounded border border-border/30">
                              "{escalacao.first_message}"
                            </p>
                          )}

                          {escalacao.plans_interested && escalacao.plans_interested.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {escalacao.plans_interested.map((plan, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px]">
                                  {plan}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(escalacao.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                          </p>
                          
                          <div className="flex gap-1 mt-2">
                            {escalacao.status === 'pendente' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateEscalacaoStatus(escalacao.id, 'em_atendimento');
                                }}
                              >
                                Atender
                              </Button>
                            )}
                            {escalacao.status === 'em_atendimento' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-green-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateEscalacaoStatus(escalacao.id, 'concluido');
                                }}
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Concluir
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {escalacoes.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">Nenhuma escalação registrada</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Quando leads pedirem condições especiais, aparecerão aqui
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes da Escalação Selecionada */}
        {selectedEscalacao && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Detalhes da Escalação
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedEscalacao(null)}>
                <XCircle className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Lead</p>
                    <p className="font-medium">{selectedEscalacao.lead_name || 'Não identificado'}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Telefone</p>
                    <a
                      href={getWhatsAppLink(selectedEscalacao.phone_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-green-400 hover:underline flex items-center gap-2"
                    >
                      {selectedEscalacao.phone_number}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Segmento</p>
                    <p className="font-medium">{selectedEscalacao.lead_segment || 'Não informado'}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Interesse</p>
                    <p className="font-medium">{selectedEscalacao.lead_interest || 'Não especificado'}</p>
                  </div>

                  {selectedEscalacao.plans_interested && selectedEscalacao.plans_interested.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Planos de Interesse</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEscalacao.plans_interested.map((plan, idx) => (
                          <Badge key={idx} variant="secondary">{plan}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {selectedEscalacao.first_message && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Primeira Mensagem</p>
                      <p className="text-sm bg-background/50 p-3 rounded-lg border border-border/50">
                        {selectedEscalacao.first_message}
                      </p>
                    </div>
                  )}

                  {selectedEscalacao.conversation_summary && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Resumo da Conversa</p>
                      <p className="text-sm bg-background/50 p-3 rounded-lg border border-border/50 whitespace-pre-wrap">
                        {selectedEscalacao.conversation_summary}
                      </p>
                    </div>
                  )}

                  {selectedEscalacao.ai_analysis && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Análise da Sofia</p>
                      <p className="text-sm bg-blue-500/10 p-3 rounded-lg border border-blue-500/30 whitespace-pre-wrap">
                        {selectedEscalacao.ai_analysis}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Histórico Completo da Conversa */}
              {selectedEscalacao.conversation_id && (
                <div className="mt-6">
                  <Button
                    variant="outline"
                    className="w-full mb-4"
                    onClick={() => setShowFullHistory(!showFullHistory)}
                  >
                    {showFullHistory ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Ocultar Histórico Completo
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Ver Histórico Completo ({conversationHistory.length} mensagens)
                      </>
                    )}
                  </Button>

                  {showFullHistory && (
                    <div className="border border-border/50 rounded-lg p-4 bg-background/30">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                        📋 Histórico Completo da Conversa
                      </p>
                      
                      {loadingHistory ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-3">
                            {conversationHistory.map((msg) => (
                              <div 
                                key={msg.id}
                                className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
                              >
                                <div className={`max-w-[80%] p-3 rounded-lg ${
                                  msg.direction === 'inbound'
                                    ? 'bg-white/10 border border-border/50'
                                    : 'bg-primary/20 border border-primary/30'
                                }`}>
                                  <p className="text-[10px] font-medium mb-1 opacity-70">
                                    {msg.direction === 'inbound' ? '👤 Cliente' : '🤖 Sofia'}
                                  </p>
                                  <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
                                    {format(new Date(msg.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                                  </p>
                                </div>
                              </div>
                            ))}
                            
                            {conversationHistory.length === 0 && (
                              <p className="text-center text-muted-foreground py-4">
                                Nenhuma mensagem encontrada
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
