/**
 * CreateTaskModal - Modal para criação de tarefas
 * Usa tabela `tasks` (canônica) - NÃO notion_tasks
 */

import React, { useState, useMemo } from 'react';
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
import { Calendar as CalendarIcon, Loader2, Plus, Clock, Bell, BellRing, Users, ChevronDown, Building2 } from 'lucide-react';
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

const CreateTaskModal = ({ open, onOpenChange }: CreateTaskModalProps) => {
  const queryClient = useQueryClient();
  const { user, userProfile } = useAuth();
  const isMobile = useIsMobile();
  
  // Form state
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataPrevista, setDataPrevista] = useState<Date | undefined>();
  const [horarioLimite, setHorarioLimite] = useState('');
  const [prioridade, setPrioridade] = useState<string>('media');
  const [responsaveisIds, setResponsaveisIds] = useState<string[]>([]);
  const [responsaveisOpen, setResponsaveisOpen] = useState(false);
  const [alarmeOpen, setAlarmeOpen] = useState(false);
  const [alarmePadrao, setAlarmePadrao] = useState(true);
  const [alarmeInsistente, setAlarmeInsistente] = useState(false);

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
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('tasks')
        .insert({
          titulo,
          descricao: descricao || null,
          data_prevista: dataPrevista ? format(dataPrevista, 'yyyy-MM-dd') : null,
          horario_limite: horarioLimite || null,
          prioridade: prioridade as 'emergencia' | 'alta' | 'media' | 'baixa',
          status: 'pendente' as const,
          origem: 'manual' as const,
          todos_responsaveis: responsaveisIds.length === 0,
          created_by: user.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tarefa criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['minha-manha-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['central-tarefas'] });
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
    setDataPrevista(undefined);
    setHorarioLimite('');
    setPrioridade('media');
    setResponsaveisIds([]);
    setAlarmePadrao(true);
    setAlarmeInsistente(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error('O título da tarefa é obrigatório');
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

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Info do criador */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
        Criado por: <span className="font-medium">{userProfile?.nome || user?.email}</span>
      </div>

      {/* Título da Tarefa */}
      <div className="space-y-2">
        <Label htmlFor="titulo">Título *</Label>
        <Input
          id="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="O que precisa ser feito?"
          className="h-11"
          autoFocus
        />
      </div>

      {/* Data e Hora - Layout mais destacado */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            Data
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-11 border-2",
                  !dataPrevista && "text-muted-foreground",
                  dataPrevista && "border-primary/30 bg-primary/5"
                )}
              >
                {dataPrevista ? (
                  <span className="font-medium">{format(dataPrevista, "dd/MM/yyyy", { locale: ptBR })}</span>
                ) : (
                  "Selecionar"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dataPrevista}
                onSelect={setDataPrevista}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Clock className="h-3.5 w-3.5 text-primary" />
            Hora
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

            {!dataPrevista && !horarioLimite && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ Defina data e hora para os alertas funcionarem
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

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
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              Nova Tarefa
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-4 overflow-y-auto">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: usar Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            Nova Tarefa
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskModal;
