import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar as CalendarIcon, 
  Loader2, 
  Clock, 
  Bell, 
  BellRing, 
  Users, 
  ChevronDown,
  Pencil,
  Trash2,
  AlertTriangle,
  Video,
  MapPin,
  Settings,
  Search,
  X,
  FileText
} from 'lucide-react';
import { useEventTypes } from '@/hooks/agenda/useEventTypes';
import EventTypeManagerModal from './EventTypeManagerModal';
import BuildingSelector from './BuildingSelector';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { AgendaTask } from './TaskCard';

interface EditTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: AgendaTask | null;
}

interface AdminUser {
  id: string;
  email: string;
  nome: string;
  role: string;
  telefone?: string;
}

interface LeadResult {
  id: string;
  nome: string;
  sobrenome: string | null;
  empresa: string | null;
  telefone: string | null;
  email: string | null;
  temperatura: string | null;
}

interface PropostaResult {
  id: string;
  number: string | null;
  status: string | null;
  fidel_monthly_value: number | null;
  client_name: string | null;
  duration_months: number | null;
}

const temperaturaBadge = (temp: string | null) => {
  const colors: Record<string, string> = {
    quente: 'bg-red-100 text-red-700',
    morno: 'bg-yellow-100 text-yellow-700',
    frio: 'bg-blue-100 text-blue-700',
  };
  if (!temp) return null;
  return (
    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', colors[temp] || 'bg-muted text-muted-foreground')}>
      {temp}
    </span>
  );
};

const statusBadge = (status: string | null) => {
  const colors: Record<string, string> = {
    rascunho: 'bg-gray-100 text-gray-700',
    enviada: 'bg-blue-100 text-blue-700',
    aprovada: 'bg-green-100 text-green-700',
    rejeitada: 'bg-red-100 text-red-700',
    negociacao: 'bg-yellow-100 text-yellow-700',
  };
  if (!status) return null;
  return (
    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', colors[status] || 'bg-muted text-muted-foreground')}>
      {status}
    </span>
  );
};

const formatCurrency = (value: number | null) => {
  if (value == null) return 'N/A';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const EditTaskModal = ({ open, onOpenChange, task }: EditTaskModalProps) => {
  const queryClient = useQueryClient();
  const [titulo, setTitulo] = useState('');
  const [dataPrevista, setDataPrevista] = useState<Date | undefined>();
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioLimite, setHorarioLimite] = useState('');
  const [prioridade, setPrioridade] = useState<string>('media');
  const [status, setStatus] = useState<string>('pendente');
  const [descricao, setDescricao] = useState('');
  const [tipoEvento, setTipoEvento] = useState<string>('tarefa');
  const [subtipoReuniao, setSubtipoReuniao] = useState<string>('');
  const [localEvento, setLocalEvento] = useState('');
  const [linkReuniao, setLinkReuniao] = useState('');
  const [escopo, setEscopo] = useState<string>('individual');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventTypeManagerOpen, setEventTypeManagerOpen] = useState(false);
  const { activeEventTypes } = useEventTypes();

  // Building state
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  // Lead state
  const [searchLead, setSearchLead] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadResult | null>(null);
  const [leadResults, setLeadResults] = useState<LeadResult[]>([]);
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const leadDropdownRef = useRef<HTMLDivElement>(null);

  // Propostas state
  const [leadPropostas, setLeadPropostas] = useState<PropostaResult[]>([]);
  const [selectedPropostas, setSelectedPropostas] = useState<string[]>([]);
  const [loadingPropostas, setLoadingPropostas] = useState(false);

  useEffect(() => {
    if (task) {
      setTitulo(task.titulo || '');
      setDataPrevista(task.data_prevista ? parseISO(task.data_prevista) : undefined);
      setHorarioInicio(task.horario_inicio || '');
      setHorarioLimite(task.horario_limite || '');
      setPrioridade(task.prioridade || 'media');
      setStatus(task.status || 'pendente');
      setDescricao(task.descricao || '');
      setTipoEvento(task.tipo_evento || 'tarefa');
      setSubtipoReuniao(task.subtipo_reuniao || '');
      setLocalEvento(task.local_evento || '');
      setLinkReuniao(task.link_reuniao || '');
      setEscopo(task.escopo || 'individual');
      setSelectedBuildingId((task as any).building_id || null);

      // Load lead if task has cliente_id
      if ((task as any).cliente_id) {
        supabase
          .from('contacts')
          .select('id, nome, sobrenome, empresa, telefone, email, temperatura')
          .eq('id', (task as any).cliente_id)
          .single()
          .then(({ data }) => {
            if (data) setSelectedLead(data as LeadResult);
          });
      } else {
        setSelectedLead(null);
      }

      // Load linked propostas
      if (task.id) {
        supabase
          .from('task_propostas')
          .select('proposta_id')
          .eq('task_id', task.id)
          .then(({ data }) => {
            if (data) setSelectedPropostas(data.map(d => d.proposta_id));
          });
      }
    }
  }, [task]);

  // Debounce lead search — busca em contacts + proposals.client_name
  useEffect(() => {
    if (searchLead.length < 2) {
      setLeadResults([]);
      setShowLeadDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      const termo = `%${searchLead}%`;

      const [contactsRes, proposalsRes] = await Promise.all([
        supabase
          .from('contacts')
          .select('id, nome, sobrenome, empresa, telefone, email, temperatura')
          .or(`nome.ilike.${termo},sobrenome.ilike.${termo},empresa.ilike.${termo},telefone.ilike.${termo},email.ilike.${termo}`)
          .limit(8),
        supabase
          .from('proposals')
          .select('id, client_name, client_phone')
          .ilike('client_name', termo)
          .limit(8),
      ]);

      const results: LeadResult[] = [];

      if (!contactsRes.error && contactsRes.data) {
        for (const c of contactsRes.data) {
          results.push(c as LeadResult);
        }
      }

      if (!proposalsRes.error && proposalsRes.data) {
        const seenNames = new Set(results.map(r => `${r.nome} ${r.sobrenome || ''}`.trim().toLowerCase()));
        for (const p of proposalsRes.data) {
          const name = (p.client_name || '').trim();
          if (!name || seenNames.has(name.toLowerCase())) continue;
          seenNames.add(name.toLowerCase());
          const parts = name.split(' ');
          results.push({
            id: `proposal-${p.id}`,
            nome: parts[0] || name,
            sobrenome: parts.slice(1).join(' ') || null,
            empresa: null,
            telefone: p.client_phone || null,
            email: null,
            temperatura: null,
          });
        }
      }

      setLeadResults(results);
      setShowLeadDropdown(results.length > 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchLead]);

  // Fetch propostas when lead changes
  useEffect(() => {
    if (!selectedLead) {
      setLeadPropostas([]);
      return;
    }
    const fetchPropostas = async () => {
      setLoadingPropostas(true);
      const filters: string[] = [];
      if (selectedLead.telefone) filters.push(`client_phone.eq.${selectedLead.telefone}`);
      if (selectedLead.nome) filters.push(`client_name.ilike.%${selectedLead.nome}%`);
      if (filters.length === 0) { setLeadPropostas([]); setLoadingPropostas(false); return; }
      const { data, error } = await supabase
        .from('proposals')
        .select('id, number, status, fidel_monthly_value, client_name, duration_months')
        .or(filters.join(','))
        .order('created_at', { ascending: false });
      if (!error && data) setLeadPropostas(data as PropostaResult[]);
      setLoadingPropostas(false);
    };
    fetchPropostas();
  }, [selectedLead]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (leadDropdownRef.current && !leadDropdownRef.current.contains(e.target as Node)) {
        setShowLeadDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLead = (lead: LeadResult) => {
    setSelectedLead(lead);
    setSearchLead('');
    setShowLeadDropdown(false);
    setLeadResults([]);
  };

  const handleRemoveLead = () => {
    setSelectedLead(null);
    setSelectedPropostas([]);
    setLeadPropostas([]);
    setSearchLead('');
  };

  const toggleProposta = (propostaId: string) => {
    setSelectedPropostas(prev =>
      prev.includes(propostaId) ? prev.filter(id => id !== propostaId) : [...prev, propostaId]
    );
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!task) return;
      const { error } = await supabase
        .from('tasks')
        .update({
          titulo,
          data_prevista: dataPrevista ? format(dataPrevista, 'yyyy-MM-dd') : null,
          horario_inicio: horarioInicio || null,
          horario_limite: horarioLimite || null,
          prioridade: prioridade as any,
          status: status as any,
          descricao: descricao || null,
          tipo_evento: tipoEvento,
          subtipo_reuniao: subtipoReuniao || null,
          local_evento: localEvento || null,
          link_reuniao: linkReuniao || null,
          escopo,
          cliente_id: selectedLead?.id || null,
          building_id: selectedBuildingId || null,
        })
        .eq('id', task.id);
      
      if (error) throw error;

      // Sync propostas: delete old, insert new
      await supabase.from('task_propostas').delete().eq('task_id', task.id);
      if (selectedPropostas.length > 0) {
        await supabase.from('task_propostas').insert(
          selectedPropostas.map(pid => ({ task_id: task.id, proposta_id: pid }))
        );
      }
    },
    onSuccess: () => {
      toast.success('Tarefa atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['agenda-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['minha-manha-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['central-tarefas'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar tarefa: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!task) return;
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tarefa excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['agenda-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['minha-manha-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['central-tarefas'] });
      setDeleteDialogOpen(false);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir tarefa: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    updateMutation.mutate();
  };

  if (!task) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50">
                <Pencil className="h-4 w-4 text-blue-600" />
              </div>
              Editar Evento
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Tipo de Evento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tipo de Evento</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setEventTypeManagerOpen(true)}
                  title="Gerenciar tipos de evento"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <Select value={tipoEvento} onValueChange={setTipoEvento}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activeEventTypes.map((et) => (
                    <SelectItem key={et.name} value={et.name}>
                      {et.icon} {et.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <EventTypeManagerModal open={eventTypeManagerOpen} onOpenChange={setEventTypeManagerOpen} />

            {/* Subtipo Reunião */}
            {tipoEvento === 'reuniao' && (
              <div className="space-y-2">
                <Label>Tipo de Reunião</Label>
                <Select value={subtipoReuniao} onValueChange={setSubtipoReuniao}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">🎯 Com Lead</SelectItem>
                    <SelectItem value="interna">🏢 Interna</SelectItem>
                    <SelectItem value="externa">🌐 Externa</SelectItem>
                    <SelectItem value="fornecedor">🤝 Fornecedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Lead / Contato */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-primary" />
                Lead / Contato
              </Label>
              {selectedLead ? (
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedLead.nome} {selectedLead.sobrenome || ''}
                    </p>
                    {selectedLead.empresa && (
                      <p className="text-xs text-muted-foreground truncate">{selectedLead.empresa}</p>
                    )}
                  </div>
                  {temperaturaBadge(selectedLead.temperatura)}
                  <button type="button" onClick={handleRemoveLead} className="p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative" ref={leadDropdownRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={searchLead} onChange={(e) => setSearchLead(e.target.value)} placeholder="Buscar por nome, empresa, telefone ou email..." className="h-10 pl-9" />
                  </div>
                  {showLeadDropdown && leadResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                      {leadResults.map((lead) => (
                        <div key={lead.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-accent cursor-pointer transition-colors" onClick={() => handleSelectLead(lead)}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{lead.nome} {lead.sobrenome || ''}</p>
                            <p className="text-xs text-muted-foreground truncate">{[lead.empresa, lead.telefone].filter(Boolean).join(' • ')}</p>
                          </div>
                          {temperaturaBadge(lead.temperatura)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Propostas Vinculadas */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Propostas Vinculadas
              </Label>
              {!selectedLead ? (
                <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">Selecione um lead para ver propostas vinculadas</p>
              ) : loadingPropostas ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando propostas...
                </div>
              ) : leadPropostas.length === 0 ? (
                <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">Nenhuma proposta encontrada para este lead</p>
              ) : (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {leadPropostas.map((prop) => (
                    <div key={prop.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => toggleProposta(prop.id)}>
                      <Checkbox checked={selectedPropostas.includes(prop.id)} onCheckedChange={() => toggleProposta(prop.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{prop.number || 'Sem número'}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(prop.fidel_monthly_value)}/mês{prop.duration_months ? ` • ${prop.duration_months} meses` : ''}</p>
                      </div>
                      {statusBadge(prop.status)}
                    </div>
                  ))}
                </div>
              )}
              {selectedPropostas.length > 0 && (
                <p className="text-xs text-primary font-medium">{selectedPropostas.length} proposta{selectedPropostas.length > 1 ? 's' : ''} selecionada{selectedPropostas.length > 1 ? 's' : ''}</p>
              )}
            </div>

            {/* Prédio / Local */}
            <BuildingSelector selectedBuildingId={selectedBuildingId} onSelectBuilding={setSelectedBuildingId} />

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Digite o título..." className="h-10" />
            </div>

            {/* Data e Horários */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !dataPrevista && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataPrevista ? format(dataPrevista, "dd/MM", { locale: ptBR }) : "Data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dataPrevista} onSelect={setDataPrevista} initialFocus locale={ptBR} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Início</Label>
                <Input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>Até</Label>
                <Input type="time" value={horarioLimite} onChange={(e) => setHorarioLimite(e.target.value)} className="h-10" />
              </div>
            </div>

            {/* Link reunião / Local */}
            {tipoEvento === 'reuniao' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Video className="h-3.5 w-3.5" /> Link da Reunião</Label>
                <Input value={linkReuniao} onChange={(e) => setLinkReuniao(e.target.value)} placeholder="https://meet.google.com/..." className="h-10" />
              </div>
            )}
            {tipoEvento === 'compromisso' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Local</Label>
                <Input value={localEvento} onChange={(e) => setLocalEvento(e.target.value)} placeholder="Endereço ou local..." className="h-10" />
              </div>
            )}

            {/* Prioridade e Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={prioridade} onValueChange={setPrioridade}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergencia">🔴 Emergência</SelectItem>
                    <SelectItem value="alta">🟠 Alta</SelectItem>
                    <SelectItem value="media">🟡 Média</SelectItem>
                    <SelectItem value="baixa">🟢 Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">⏳ Pendente</SelectItem>
                    <SelectItem value="em_andamento">🔄 Em andamento</SelectItem>
                    <SelectItem value="concluida">✅ Concluída</SelectItem>
                    <SelectItem value="nao_realizada">❌ Não realizada</SelectItem>
                    <SelectItem value="cancelada">🚫 Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Escopo */}
            {tipoEvento === 'aviso' && (
              <div className="space-y-2">
                <Label>Escopo</Label>
                <Select value={escopo} onValueChange={setEscopo}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">👤 Individual</SelectItem>
                    <SelectItem value="departamento">🏢 Meu Departamento</SelectItem>
                    <SelectItem value="global">📢 Todos (Global)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição opcional..." rows={3} />
            </div>

            {/* Botões */}
            <div className="flex justify-between gap-3 pt-4">
              <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)} className="gap-1">
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Pencil className="h-4 w-4 mr-2" />}
                  Salvar
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{task?.titulo}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-red-600 hover:bg-red-700" disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditTaskModal;
