import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Clock, User, Phone, Send, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPhoneNumber, extractRawPhone, isValidPhoneNumber } from '@/utils/phoneUtils';

interface DailySummaryConfig {
  ativo: boolean;
  horarios: string[];
  contatos: { id?: string; nome: string; telefone: string }[];
}

const DEFAULT_CONFIG: DailySummaryConfig = {
  ativo: false,
  horarios: ['08:00'],
  contatos: [],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DailySummaryConfigModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<DailySummaryConfig>(DEFAULT_CONFIG);
  const [newTime, setNewTime] = useState('');
  const [manualNome, setManualNome] = useState('');
  const [manualTelefone, setManualTelefone] = useState('');

  // Load saved config
  const { data: savedConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ['daily-summary-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exa_alerts_config')
        .select('config_value')
        .eq('config_key', 'agenda_resumo_diario')
        .maybeSingle();
      if (error) throw error;
      if (!data?.config_value) return DEFAULT_CONFIG;
      const val = typeof data.config_value === 'string' ? JSON.parse(data.config_value) : data.config_value;
      return val as DailySummaryConfig;
    },
    enabled: open,
  });

  // Load available directors
  const { data: directors = [] } = useQuery({
    queryKey: ['exa-alerts-directors-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exa_alerts_directors')
        .select('id, nome, telefone')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  useEffect(() => {
    if (savedConfig) setConfig(savedConfig);
  }, [savedConfig]);

  const saveMutation = useMutation({
    mutationFn: async (value: DailySummaryConfig) => {
      const { error } = await supabase
        .from('exa_alerts_config')
        .upsert({
          config_key: 'agenda_resumo_diario',
          config_value: value as any,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'config_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configuração salva!');
      queryClient.invalidateQueries({ queryKey: ['daily-summary-config'] });
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const handleSave = () => saveMutation.mutate(config);

  const addTime = () => {
    if (!newTime || config.horarios.includes(newTime)) return;
    setConfig(prev => ({ ...prev, horarios: [...prev.horarios, newTime].sort() }));
    setNewTime('');
  };

  const removeTime = (t: string) => {
    setConfig(prev => ({ ...prev, horarios: prev.horarios.filter(h => h !== t) }));
  };

  const toggleDirector = (dir: { id: string; nome: string; telefone: string }) => {
    const exists = config.contatos.some(c => c.id === dir.id);
    if (exists) {
      setConfig(prev => ({ ...prev, contatos: prev.contatos.filter(c => c.id !== dir.id) }));
    } else {
      setConfig(prev => ({ ...prev, contatos: [...prev.contatos, { id: dir.id, nome: dir.nome, telefone: dir.telefone }] }));
    }
  };

  const addManualContact = () => {
    if (!manualNome.trim() || !manualTelefone.trim()) {
      toast.error('Preencha nome e telefone');
      return;
    }
    if (!isValidPhoneNumber(manualTelefone)) {
      toast.error('Telefone inválido');
      return;
    }
    const raw = extractRawPhone(manualTelefone);
    if (config.contatos.some(c => extractRawPhone(c.telefone) === raw)) {
      toast.error('Contato já adicionado');
      return;
    }
    setConfig(prev => ({ ...prev, contatos: [...prev.contatos, { nome: manualNome.trim(), telefone: raw }] }));
    setManualNome('');
    setManualTelefone('');
  };

  const removeContact = (idx: number) => {
    setConfig(prev => ({ ...prev, contatos: prev.contatos.filter((_, i) => i !== idx) }));
  };

  const content = (
    <div className="space-y-6 p-1">
      {/* Toggle ativo */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Resumo diário ativo</Label>
          <p className="text-xs text-muted-foreground">Envia um resumo de todas as tarefas do dia via WhatsApp</p>
        </div>
        <Switch checked={config.ativo} onCheckedChange={(v) => setConfig(prev => ({ ...prev, ativo: v }))} />
      </div>

      <Separator />

      {/* Horários */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Horários de envio
        </Label>
        <div className="flex flex-wrap gap-2">
          {config.horarios.map(h => (
            <div key={h} className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md text-sm">
              <span>{h}</span>
              <button onClick={() => removeTime(h)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-32" />
          <Button variant="outline" size="sm" onClick={addTime} disabled={!newTime}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
          </Button>
        </div>
      </div>

      <Separator />

      {/* Contatos existentes */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" /> Contatos cadastrados
        </Label>
        {directors.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum contato ativo encontrado</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {directors.map(dir => (
              <label key={dir.id} className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={config.contatos.some(c => c.id === dir.id)}
                  onCheckedChange={() => toggleDirector(dir)}
                />
                <span>{dir.nome}</span>
                <span className="text-xs text-muted-foreground">{formatPhoneNumber(dir.telefone)}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Adicionar manual */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5" /> Adicionar número manual
        </Label>
        <div className="flex gap-2">
          <Input placeholder="Nome" value={manualNome} onChange={e => setManualNome(e.target.value)} className="flex-1" />
          <Input placeholder="Telefone" value={manualTelefone} onChange={e => setManualTelefone(e.target.value)} className="w-36" />
          <Button variant="outline" size="icon" onClick={addManualContact} className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lista de contatos selecionados */}
      {config.contatos.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Contatos selecionados ({config.contatos.length})</Label>
          <div className="space-y-1">
            {config.contatos.map((c, i) => (
              <div key={i} className="flex items-center justify-between bg-muted/50 px-2.5 py-1.5 rounded-md text-sm">
                <span>{c.nome} — <span className="text-muted-foreground text-xs">{formatPhoneNumber(c.telefone)}</span></span>
                <button onClick={() => removeContact(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Salvar */}
      <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full">
        {saveMutation.isPending ? 'Salvando...' : 'Salvar configuração'}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Resumo Diário
            </DrawerTitle>
            <DrawerDescription>Configure o envio automático de resumos diários das tarefas</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Resumo Diário
          </DialogTitle>
          <DialogDescription>Configure o envio automático de resumos diários das tarefas</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default DailySummaryConfigModal;
