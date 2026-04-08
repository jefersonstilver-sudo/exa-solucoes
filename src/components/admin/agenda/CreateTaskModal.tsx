/**
 * CreateTaskModal - Modal para criação de tarefas
 * Usa tabela `tasks` (canônica) - NÃO notion_tasks
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TaskRemindersPanel, TaskReminder, DEFAULT_REMINDERS } from './TaskRemindersPanel';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
import { Calendar as CalendarIcon, Loader2, Plus, Clock, Bell, BellRing, Users, ChevronDown, Building2, Video, MapPin, Megaphone, Search, X, FileText, Repeat, Settings } from 'lucide-react';
import { useEventTypes } from '@/hooks/agenda/useEventTypes';
import EventTypeManagerModal from './EventTypeManagerModal';
import BuildingSelector from './BuildingSelector';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import ManageAlertContactsModal from './ManageAlertContactsModal';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AdminUser {
  id: string;
  email: string;
  nome: string;
  role: string;
  telefone?: string;
  departamento_id?: string;
}

interface Department {
  id: string;
  name: string;
  color: string;
  icon: string;
  display_order: number;
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

const CreateTaskModal = ({ open, onOpenChange }: CreateTaskModalProps) => {
  const queryClient = useQueryClient();
  const { user, userProfile } = useAuth();
  const isMobile = useIsMobile();
  
  // Form state
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [datasPrevistas, setDatasPrevistas] = useState<Date[]>([]);
  const [horarioLimite, setHorarioLimite] = useState('');
  const [prioridade, setPrioridade] = useState<string>('media');
  const [responsaveisIds, setResponsaveisIds] = useState<string[]>([]);
  const [responsaveisOpen, setResponsaveisOpen] = useState(false);
  const [alarmeOpen, setAlarmeOpen] = useState(false);
  const [alarmePadrao, setAlarmePadrao] = useState(true);
  const [alarmeInsistente, setAlarmeInsistente] = useState(false);
  // Novos campos Fase 1
  const [tipoEvento, setTipoEvento] = useState<string>('tarefa');
  const [subtipoReuniao, setSubtipoReuniao] = useState<string>('');
  const [localEvento, setLocalEvento] = useState('');
  const [linkReuniao, setLinkReuniao] = useState('');
  const [escopo, setEscopo] = useState<string>('individual');
  const [horarioInicio, setHorarioInicio] = useState('');

  // Lead search state
  const [searchLead, setSearchLead] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadResult | null>(null);
  const [leadResults, setLeadResults] = useState<LeadResult[]>([]);
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const leadDropdownRef = useRef<HTMLDivElement>(null);

  // Propostas state
  const [leadPropostas, setLeadPropostas] = useState<PropostaResult[]>([]);
  const [selectedPropostas, setSelectedPropostas] = useState<string[]>([]);
  const [loadingPropostas, setLoadingPropostas] = useState(false);

  // Recorrência state
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [frequenciaRecorrencia, setFrequenciaRecorrencia] = useState('semanal');
  const [eventTypeManagerOpen, setEventTypeManagerOpen] = useState(false);

  // Building state
  
  // Reminders state — start with defaults
  const [taskReminders, setTaskReminders] = useState<TaskReminder[]>(
    DEFAULT_REMINDERS.map(r => ({ ...r, id: crypto.randomUUID() }))
  );
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  // WhatsApp notification state
  const [notifyOnSave, setNotifyOnSave] = useState(true);
  const [autoFollowup, setAutoFollowup] = useState(true);
  const [alertContactsOpen, setAlertContactsOpen] = useState(false);
  const [whatsappNotifOpen, setWhatsappNotifOpen] = useState(false);
  const [selectedNotifyContacts, setSelectedNotifyContacts] = useState<string[]>([]);
  const [notifyContactsInitialized, setNotifyContactsInitialized] = useState(false);




  // Hook de tipos de evento dinâmicos
  const { activeEventTypes } = useEventTypes();

  // Debounce lead search — busca em contacts + proposals.client_name
  useEffect(() => {
    if (searchLead.length < 2) {
      setLeadResults([]);
      setShowLeadDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      const termo = `%${searchLead}%`;

      // Busca paralela em contacts e proposals
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
      const seenIds = new Set<string>();

      // Adiciona contatos reais
      if (!contactsRes.error && contactsRes.data) {
        for (const c of contactsRes.data) {
          seenIds.add(c.id);
          results.push(c as LeadResult);
        }
      }

      // Adiciona clientes de propostas que NÃO estão em contacts (evita duplicatas por nome)
      if (!proposalsRes.error && proposalsRes.data) {
        const seenNames = new Set(results.map(r => `${r.nome} ${r.sobrenome || ''}`.trim().toLowerCase()));
        for (const p of proposalsRes.data) {
          const name = (p.client_name || '').trim();
          if (!name || seenNames.has(name.toLowerCase())) continue;
          seenNames.add(name.toLowerCase());
          // Cria um LeadResult sintético a partir da proposta
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
  }, [searchLead, tipoEvento]);

  // Fetch propostas when lead changes
  useEffect(() => {
    if (!selectedLead) {
      setLeadPropostas([]);
      setSelectedPropostas([]);
      return;
    }

    const fetchPropostas = async () => {
      setLoadingPropostas(true);
      const filters: string[] = [];
      if (selectedLead.telefone) {
        filters.push(`client_phone.eq.${selectedLead.telefone}`);
      }
      if (selectedLead.nome) {
        filters.push(`client_name.ilike.%${selectedLead.nome}%`);
      }

      if (filters.length === 0) {
        setLeadPropostas([]);
        setLoadingPropostas(false);
        return;
      }

      const { data, error } = await supabase
        .from('proposals')
        .select('id, number, status, fidel_monthly_value, client_name, duration_months')
        .or(filters.join(','))
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLeadPropostas(data as PropostaResult[]);
      }
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

  // Buscar departamentos
  const { data: departments = [] } = useQuery({
    queryKey: ['departments-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('process_departments')
        .select('id, name, color, icon, display_order')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return (data || []) as Department[];
    }
  });

  // Buscar prédios para obter o nome na notificação
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

  // Buscar usuários administrativos
  const { data: adminUsers = [] } = useQuery({
    queryKey: ['admin-users-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, nome, role, telefone, departamento_id')
        .in('role', ['super_admin', 'admin', 'admin_departamental', 'ceo', 'coordenacao'])
        .order('nome');
      
      if (error) throw error;
      return (data || []) as AdminUser[];
    }
  });

  // Buscar contatos de alerta (externos)
  const { data: alertContacts = [] } = useQuery({
    queryKey: ['agenda-alert-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exa_alerts_directors')
        .select('id, nome, telefone, ativo')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data || [];
    }
  });

  // Lista unificada de contatos selecionáveis (admin + externos, deduplicando por telefone)
  const allSelectableContacts = useMemo(() => {
    const adminPhones = new Set<string>();
    const result: { compositeId: string; source: 'admin' | 'alert'; nome: string; telefone: string; email?: string; isCreator: boolean }[] = [];

    // Admins com telefone
    adminUsers.filter(u => u.telefone).forEach(u => {
      const phone = u.telefone!;
      adminPhones.add(phone);
      result.push({
        compositeId: `admin:${u.id}`,
        source: 'admin',
        nome: u.nome || u.email,
        telefone: phone,
        email: u.email,
        isCreator: u.id === user?.id,
      });
    });

    // Contatos externos (deduplicar por telefone)
    alertContacts.forEach((c: any) => {
      if (c.telefone && !adminPhones.has(c.telefone)) {
        result.push({
          compositeId: `alert:${c.id}`,
          source: 'alert',
          nome: c.nome || c.telefone,
          telefone: c.telefone,
          isCreator: false,
        });
      }
    });

    return result;
  }, [adminUsers, alertContacts, user?.id]);

  // Initialize selected notify contacts with creator (using composite ID)
  useEffect(() => {
    if (!notifyContactsInitialized && user?.id && allSelectableContacts.length > 0) {
      const creatorContact = allSelectableContacts.find(c => c.isCreator);
      if (creatorContact) {
        setSelectedNotifyContacts([creatorContact.compositeId]);
      }
      setNotifyContactsInitialized(true);
    }
  }, [user?.id, allSelectableContacts, notifyContactsInitialized]);

  // Agrupar usuários por departamento
  const usersByDepartment = useMemo(() => {
    const grouped: Record<string, AdminUser[]> = {};
    
    // Criar grupos para cada departamento
    departments.forEach(dept => {
      grouped[dept.id] = [];
    });
    
    // Grupo para usuários sem departamento
    grouped['sem_departamento'] = [];
    
    // Distribuir usuários
    adminUsers.forEach(user => {
      if (user.departamento_id && grouped[user.departamento_id]) {
        grouped[user.departamento_id].push(user);
      } else {
        grouped['sem_departamento'].push(user);
      }
    });
    
    return grouped;
  }, [adminUsers, departments]);

  const createMutation = useMutation({
    mutationFn: async (): Promise<string[]> => {
      if (!user) throw new Error('Usuário não autenticado');
      if (datasPrevistas.length === 0) throw new Error('Selecione pelo menos 1 data');

      const baseFields = {
        titulo,
        descricao: descricao || null,
        horario_limite: horarioLimite || null,
        horario_inicio: horarioInicio || null,
        prioridade: prioridade as 'emergencia' | 'alta' | 'media' | 'baixa',
        status: 'pendente' as const,
        origem: 'manual' as const,
        todos_responsaveis: responsaveisIds.length === 0,
        created_by: user.id,
        tipo_evento: tipoEvento,
        subtipo_reuniao: subtipoReuniao || null,
        local_evento: localEvento || null,
        link_reuniao: linkReuniao || null,
        escopo,
        cliente_id: selectedLead?.id && !selectedLead.id.startsWith('proposal-') 
          ? selectedLead.id 
          : null,
        notify_on_save: notifyOnSave,
        auto_followup: autoFollowup,
        building_id: selectedBuildingId || null,
      };

      const createdIds: string[] = [];

      for (const data of datasPrevistas) {
        const { data: taskData, error } = await supabase
          .from('tasks')
          .insert({
            ...baseFields,
            data_prevista: format(data, 'yyyy-MM-dd'),
          })
          .select('id')
          .single();

        if (error) throw error;

        const taskId = taskData?.id;
        if (taskId) {
          createdIds.push(taskId);

          // Vincular propostas para cada task criada
          if (selectedPropostas.length > 0) {
            const { error: propError } = await supabase
              .from('task_propostas')
              .insert(
                selectedPropostas.map(pid => ({ task_id: taskId, proposta_id: pid }))
              );
            if (propError) {
              console.error('Erro ao vincular propostas:', propError);
            }
          }

          // Inserir lembretes
          if (taskReminders.length > 0) {
            await supabase.from('task_reminders').insert(
              taskReminders.map(r => ({
                task_id: taskId,
                tipo: r.tipo,
                unidade: r.unidade,
                valor: r.valor,
                ativo: r.ativo,
              }))
            );
          }
        }
      }

      return createdIds;
    },
    onSuccess: (createdIds: string[]) => {
      const count = datasPrevistas.length;
      toast.success(count > 1 ? `${count} tarefas criadas com sucesso!` : 'Tarefa criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['minha-manha-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['central-tarefas'] });
      queryClient.invalidateQueries({ queryKey: ['agenda-tasks'] });

      // Send WhatsApp notification if enabled
      if (notifyOnSave && selectedNotifyContacts.length > 0) {
        // Get phone numbers of selected contacts (unified list)
        const selectedPhones = allSelectableContacts
          .filter(c => selectedNotifyContacts.includes(c.compositeId))
          .map(c => ({ nome: c.nome, telefone: c.telefone }));

        // Build responsaveis names list
        const responsaveisNomes = adminUsers
          .filter(u => responsaveisIds.includes(u.id))
          .map(u => u.nome || u.email);

        // Send one notification per created task with real IDs
        for (const realTaskId of createdIds) {
          supabase.functions.invoke('task-notify-created', {
            body: {
              task_id: realTaskId,
              titulo,
              data: datasPrevistas.length > 0 ? format(datasPrevistas[0], 'dd/MM/yyyy') : null,
              horario: horarioLimite || horarioInicio || null,
              horario_inicio: horarioInicio || null,
              criador_nome: userProfile?.nome || user?.email,
              specific_contacts: selectedPhones,
              tipo_evento: tipoEvento || 'tarefa',
              descricao: descricao || null,
              local_evento: localEvento || null,
              building_name: selectedBuildingId 
                ? allBuildings.find(b => b.id === selectedBuildingId)?.nome || null 
                : null,
              responsaveis_nomes: responsaveisNomes.length > 0 ? responsaveisNomes : null,
              subtipo_reuniao: subtipoReuniao || null,
              link_reuniao: linkReuniao || null,
              prioridade: prioridade || null,
              lead_nome: selectedLead ? `${selectedLead.nome}${selectedLead.sobrenome ? ' ' + selectedLead.sobrenome : ''}` : null,
              lead_empresa: selectedLead?.empresa || null,
              lead_telefone: selectedLead?.telefone || null,
              propostas_info: leadPropostas.filter(p => selectedPropostas.includes(p.id)).map(p => `#${p.number || '?'} (${p.status || 'N/A'})`),
            }
          }).catch(err => console.error('Erro ao notificar WhatsApp:', err));
        }
      }

      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar tarefa: ${error.message}`);
    }
  });

  const resetForm = () => {
    setTitulo('');
    setDescricao('');
    setDatasPrevistas([]);
    setHorarioLimite('');
    setPrioridade('media');
    setResponsaveisIds([]);
    setAlarmePadrao(true);
    setAlarmeInsistente(false);
    setTipoEvento('tarefa');
    setSubtipoReuniao('');
    setLocalEvento('');
    setLinkReuniao('');
    setEscopo('individual');
    setHorarioInicio('');
    // Reset novos campos
    setSearchLead('');
    setSelectedLead(null);
    setLeadResults([]);
    setShowLeadDropdown(false);
    setLeadPropostas([]);
    setSelectedPropostas([]);
    setIsRecorrente(false);
    setFrequenciaRecorrencia('semanal');
    setSelectedBuildingId(null);
    setTaskReminders(DEFAULT_REMINDERS.map(r => ({ ...r, id: crypto.randomUUID() })));
  };

  const addDataPrevista = (date: Date | undefined) => {
    if (!date) return;
    // Evitar duplicatas
    const exists = datasPrevistas.some(d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
    if (!exists) {
      setDatasPrevistas(prev => [...prev, date]);
    }
  };

  const removeDataPrevista = (index: number) => {
    setDatasPrevistas(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error('O título da tarefa é obrigatório');
      return;
    }
    if (datasPrevistas.length === 0) {
      toast.error('Selecione pelo menos 1 data');
      return;
    }
    createMutation.mutate();
  };

  const toggleResponsavel = (userId: string) => {
    setResponsaveisIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Selecionar/deselecionar departamento inteiro
  const toggleDepartamento = (deptId: string) => {
    const usersInDept = usersByDepartment[deptId] || [];
    const userIds = usersInDept.map(u => u.id);
    
    // Verificar se todos os usuários do departamento já estão selecionados
    const allSelected = userIds.every(id => responsaveisIds.includes(id));
    
    if (allSelected) {
      // Remover todos do departamento
      setResponsaveisIds(prev => prev.filter(id => !userIds.includes(id)));
    } else {
      // Adicionar todos do departamento
      setResponsaveisIds(prev => [...new Set([...prev, ...userIds])]);
    }
  };

  // Verificar se departamento está totalmente selecionado
  const isDepartmentFullySelected = (deptId: string) => {
    const usersInDept = usersByDepartment[deptId] || [];
    if (usersInDept.length === 0) return false;
    return usersInDept.every(u => responsaveisIds.includes(u.id));
  };

  // Verificar se departamento está parcialmente selecionado
  const isDepartmentPartiallySelected = (deptId: string) => {
    const usersInDept = usersByDepartment[deptId] || [];
    if (usersInDept.length === 0) return false;
    const selectedCount = usersInDept.filter(u => responsaveisIds.includes(u.id)).length;
    return selectedCount > 0 && selectedCount < usersInDept.length;
  };

  const getSelectedResponsaveisText = () => {
    if (responsaveisIds.length === 0) return 'Todos';
    
    // Verificar se algum departamento inteiro está selecionado
    const fullySelectedDepts = departments.filter(d => isDepartmentFullySelected(d.id));
    
    if (fullySelectedDepts.length > 0) {
      const deptNames = fullySelectedDepts.map(d => d.name);
      // Contar usuários selecionados que não estão em departamentos completos
      const deptUserIds = fullySelectedDepts.flatMap(d => 
        (usersByDepartment[d.id] || []).map(u => u.id)
      );
      const otherSelected = responsaveisIds.filter(id => !deptUserIds.includes(id)).length;
      
      if (deptNames.length === 1 && otherSelected === 0) {
        return deptNames[0];
      }
      if (deptNames.length <= 2 && otherSelected === 0) {
        return deptNames.join(', ');
      }
      return `${deptNames.length} dept${otherSelected > 0 ? ` +${otherSelected}` : ''}`;
    }
    
    const selectedNames = adminUsers
      .filter(u => responsaveisIds.includes(u.id))
      .map(u => u.nome?.split(' ')[0] || u.email.split('@')[0]);
    if (selectedNames.length <= 2) return selectedNames.join(', ');
    return `${selectedNames.slice(0, 2).join(', ')} +${selectedNames.length - 2}`;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'super_admin': 'CEO',
      'ceo': 'CEO',
      'admin': 'Coordenação',
      'coordenacao': 'Coordenação',
      'admin_departamental': 'Admin Dept.'
    };
    return labels[role] || role;
  };

  const getDepartmentById = (id: string) => {
    return departments.find(d => d.id === id);
  };

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
      prev.includes(propostaId)
        ? prev.filter(id => id !== propostaId)
        : [...prev, propostaId]
    );
  };

  const formatCurrency = (value: number | null) => {
    if (value == null) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Info do criador */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
        Criado por: <span className="font-medium">{userProfile?.nome || user?.email}</span>
      </div>

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
          <SelectTrigger className="h-11">
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
            <SelectTrigger className="h-11">
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

      {/* === Busca de Lead (todos os tipos) === */}
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
            <button
              type="button"
              onClick={handleRemoveLead}
              className="p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative" ref={leadDropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchLead}
                onChange={(e) => setSearchLead(e.target.value)}
                placeholder="Buscar por nome, empresa, telefone ou email..."
                className="h-11 pl-9"
              />
            </div>
            {showLeadDropdown && leadResults.length > 0 && (
              <div className="absolute z-[var(--z-floating)] w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {leadResults.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center gap-2 px-3 py-2.5 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleSelectLead(lead)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {lead.nome} {lead.sobrenome || ''}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[lead.empresa, lead.telefone].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                    {temperaturaBadge(lead.temperatura)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* === Multi-select Propostas (todos os tipos) === */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-primary" />
          Propostas Vinculadas
        </Label>

        {!selectedLead ? (
          <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            Selecione um lead para ver propostas vinculadas
          </p>
        ) : loadingPropostas ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-3">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Buscando propostas...
          </div>
        ) : leadPropostas.length === 0 ? (
          <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            Nenhuma proposta encontrada para este lead
          </p>
        ) : (
          <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
            {leadPropostas.map((prop) => (
              <div
                key={prop.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => toggleProposta(prop.id)}
              >
                <Checkbox
                  checked={selectedPropostas.includes(prop.id)}
                  onCheckedChange={() => toggleProposta(prop.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {prop.number || 'Sem número'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(prop.fidel_monthly_value)}/mês
                    {prop.duration_months ? ` • ${prop.duration_months} meses` : ''}
                  </p>
                </div>
                {statusBadge(prop.status)}
              </div>
            ))}
          </div>
        )}

        {selectedPropostas.length > 0 && (
          <p className="text-xs text-primary font-medium">
            {selectedPropostas.length} proposta{selectedPropostas.length > 1 ? 's' : ''} selecionada{selectedPropostas.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* === Seletor de Prédio (todos os tipos) === */}
      <BuildingSelector
        selectedBuildingId={selectedBuildingId}
        onSelectBuilding={setSelectedBuildingId}
      />

      {/* === Local do Evento com Google Places Autocomplete === */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Local do Evento
        </Label>
        <AddressAutocomplete
          value={localEvento}
          onChange={setLocalEvento}
          onPlaceSelect={(place) => {
            setLocalEvento(place.address);
          }}
          onClear={() => setLocalEvento('')}
          placeholder="Buscar local (ex: Hotel Viale, Shopping JL...)"
          className="h-11"
        />
      </div>

      {/* === Link da Reunião (apenas para reuniões) === */}
      {tipoEvento === 'reuniao' && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5 text-primary" />
            Link da Reunião
          </Label>
          <Input
            value={linkReuniao}
            onChange={(e) => setLinkReuniao(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="h-11"
            type="url"
          />
        </div>
      )}

      {/* Título da Tarefa */}
      <div className="space-y-2">
        <Label htmlFor="titulo">Título *</Label>
        <Input
          id="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder={tipoEvento === 'reuniao' ? 'Assunto da reunião' : tipoEvento === 'compromisso' ? 'Descrição do compromisso' : tipoEvento === 'aviso' ? 'Título do aviso' : 'O que precisa ser feito?'}
          className="h-11"
          autoFocus
        />
      </div>

      {/* Datas e Hora */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <CalendarIcon className="h-3.5 w-3.5 text-primary" />
          Datas *
        </Label>

        {/* Lista de datas selecionadas */}
        {datasPrevistas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {datasPrevistas.map((data, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full px-3 py-1 text-sm font-medium"
              >
                <CalendarIcon className="h-3 w-3" />
                {format(data, "dd/MM/yyyy", { locale: ptBR })}
                {datasPrevistas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDataPrevista(index)}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Botão para adicionar data */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-11 border-2 border-dashed",
                datasPrevistas.length === 0 && "text-muted-foreground"
              )}
            >
              <Plus className="h-4 w-4 mr-2" />
              {datasPrevistas.length === 0 ? 'Selecionar data' : 'Adicionar outra data'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={addDataPrevista}
              initialFocus
              locale={ptBR}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {datasPrevistas.length > 1 && (
          <p className="text-xs text-muted-foreground">
            ℹ️ Será criada uma tarefa idêntica para cada data selecionada ({datasPrevistas.length} tarefas)
          </p>
        )}
      </div>

      {/* Horários */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Clock className="h-3.5 w-3.5 text-primary" />
            Hora Início
          </Label>
          <Input
            type="time"
            value={horarioInicio}
            onChange={(e) => setHorarioInicio(e.target.value)}
            className={cn(
              "h-11 border-2",
              horarioInicio && "border-primary/30 bg-primary/5"
            )}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            Hora Limite
          </Label>
          <Input
            type="time"
            value={horarioLimite}
            onChange={(e) => setHorarioLimite(e.target.value)}
            className={cn(
              "h-11 border-2",
              horarioLimite && "border-primary/30 bg-primary/5"
            )}
          />
        </div>
      </div>

      {/* Prioridade */}
      <div className="space-y-2">
        <Label>Prioridade</Label>
        <Select value={prioridade} onValueChange={setPrioridade}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Selecionar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="emergencia">🔴 Emergência</SelectItem>
            <SelectItem value="alta">🟠 Alta</SelectItem>
            <SelectItem value="media">🟡 Média</SelectItem>
            <SelectItem value="baixa">🟢 Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Responsáveis (Collapsible) */}
      <Collapsible open={responsaveisOpen} onOpenChange={setResponsaveisOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between h-10"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Responsáveis: {getSelectedResponsaveisText()}</span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              responsaveisOpen && "rotate-180"
            )} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="border rounded-lg p-3 space-y-3 bg-muted/30 max-h-64 overflow-y-auto">
            <p className="text-xs text-muted-foreground">
              Selecione quem será notificado. Se nenhum for selecionado, todos receberão.
            </p>
            
            {/* Usuários agrupados por departamento */}
            {departments.map((dept) => {
              const usersInDept = usersByDepartment[dept.id] || [];
              if (usersInDept.length === 0) return null;
              
              const isFullySelected = isDepartmentFullySelected(dept.id);
              const isPartiallySelected = isDepartmentPartiallySelected(dept.id);
              
              return (
                <div key={dept.id} className="space-y-1">
                  {/* Header do departamento - clicável para selecionar todos */}
                  <div 
                    className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: `${dept.color}15` }}
                    onClick={() => toggleDepartamento(dept.id)}
                  >
                    <Checkbox 
                      checked={isFullySelected}
                      className={cn(
                        isPartiallySelected && "data-[state=unchecked]:bg-primary/30"
                      )}
                      onCheckedChange={() => toggleDepartamento(dept.id)}
                    />
                    <Building2 className="h-3.5 w-3.5" style={{ color: dept.color }} />
                    <span className="text-xs font-semibold flex-1" style={{ color: dept.color }}>
                      {dept.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {usersInDept.filter(u => responsaveisIds.includes(u.id)).length}/{usersInDept.length}
                    </span>
                  </div>
                  
                  {/* Usuários do departamento */}
                  <div className="ml-6 space-y-0.5">
                    {usersInDept.map((u) => (
                      <div 
                        key={u.id} 
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => toggleResponsavel(u.id)}
                      >
                        <Checkbox 
                          checked={responsaveisIds.includes(u.id)}
                          onCheckedChange={() => toggleResponsavel(u.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {u.nome || u.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {getRoleLabel(u.role)}
                          </p>
                        </div>
                        {u.telefone && (
                          <span className="text-xs text-green-600">📱</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {/* Usuários sem departamento */}
            {usersByDepartment['sem_departamento']?.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">
                    Sem Departamento
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({usersByDepartment['sem_departamento'].length})
                  </span>
                </div>
                <div className="ml-2 space-y-0.5">
                  {usersByDepartment['sem_departamento'].map((u) => (
                    <div 
                      key={u.id} 
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => toggleResponsavel(u.id)}
                    >
                      <Checkbox 
                        checked={responsaveisIds.includes(u.id)}
                        onCheckedChange={() => toggleResponsavel(u.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {u.nome || u.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {getRoleLabel(u.role)}
                        </p>
                      </div>
                      {u.telefone && (
                        <span className="text-xs text-green-600">📱</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Configuração de Alarmes */}
      <Collapsible open={alarmeOpen} onOpenChange={setAlarmeOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between h-10"
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span>Alertas WhatsApp</span>
              {(alarmePadrao || alarmeInsistente) && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  {alarmePadrao && alarmeInsistente ? '2 ativos' : '1 ativo'}
                </span>
              )}
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              alarmeOpen && "rotate-180"
            )} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Alarme Padrão</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Envia 2 alertas: 1 hora antes e 30 minutos antes
                </p>
              </div>
              <Switch
                checked={alarmePadrao}
                onCheckedChange={setAlarmePadrao}
              />
            </div>

            <div className="border-t" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-orange-500" />
                  <span className="font-medium text-sm">Super Insistente</span>
                  <span className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded">
                    ⚡
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Alertas a cada 5 min nos últimos 30 minutos
                </p>
              </div>
              <Switch
                checked={alarmeInsistente}
                onCheckedChange={setAlarmeInsistente}
              />
            </div>

            {datasPrevistas.length === 0 && !horarioLimite && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ Defina data e hora para os alertas funcionarem
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* === NOVO: Toggle de Recorrência (todos os tipos) === */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5">
            <Repeat className="h-3.5 w-3.5 text-primary" />
            Tarefa recorrente
          </Label>
          <Switch
            checked={isRecorrente}
            onCheckedChange={setIsRecorrente}
          />
        </div>
        {isRecorrente && (
          <div className="space-y-2 pl-1">
            <Select value={frequenciaRecorrencia} onValueChange={setFrequenciaRecorrencia}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diaria">📅 Diária</SelectItem>
                <SelectItem value="semanal">📆 Semanal</SelectItem>
                <SelectItem value="mensal">🗓️ Mensal</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
              ℹ️ Tarefas recorrentes serão geradas automaticamente conforme a frequência selecionada.
            </p>
          </div>
        )}
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Detalhes adicionais..."
          rows={3}
        />
      </div>

      {/* Lembretes de Notificação */}
      <div className="border rounded-lg p-4 bg-muted/20">
        <TaskRemindersPanel
          reminders={taskReminders}
          onChange={setTaskReminders}
        />
      </div>

      {/* Notificações WhatsApp */}
      <Collapsible open={whatsappNotifOpen} onOpenChange={setWhatsappNotifOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between h-10"
          >
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-green-600" />
              <span>Notificações WhatsApp</span>
              {notifyOnSave && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  Ativo
                </span>
              )}
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              whatsappNotifOpen && "rotate-180"
            )} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <Label htmlFor="create-notify-save" className="text-sm flex items-center gap-1.5 cursor-pointer">
                <BellRing className="h-3.5 w-3.5 text-green-600" />
                Notificar contatos ao salvar
              </Label>
              <Switch id="create-notify-save" checked={notifyOnSave} onCheckedChange={setNotifyOnSave} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="create-auto-followup" className="text-sm flex items-center gap-1.5 cursor-pointer">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                Follow-up automático (1h após)
              </Label>
              <Switch id="create-auto-followup" checked={autoFollowup} onCheckedChange={setAutoFollowup} />
            </div>

            <div className="border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Contatos com WhatsApp registrado:</p>
              {allSelectableContacts.length === 0 ? (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Nenhum contato com telefone cadastrado
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {/* Equipe (admins) */}
                  {allSelectableContacts.filter(c => c.source === 'admin').length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Equipe</p>
                      <div className="space-y-1">
                        {allSelectableContacts.filter(c => c.source === 'admin').map(c => {
                          const isSelected = selectedNotifyContacts.includes(c.compositeId);
                          return (
                            <label
                              key={c.compositeId}
                              className={cn(
                                "flex items-center gap-2 text-xs p-1.5 rounded cursor-pointer border transition-colors",
                                isSelected
                                  ? "bg-green-50 border-green-200"
                                  : "bg-muted/30 border-transparent hover:bg-muted/50"
                              )}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  setSelectedNotifyContacts(prev =>
                                    checked
                                      ? [...prev, c.compositeId]
                                      : prev.filter(id => id !== c.compositeId)
                                  );
                                }}
                                className="h-4 w-4"
                              />
                              <span className="text-green-600">📱</span>
                              <span className="font-medium flex-1 truncate">
                                {c.nome}
                                {c.isCreator && (
                                  <span className="ml-1 text-[10px] text-blue-600 font-semibold">(Criador)</span>
                                )}
                              </span>
                              <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-medium">Admin</span>
                              <span className="text-muted-foreground">{c.telefone}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Contatos Externos */}
                  {allSelectableContacts.filter(c => c.source === 'alert').length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Contatos Externos</p>
                      <div className="space-y-1">
                        {allSelectableContacts.filter(c => c.source === 'alert').map(c => {
                          const isSelected = selectedNotifyContacts.includes(c.compositeId);
                          return (
                            <label
                              key={c.compositeId}
                              className={cn(
                                "flex items-center gap-2 text-xs p-1.5 rounded cursor-pointer border transition-colors",
                                isSelected
                                  ? "bg-green-50 border-green-200"
                                  : "bg-muted/30 border-transparent hover:bg-muted/50"
                              )}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  setSelectedNotifyContacts(prev =>
                                    checked
                                      ? [...prev, c.compositeId]
                                      : prev.filter(id => id !== c.compositeId)
                                  );
                                }}
                                className="h-4 w-4"
                              />
                              <span className="text-green-600">📱</span>
                              <span className="font-medium flex-1 truncate">{c.nome}</span>
                              <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full font-medium">Externo</span>
                              <span className="text-muted-foreground">{c.telefone}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => setAlertContactsOpen(true)}
            >
              <Users className="h-3.5 w-3.5" />
              Gerenciar Contatos de Alerta
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <ManageAlertContactsModal open={alertContactsOpen} onOpenChange={setAlertContactsOpen} />

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-primary hover:bg-primary/90"
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Criar Tarefa
        </Button>
      </div>
    </form>
  );

  // Mobile: usar Drawer fullscreen
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95dvh] bg-background">
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              Nova Tarefa
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: usar Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            Nova Tarefa
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Preencha os campos para criar uma nova tarefa na agenda.</p>
        </DialogHeader>
        <div className="mt-4">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskModal;
