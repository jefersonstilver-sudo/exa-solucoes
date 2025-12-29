import React, { useState } from 'react';
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
import { Calendar as CalendarIcon, Loader2, Plus, Clock, Bell, BellRing, Users, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
}

const CreateTaskModal = ({ open, onOpenChange }: CreateTaskModalProps) => {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [data, setData] = useState<Date | undefined>();
  const [hora, setHora] = useState('');
  const [prioridade, setPrioridade] = useState<string>('');
  const [status, setStatus] = useState<string>('NÃO REALIZADO');
  const [responsaveisIds, setResponsaveisIds] = useState<string[]>([]);
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [alarmePadrao, setAlarmePadrao] = useState(true);
  const [alarmeInsistente, setAlarmeInsistente] = useState(false);
  const [alarmeOpen, setAlarmeOpen] = useState(false);
  const [responsaveisOpen, setResponsaveisOpen] = useState(false);

  // Buscar usuários administrativos
  const { data: adminUsers = [] } = useQuery({
    queryKey: ['admin-users-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, nome, role, telefone')
        .in('role', ['super_admin', 'admin', 'admin_financeiro', 'admin_marketing'])
        .order('nome');
      
      if (error) throw error;
      return (data || []) as AdminUser[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const localId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('notion_tasks' as any)
        .insert({
          notion_page_id: localId,
          nome,
          data: data ? format(data, 'yyyy-MM-dd') : null,
          hora: hora || null,
          prioridade: prioridade || null,
          status,
          responsaveis_ids: responsaveisIds.length > 0 ? responsaveisIds : null,
          responsavel: responsaveisIds.length > 0 
            ? adminUsers.filter(u => responsaveisIds.includes(u.id)).map(u => u.nome).join(', ')
            : 'Todos',
          descricao: descricao || null,
          categoria: categoria || null,
          alarme_padrao: alarmePadrao,
          alarme_insistente: alarmeInsistente,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tarefa criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['notion-tasks'] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar tarefa: ${error.message}`);
    }
  });

  const resetForm = () => {
    setNome('');
    setData(undefined);
    setHora('');
    setPrioridade('');
    setStatus('NÃO REALIZADO');
    setResponsaveisIds([]);
    setDescricao('');
    setCategoria('');
    setAlarmePadrao(true);
    setAlarmeInsistente(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error('O nome da tarefa é obrigatório');
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

  const getSelectedResponsaveisText = () => {
    if (responsaveisIds.length === 0) return 'Todos';
    if (responsaveisIds.length === adminUsers.length) return 'Todos';
    const selectedNames = adminUsers
      .filter(u => responsaveisIds.includes(u.id))
      .map(u => u.nome?.split(' ')[0] || u.email.split('@')[0]);
    if (selectedNames.length <= 2) return selectedNames.join(', ');
    return `${selectedNames.slice(0, 2).join(', ')} +${selectedNames.length - 2}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50">
              <Plus className="h-4 w-4 text-blue-600" />
            </div>
            Nova Tarefa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Nome da Tarefa */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Tarefa *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome da tarefa..."
              className="h-10"
            />
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
                      !data && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data ? format(data, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data}
                    onSelect={setData}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora">Hora</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="hora"
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="h-10 pl-10"
                />
              </div>
            </div>
          </div>

          {/* Prioridade e Categoria */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">🔴 Alta</SelectItem>
                  <SelectItem value="Média">🟡 Média</SelectItem>
                  <SelectItem value="Baixa">🟢 Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reunião">📅 Reunião</SelectItem>
                  <SelectItem value="Técnico">🔧 Técnico</SelectItem>
                  <SelectItem value="Administrativo">📋 Administrativo</SelectItem>
                  <SelectItem value="Financeiro">💰 Financeiro</SelectItem>
                  <SelectItem value="Compras">🛒 Compras</SelectItem>
                  <SelectItem value="Pessoal">👤 Pessoal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NÃO REALIZADO">⏳ Não Realizado</SelectItem>
                <SelectItem value="REALIZADO">✅ Realizado</SelectItem>
                <SelectItem value="Concluído">🎉 Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Responsáveis */}
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
              <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">
                  Selecione quem será notificado. Se nenhum for selecionado, todos receberão.
                </p>
                {adminUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleResponsavel(user.id)}
                  >
                    <Checkbox 
                      checked={responsaveisIds.includes(user.id)}
                      onCheckedChange={() => toggleResponsavel(user.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.nome || user.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.role === 'super_admin' ? 'Super Admin' : 
                         user.role === 'admin' ? 'Admin' :
                         user.role === 'admin_financeiro' ? 'Financeiro' : 'Marketing'}
                      </p>
                    </div>
                    {user.telefone && (
                      <span className="text-xs text-green-600">📱</span>
                    )}
                  </div>
                ))}
                {adminUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Nenhum usuário administrativo encontrado
                  </p>
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
                  <span>Configurar Alertas WhatsApp</span>
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
                {/* Alarme Padrão */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-blue-500" />
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

                {/* Alarme Super Insistente */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <BellRing className="h-4 w-4 text-orange-500" />
                      <span className="font-medium text-sm">Super Insistente</span>
                      <span className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded">
                        ⚡ Intenso
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Envia alertas a cada 5 minutos nos últimos 30 minutos
                    </p>
                  </div>
                  <Switch
                    checked={alarmeInsistente}
                    onCheckedChange={setAlarmeInsistente}
                  />
                </div>

                {!data && !hora && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    ⚠️ Defina data e hora para os alertas funcionarem
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição opcional..."
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
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
              className="bg-blue-600 hover:bg-blue-700"
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
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskModal;
