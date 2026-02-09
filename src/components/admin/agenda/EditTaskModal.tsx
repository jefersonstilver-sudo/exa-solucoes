import React, { useState, useEffect } from 'react';
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
  MapPin
} from 'lucide-react';
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
    }
  }, [task]);

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
        })
        .eq('id', task.id);
      
      if (error) throw error;
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
              <Label>Tipo de Evento</Label>
              <Select value={tipoEvento} onValueChange={setTipoEvento}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tarefa">✅ Tarefa</SelectItem>
                  <SelectItem value="reuniao">📹 Reunião</SelectItem>
                  <SelectItem value="compromisso">📍 Compromisso</SelectItem>
                  <SelectItem value="aviso">📢 Aviso</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Digite o título..."
                className="h-10"
              />
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
                <Label className="flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5" /> Link da Reunião
                </Label>
                <Input value={linkReuniao} onChange={(e) => setLinkReuniao(e.target.value)} placeholder="https://meet.google.com/..." className="h-10" />
              </div>
            )}
            {tipoEvento === 'compromisso' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Local
                </Label>
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