import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Phone, 
  User, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  RefreshCw,
  ExternalLink,
  Plus,
  Send,
  Bell,
  BellOff,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  viewed_at: string | null;
  responded_at: string | null;
  response_type: 'button' | 'text' | null;
  responded_by_name?: string | null;
}

interface Vendedor {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
  recebe_escalacoes: boolean;
}

export default function EscalacoesComerciais() {
  const [escalacoes, setEscalacoes] = useState<Escalacao[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEscalacao, setSelectedEscalacao] = useState<Escalacao | null>(null);
  
  // Estado para adicionar vendedor
  const [showAddVendedor, setShowAddVendedor] = useState(false);
  const [newVendedor, setNewVendedor] = useState({ nome: '', telefone: '' });
  const [addingVendedor, setAddingVendedor] = useState(false);

  // Estado para envio manual
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendingEscalacao, setSendingEscalacao] = useState<Escalacao | null>(null);
  const [selectedVendedores, setSelectedVendedores] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

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

  // Marcar escalações como visualizadas ao abrir a página
  const markAsViewed = async () => {
    try {
      const pendingIds = escalacoes
        .filter(e => e.status === 'pendente' && !e.viewed_at)
        .map(e => e.id);
      
      if (pendingIds.length === 0) return;

      await supabase
        .from('escalacoes_comerciais')
        .update({ viewed_at: new Date().toISOString() })
        .in('id', pendingIds);
    } catch (error) {
      console.error('Erro ao marcar como visto:', error);
    }
  };

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('escalacoes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escalacoes_comerciais' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (escalacoes.length > 0 && !loading) {
      markAsViewed();
    }
  }, [escalacoes, loading]);

  const toggleNotifications = async (vendedor: Vendedor) => {
    try {
      const { error } = await supabase
        .from('escalacao_vendedores')
        .update({ recebe_escalacoes: !vendedor.recebe_escalacoes })
        .eq('id', vendedor.id);

      if (error) throw error;
      
      toast.success(`${vendedor.nome}: notificações ${!vendedor.recebe_escalacoes ? 'ativadas' : 'desativadas'}`);
      fetchData();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar vendedor');
    }
  };

  const addVendedor = async () => {
    if (!newVendedor.nome.trim() || !newVendedor.telefone.trim()) {
      toast.error('Preencha nome e telefone');
      return;
    }
    
    setAddingVendedor(true);
    try {
      const telefoneClean = newVendedor.telefone.replace(/\D/g, '');
      const telefoneFormatted = telefoneClean.startsWith('55') 
        ? telefoneClean 
        : `55${telefoneClean}`;
      
      const { error } = await supabase
        .from('escalacao_vendedores')
        .insert({
          nome: newVendedor.nome.trim(),
          telefone: telefoneFormatted,
          ativo: true,
          recebe_escalacoes: true
        });

      if (error) throw error;
      
      toast.success(`${newVendedor.nome} adicionado!`);
      setNewVendedor({ nome: '', telefone: '' });
      setShowAddVendedor(false);
      fetchData();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao adicionar vendedor');
    } finally {
      setAddingVendedor(false);
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

  const openSendDialog = (escalacao: Escalacao) => {
    setSendingEscalacao(escalacao);
    const activeVendedorIds = vendedores
      .filter(v => v.ativo && v.recebe_escalacoes)
      .map(v => v.id);
    setSelectedVendedores(activeVendedorIds);
    setShowSendDialog(true);
  };

  const sendManualEscalation = async () => {
    if (!sendingEscalacao || selectedVendedores.length === 0) {
      toast.error('Selecione ao menos um vendedor');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('resend-escalation', {
        body: {
          escalacaoId: sendingEscalacao.id,
          vendedorIds: selectedVendedores
        }
      });

      if (error) {
        toast.error('Erro ao enviar escalação');
        return;
      }

      if (data?.success) {
        toast.success(`Enviado para ${data.sent} vendedor(es)!`);
      } else {
        toast.error(data?.error || 'Falha ao enviar');
      }

      setShowSendDialog(false);
      setSendingEscalacao(null);
      setSelectedVendedores([]);
    } catch (error) {
      console.error('Erro ao enviar:', error);
      toast.error('Erro ao enviar escalação');
    } finally {
      setIsSending(false);
    }
  };

  const formatPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length >= 12) {
      return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
    }
    return phone;
  };

  const stats = {
    total: escalacoes.length,
    pendentes: escalacoes.filter(e => e.status === 'pendente').length,
    emAtendimento: escalacoes.filter(e => e.status === 'em_atendimento').length,
    concluidos: escalacoes.filter(e => e.status === 'concluido').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Apple-like */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Escalações</h1>
              <p className="text-xs text-muted-foreground">Leads especiais</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchData}
            disabled={loading}
            className="rounded-full h-9 w-9"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
        {/* KPIs compactos */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-foreground' },
            { label: 'Pendentes', value: stats.pendentes, color: 'text-yellow-500' },
            { label: 'Atendendo', value: stats.emAtendimento, color: 'text-blue-500' },
            { label: 'Concluídos', value: stats.concluidos, color: 'text-green-500' },
          ].map((stat) => (
            <div 
              key={stat.label}
              className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/40"
            >
              <p className="text-2xl font-bold tabular-nums text-center">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Vendedores - Design Apple minimalista */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 overflow-hidden">
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">Vendedores</span>
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setShowAddVendedor(true)}
                className="rounded-full h-8 px-3 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Adicionar
              </Button>
            </div>
            
            <div className="divide-y divide-border/40">
              {vendedores.map((vendedor) => (
                <div 
                  key={vendedor.id} 
                  className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      vendedor.recebe_escalacoes 
                        ? 'bg-green-500/10 text-green-600' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{vendedor.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPhone(vendedor.telefone)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <a
                      href={getWhatsAppLink(vendedor.telefone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-green-500/10 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-green-600" />
                    </a>
                    <Switch
                      checked={vendedor.recebe_escalacoes}
                      onCheckedChange={() => toggleNotifications(vendedor)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </div>
              ))}
              
              {vendedores.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Nenhum vendedor cadastrado
                </div>
              )}
            </div>
          </div>

          {/* Lista de Escalações - Apple style */}
          <div className="lg:col-span-2 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 overflow-hidden">
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">Escalações Recentes</span>
              </div>
              <Badge variant="secondary" className="rounded-full text-xs">
                {stats.pendentes} pendentes
              </Badge>
            </div>
            
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-border/40">
                {escalacoes.map((escalacao) => (
                  <div 
                    key={escalacao.id}
                    className="p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {escalacao.lead_name || 'Lead não identificado'}
                          </span>
                          <Badge 
                            variant="outline"
                            className={`rounded-full text-[10px] px-2 py-0 ${
                              escalacao.status === 'pendente' 
                                ? 'border-yellow-500/50 text-yellow-600 bg-yellow-500/10'
                                : escalacao.status === 'concluido'
                                ? 'border-green-500/50 text-green-600 bg-green-500/10'
                                : 'border-blue-500/50 text-blue-600 bg-blue-500/10'
                            }`}
                          >
                            {escalacao.status === 'pendente' ? 'Pendente' : 
                             escalacao.status === 'concluido' ? 'Concluído' : 'Atendendo'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {formatPhone(escalacao.phone_number)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(escalacao.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>

                        {escalacao.lead_segment && (
                          <Badge variant="secondary" className="rounded-full text-[10px] mr-2">
                            {escalacao.lead_segment}
                          </Badge>
                        )}
                        
                        {escalacao.response_type && escalacao.status === 'concluido' && (
                          <span className="text-[10px] text-green-600">
                            ✓ {escalacao.responded_by_name || 'Atendido'} 
                            {escalacao.response_type === 'button' ? ' (botão)' : ' (texto)'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <a
                          href={getWhatsAppLink(escalacao.phone_number)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-green-500/10 hover:bg-green-500/20 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-green-600" />
                        </a>
                        
                        {escalacao.status === 'pendente' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openSendDialog(escalacao)}
                              className="rounded-full h-8 px-3 text-xs"
                            >
                              <Send className="w-3.5 h-3.5 mr-1" />
                              Enviar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateEscalacaoStatus(escalacao.id, 'concluido')}
                              className="rounded-full h-8 px-3 text-xs bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Concluir
                            </Button>
                          </>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedEscalacao(escalacao)}
                          className="rounded-full h-8 w-8"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {escalacoes.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground text-sm">
                    Nenhuma escalação encontrada
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Dialog Adicionar Vendedor */}
      <Dialog open={showAddVendedor} onOpenChange={setShowAddVendedor}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Vendedor</DialogTitle>
            <DialogDescription>
              Cadastre um novo vendedor para receber escalações
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                placeholder="Nome do vendedor"
                value={newVendedor.nome}
                onChange={(e) => setNewVendedor(prev => ({ ...prev, nome: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">WhatsApp</label>
              <Input
                placeholder="45999999999"
                value={newVendedor.telefone}
                onChange={(e) => setNewVendedor(prev => ({ ...prev, telefone: e.target.value }))}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">DDD + número, sem espaços</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setShowAddVendedor(false)}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button 
              onClick={addVendedor} 
              disabled={addingVendedor}
              className="rounded-full"
            >
              {addingVendedor ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Enviar Escalação */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Escalação</DialogTitle>
            <DialogDescription>
              Selecione os vendedores que receberão esta escalação
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-3">
            {vendedores.filter(v => v.ativo).map((vendedor) => (
              <label 
                key={vendedor.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={selectedVendedores.includes(vendedor.id)}
                  onCheckedChange={() => {
                    setSelectedVendedores(prev => 
                      prev.includes(vendedor.id)
                        ? prev.filter(id => id !== vendedor.id)
                        : [...prev, vendedor.id]
                    );
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{vendedor.nome}</p>
                  <p className="text-xs text-muted-foreground">{formatPhone(vendedor.telefone)}</p>
                </div>
                {vendedor.recebe_escalacoes && (
                  <Bell className="w-3.5 h-3.5 text-green-500" />
                )}
              </label>
            ))}
          </div>
          
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setShowSendDialog(false)}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button 
              onClick={sendManualEscalation}
              disabled={isSending || selectedVendedores.length === 0}
              className="rounded-full"
            >
              {isSending ? 'Enviando...' : `Enviar (${selectedVendedores.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes da Escalação */}
      <Dialog open={!!selectedEscalacao} onOpenChange={() => setSelectedEscalacao(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedEscalacao?.lead_name || 'Lead não identificado'}
            </DialogTitle>
            <DialogDescription>
              Criado em {selectedEscalacao && format(new Date(selectedEscalacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEscalacao && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{formatPhone(selectedEscalacao.phone_number)}</span>
                <a
                  href={getWhatsAppLink(selectedEscalacao.phone_number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto"
                >
                  <Button size="sm" variant="outline" className="rounded-full h-8">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    WhatsApp
                  </Button>
                </a>
              </div>

              {selectedEscalacao.lead_segment && (
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Segmento</p>
                  <p className="font-medium">{selectedEscalacao.lead_segment}</p>
                </div>
              )}

              {selectedEscalacao.first_message && (
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Primeira Mensagem</p>
                  <p className="text-sm">{selectedEscalacao.first_message}</p>
                </div>
              )}

              {selectedEscalacao.conversation_summary && (
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Resumo da Conversa</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedEscalacao.conversation_summary}</p>
                </div>
              )}

              {selectedEscalacao.response_type && (
                <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                  <p className="text-xs text-green-600 mb-1">Resposta</p>
                  <p className="font-medium text-green-700">
                    {selectedEscalacao.responded_by_name || 'Vendedor'} respondeu via {selectedEscalacao.response_type === 'button' ? 'botão' : 'texto'}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setSelectedEscalacao(null)}
              className="rounded-full"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
