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
  FileText,
  Send,
  Check,
  RefreshCw
} from 'lucide-react';
import { useEventTypes } from '@/hooks/agenda/useEventTypes';
import EventTypeManagerModal from './EventTypeManagerModal';
import BuildingSelector from './BuildingSelector';
import ManageAlertContactsModal from './ManageAlertContactsModal';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
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

interface ReadReceipt {
  id: string;
  task_id: string;
  contact_phone: string;
  contact_name: string | null;
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
  status: string;
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

const priorityConfig: Record<string, { label: string; color: string }> = {
  emergencia: { label: 'Emergência', color: 'bg-red-100 text-red-700 border-red-200' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  media: { label: 'Média', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  baixa: { label: 'Baixa', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  em_andamento: { label: 'Em andamento', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  concluida: { label: 'Concluída', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  nao_realizada: { label: 'Não realizada', color: 'bg-red-100 text-red-700 border-red-200' },
  cancelada: { label: 'Cancelada', color: 'bg-slate-100 text-slate-700 border-slate-200' },
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
  const [alertContactsOpen, setAlertContactsOpen] = useState(false);
  const [notifyOnSave, setNotifyOnSave] = useState(false);
  const [autoFollowup, setAutoFollowup] = useState(true);
  const [sendingReminder, setSendingReminder] = useState(false);
  const { activeEventTypes, getEventTypeConfig } = useEventTypes();
  const { userProfile } = useAuth();

  // Notification contacts selection
  const [selectedNotifyContacts, setSelectedNotifyContacts] = useState<string[]>([]);

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

  // Fetch admin users
  const { data: adminUsers = [] } = useQuery({
    queryKey: ['admin-users-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, nome, role, telefone')
        .in('role', ['super_admin', 'admin', 'admin_departamental', 'ceo', 'coordenacao'])
        .order('nome');
      if (error) throw error;
      return (data || []) as AdminUser[];
    }
  });

  // Fetch buildings for notification
  const { data: allBuildings = [] } = useQuery({
    queryKey: ['all-buildings-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, nome')
        .order('nome');
      if (error) throw error;
      return data || [];
    },
  });

  // Track previously known read IDs for animation
  const previousReadIdsRef = useRef<Set<string>>(new Set());
  const [newlyConfirmedIds, setNewlyConfirmedIds] = useState<Set<string>>(new Set());

  // Fetch read receipts for this task (auto-refresh every 5s)
  const { data: receipts = [], refetch: refetchReceipts } = useQuery({
    queryKey: ['task-read-receipts', task?.id],
    queryFn: async () => {
      if (!task?.id) return [];
      const { data, error } = await supabase
        .from('task_read_receipts')
        .select('*')
        .eq('task_id', task.id)
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ReadReceipt[];
    },
    enabled: !!task?.id && open,
    refetchInterval: open ? 5000 : false,
  });

  // Detect newly confirmed receipts for animation
  useEffect(() => {
    const currentReadIds = new Set(receipts.filter(r => r.status === 'read').map(r => r.id));
    const newIds = new Set<string>();
    currentReadIds.forEach(id => {
      if (!previousReadIdsRef.current.has(id)) {
        newIds.add(id);
      }
    });
    if (newIds.size > 0) {
      setNewlyConfirmedIds(newIds);
      const timer = setTimeout(() => setNewlyConfirmedIds(new Set()), 2500);
      previousReadIdsRef.current = currentReadIds;
      return () => clearTimeout(timer);
    }
    previousReadIdsRef.current = currentReadIds;
  }, [receipts]);

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
      setNotifyOnSave(false);
      setAutoFollowup((task as any).auto_followup !== false);

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

  // Debounce lead search
  useEffect(() => {
    if (searchLead.length < 2) {
      setLeadResults([]);
      setShowLeadDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      const termo = `%${searchLead}%`;
      const [contactsRes, proposalsRes] = await Promise.all([
        supabase.from('contacts').select('id, nome, sobrenome, empresa, telefone, email, temperatura').or(`nome.ilike.${termo},sobrenome.ilike.${termo},empresa.ilike.${termo},telefone.ilike.${termo},email.ilike.${termo}`).limit(8),
        supabase.from('proposals').select('id, client_name, client_phone').ilike('client_name', termo).limit(8),
      ]);
      const results: LeadResult[] = [];
      if (!contactsRes.error && contactsRes.data) {
        for (const c of contactsRes.data) results.push(c as LeadResult);
      }
      if (!proposalsRes.error && proposalsRes.data) {
        const seenNames = new Set(results.map(r => `${r.nome} ${r.sobrenome || ''}`.trim().toLowerCase()));
        for (const p of proposalsRes.data) {
          const name = (p.client_name || '').trim();
          if (!name || seenNames.has(name.toLowerCase())) continue;
          seenNames.add(name.toLowerCase());
          const parts = name.split(' ');
          results.push({ id: `proposal-${p.id}`, nome: parts[0] || name, sobrenome: parts.slice(1).join(' ') || null, empresa: null, telefone: p.client_phone || null, email: null, temperatura: null });
        }
      }
      setLeadResults(results);
      setShowLeadDropdown(results.length > 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchLead]);

  // Fetch propostas when lead changes
  useEffect(() => {
    if (!selectedLead) { setLeadPropostas([]); return; }
    const fetchPropostas = async () => {
      setLoadingPropostas(true);
      const filters: string[] = [];
      if (selectedLead.telefone) filters.push(`client_phone.eq.${selectedLead.telefone}`);
      if (selectedLead.nome) filters.push(`client_name.ilike.%${selectedLead.nome}%`);
      if (filters.length === 0) { setLeadPropostas([]); setLoadingPropostas(false); return; }
      const { data, error } = await supabase.from('proposals').select('id, number, status, fidel_monthly_value, client_name, duration_months').or(filters.join(',')).order('created_at', { ascending: false });
      if (!error && data) setLeadPropostas(data as PropostaResult[]);
      setLoadingPropostas(false);
    };
    fetchPropostas();
  }, [selectedLead]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (leadDropdownRef.current && !leadDropdownRef.current.contains(e.target as Node)) setShowLeadDropdown(false);
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
          notify_on_save: notifyOnSave,
          auto_followup: autoFollowup,
        })
        .eq('id', task.id);
      if (error) throw error;

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

      if (notifyOnSave && task) {
        const selectedPhones = adminUsers
          .filter(u => selectedNotifyContacts.includes(u.id) && u.telefone)
          .map(u => ({ nome: u.nome || u.email, telefone: u.telefone }));

        supabase.functions.invoke('task-notify-created', {
          body: {
            task_id: task.id,
            titulo,
            data: dataPrevista ? format(dataPrevista, 'dd/MM/yyyy', { locale: ptBR }) : null,
            horario: horarioInicio || horarioLimite || null,
            criador_nome: userProfile?.nome || userProfile?.email || 'Sistema',
            specific_contacts: selectedPhones.length > 0 ? selectedPhones : undefined,
            tipo_evento: tipoEvento || 'tarefa',
            descricao: descricao || null,
            local_evento: localEvento || null,
            building_name: selectedBuildingId
              ? allBuildings.find(b => b.id === selectedBuildingId)?.nome || null
              : null,
            subtipo_reuniao: subtipoReuniao || null,
          }
        }).catch(err => console.error('Erro ao notificar:', err));
      }

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

  const handleSendReminder = async () => {
    if (!task) return;
    setSendingReminder(true);
    try {
      const selectedPhones = adminUsers
        .filter(u => selectedNotifyContacts.includes(u.id) && u.telefone)
        .map(u => ({ nome: u.nome || u.email, telefone: u.telefone }));

      await supabase.functions.invoke('task-notify-created', {
        body: {
          task_id: task.id,
          titulo,
          data: dataPrevista ? format(dataPrevista, 'dd/MM/yyyy', { locale: ptBR }) : null,
          horario: horarioInicio || horarioLimite || null,
          criador_nome: userProfile?.nome || userProfile?.email || 'Sistema',
          specific_contacts: selectedPhones.length > 0 ? selectedPhones : undefined,
          tipo_evento: tipoEvento || 'tarefa',
          descricao: descricao || null,
          local_evento: localEvento || null,
          building_name: selectedBuildingId
            ? allBuildings.find(b => b.id === selectedBuildingId)?.nome || null
            : null,
          subtipo_reuniao: subtipoReuniao || null,
        }
      });
      toast.success('Lembrete enviado com sucesso!');
      refetchReceipts();
    } catch (err) {
      console.error('Erro ao enviar lembrete:', err);
      toast.error('Erro ao enviar lembrete');
    } finally {
      setSendingReminder(false);
    }
  };

  if (!task) return null;

  const eventConfig = getEventTypeConfig(tipoEvento);
  const confirmedCount = receipts.filter(r => r.status === 'read').length;
  const totalReceipts = receipts.length;

  const getReceiptStatusIcon = (receiptStatus: string) => {
    switch (receiptStatus) {
      case 'read': return <Check className="h-3.5 w-3.5 text-emerald-500" />;
      case 'delivered': return <Check className="h-3.5 w-3.5 text-blue-500" />;
      default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getReceiptStatusLabel = (receipt: ReadReceipt) => {
    if (receipt.status === 'read' && receipt.read_at) {
      return `Confirmou às ${format(new Date(receipt.read_at), "HH:mm 'de' dd/MM", { locale: ptBR })}`;
    }
    if (receipt.status === 'delivered') return 'Entregue';
    return 'Enviado';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[92vh] overflow-hidden p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Editar Evento</DialogTitle>
          </DialogHeader>

          {/* ── Visual Header ── */}
          <div className="relative px-6 pt-5 pb-4 border-b bg-muted/30">
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0 mt-0.5">
                {eventConfig.icon}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Editar {eventConfig.label}
                </p>
                <h2 className="text-lg font-bold text-foreground leading-tight truncate">
                  {titulo || 'Sem título'}
                </h2>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold border', statusConfig[status]?.color || 'bg-muted text-muted-foreground')}>
                    {statusConfig[status]?.label || status}
                  </span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold border', priorityConfig[prioridade]?.color || 'bg-muted text-muted-foreground')}>
                    {priorityConfig[prioridade]?.label || prioridade}
                  </span>
                  {dataPrevista && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                      📅 {format(dataPrevista, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                  {horarioInicio && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                      🕐 {horarioInicio}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Two-column body ── */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto max-h-[calc(92vh-180px)]">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] divide-y md:divide-y-0 md:divide-x">
              
              {/* ── LEFT: Form Fields ── */}
              <div className="p-5 space-y-4 overflow-y-auto">
                {/* Tipo de Evento */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo de Evento</Label>
                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => setEventTypeManagerOpen(true)}>
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Select value={tipoEvento} onValueChange={setTipoEvento}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {activeEventTypes.map((et) => (
                        <SelectItem key={et.name} value={et.name}>{et.icon} {et.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <EventTypeManagerModal open={eventTypeManagerOpen} onOpenChange={setEventTypeManagerOpen} />

                {/* Subtipo Reunião */}
                {tipoEvento === 'reuniao' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo de Reunião</Label>
                    <Select value={subtipoReuniao} onValueChange={setSubtipoReuniao}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
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
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <Search className="h-3 w-3" /> Lead / Contato
                  </Label>
                  {selectedLead ? (
                    <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedLead.nome} {selectedLead.sobrenome || ''}</p>
                        {selectedLead.empresa && <p className="text-xs text-muted-foreground truncate">{selectedLead.empresa}</p>}
                      </div>
                      {temperaturaBadge(selectedLead.temperatura)}
                      <button type="button" onClick={handleRemoveLead} className="p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative" ref={leadDropdownRef}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input value={searchLead} onChange={(e) => setSearchLead(e.target.value)} placeholder="Buscar por nome, empresa, telefone..." className="h-9 pl-9 text-sm" />
                      </div>
                      {showLeadDropdown && leadResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {leadResults.map((lead) => (
                            <div key={lead.id} className="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer transition-colors" onClick={() => handleSelectLead(lead)}>
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

                {/* Propostas */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3 w-3" /> Propostas Vinculadas
                  </Label>
                  {!selectedLead ? (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg">Selecione um lead para ver propostas</p>
                  ) : loadingPropostas ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-2.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando...</div>
                  ) : leadPropostas.length === 0 ? (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg">Nenhuma proposta encontrada</p>
                  ) : (
                    <div className="border rounded-lg divide-y max-h-36 overflow-y-auto">
                      {leadPropostas.map((prop) => (
                        <div key={prop.id} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => toggleProposta(prop.id)}>
                          <Checkbox checked={selectedPropostas.includes(prop.id)} onCheckedChange={() => toggleProposta(prop.id)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{prop.number || 'Sem número'}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(prop.fidel_monthly_value)}/mês{prop.duration_months ? ` • ${prop.duration_months}m` : ''}</p>
                          </div>
                          {statusBadge(prop.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prédio */}
                <BuildingSelector selectedBuildingId={selectedBuildingId} onSelectBuilding={setSelectedBuildingId} />

                {/* Título */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Título *</Label>
                  <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título do evento..." className="h-9" />
                </div>

                {/* Data e Horários */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !dataPrevista && "text-muted-foreground")}>
                          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                          {dataPrevista ? format(dataPrevista, "dd/MM", { locale: ptBR }) : "Data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dataPrevista} onSelect={setDataPrevista} initialFocus locale={ptBR} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Início</Label>
                    <Input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Até</Label>
                    <Input type="time" value={horarioLimite} onChange={(e) => setHorarioLimite(e.target.value)} className="h-9" />
                  </div>
                </div>

                {/* Link reunião / Local */}
                {tipoEvento === 'reuniao' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><Video className="h-3 w-3" /> Link da Reunião</Label>
                    <Input value={linkReuniao} onChange={(e) => setLinkReuniao(e.target.value)} placeholder="https://meet.google.com/..." className="h-9" />
                  </div>
                )}
                {tipoEvento === 'compromisso' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Local</Label>
                    <Input value={localEvento} onChange={(e) => setLocalEvento(e.target.value)} placeholder="Endereço..." className="h-9" />
                  </div>
                )}

                {/* Prioridade e Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Prioridade</Label>
                    <Select value={prioridade} onValueChange={setPrioridade}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emergencia">🔴 Emergência</SelectItem>
                        <SelectItem value="alta">🟠 Alta</SelectItem>
                        <SelectItem value="media">🟡 Média</SelectItem>
                        <SelectItem value="baixa">🟢 Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
                    <Label className="text-xs text-muted-foreground">Escopo</Label>
                    <Select value={escopo} onValueChange={setEscopo}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">👤 Individual</SelectItem>
                        <SelectItem value="departamento">🏢 Departamento</SelectItem>
                        <SelectItem value="global">📢 Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Descrição */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição</Label>
                  <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição opcional..." rows={3} className="text-sm" />
                </div>
              </div>

              {/* ── RIGHT: Notifications & Actions ── */}
              <div className="p-5 space-y-5 bg-muted/20">
                {/* Monitor de Confirmações */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <Bell className="h-3.5 w-3.5" /> Notificações
                    </h3>
                    {totalReceipts > 0 && (
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {confirmedCount}/{totalReceipts} confirmaram
                      </span>
                    )}
                  </div>

                  {totalReceipts === 0 ? (
                    <div className="text-center py-6 bg-background rounded-lg border border-dashed">
                      <Bell className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-xs text-muted-foreground">Nenhuma notificação enviada</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Use o botão abaixo para notificar</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {receipts.map((receipt) => (
                        <div key={receipt.id} className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all duration-500",
                          receipt.status === 'read' ? 'bg-emerald-50/50 border-emerald-200/50' :
                          receipt.status === 'delivered' ? 'bg-blue-50/50 border-blue-200/50' :
                          'bg-background border-border',
                          newlyConfirmedIds.has(receipt.id) && 'animate-pulse ring-2 ring-emerald-400/50 bg-emerald-100/70'
                        )}>
                          <div className="flex items-center gap-2 min-w-0">
                            {getReceiptStatusIcon(receipt.status)}
                            <span className="text-sm font-medium truncate">
                              {receipt.contact_name || receipt.contact_phone}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                            {getReceiptStatusLabel(receipt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botão Enviar Lembrete */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-9 text-xs gap-2 border-primary/30 text-primary hover:bg-primary/5 font-semibold"
                    onClick={handleSendReminder}
                    disabled={sendingReminder}
                  >
                    {sendingReminder ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {sendingReminder ? 'Enviando...' : 'Enviar Lembrete'}
                  </Button>

                   <p className="text-[10px] text-center text-muted-foreground/60">
                    Atualiza automaticamente a cada 5s
                  </p>
                </div>

                {/* Separador */}
                <div className="border-t" />

                {/* Configuração de notificação ao salvar */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ao salvar
                  </h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-notify-save" className="text-xs flex items-center gap-1.5 cursor-pointer">
                      <BellRing className="h-3.5 w-3.5 text-primary" />
                      Notificar ao salvar
                    </Label>
                    <Switch id="edit-notify-save" checked={notifyOnSave} onCheckedChange={setNotifyOnSave} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-auto-followup" className="text-xs flex items-center gap-1.5 cursor-pointer">
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      Follow-up automático
                    </Label>
                    <Switch id="edit-auto-followup" checked={autoFollowup} onCheckedChange={setAutoFollowup} />
                  </div>
                </div>

                {/* Seleção de contatos para notificar */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Contatos WhatsApp</p>
                  {adminUsers.filter(u => u.telefone).length === 0 ? (
                    <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">Nenhum admin com telefone</p>
                  ) : (
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {adminUsers.filter(u => u.telefone).map(u => {
                        const isSelected = selectedNotifyContacts.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className={cn(
                              "flex items-center gap-2 text-xs p-2 rounded-lg cursor-pointer border transition-colors",
                              isSelected ? "bg-primary/5 border-primary/20" : "bg-background border-transparent hover:bg-muted/50"
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                setSelectedNotifyContacts(prev =>
                                  checked ? [...prev, u.id] : prev.filter(id => id !== u.id)
                                );
                              }}
                              className="h-4 w-4"
                            />
                            <span className="font-medium flex-1 truncate">{u.nome || u.email}</span>
                            <span className="text-[10px] text-muted-foreground">📱</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-[10px] text-muted-foreground gap-1.5"
                    onClick={() => setAlertContactsOpen(true)}
                  >
                    <Users className="h-3 w-3" /> Gerenciar Contatos
                  </Button>
                </div>
              </div>
            </div>

            {/* ── Footer Actions ── */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t bg-background sticky bottom-0">
              <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteDialogOpen(true)} className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs">
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={updateMutation.isPending} className="bg-primary hover:bg-primary/90 text-xs gap-1.5">
                  {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
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

      <ManageAlertContactsModal open={alertContactsOpen} onOpenChange={setAlertContactsOpen} />
    </>
  );
};

export default EditTaskModal;
