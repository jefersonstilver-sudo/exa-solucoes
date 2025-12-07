import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Clock, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HorarioFuncionamento {
  inicio: string;
  fim: string;
  herdar_predio: boolean;
}

// Interface flexível para aceitar tanto Device quanto Painel
interface PainelItem {
  id: string;
  name?: string;
  code?: string;
  building_id?: string;
  buildings?: {
    nome: string;
  } | null;
  building?: {
    nome: string;
  } | null;
  horario_funcionamento?: HorarioFuncionamento | null;
}

interface ConfigHorarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paineis: PainelItem[];
  onSuccess?: () => void;
}

export const ConfigHorarioDialog = ({
  open,
  onOpenChange,
  paineis,
  onSuccess
}: ConfigHorarioDialogProps) => {
  const [horarioInicio, setHorarioInicio] = useState('04:00');
  const [horarioFim, setHorarioFim] = useState('00:00');
  const [aplicarTodos, setAplicarTodos] = useState(true);
  const [paineisSelecionados, setPaineisSelecionados] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (aplicarTodos) {
      setPaineisSelecionados(paineis.map(p => p.id));
    }
  }, [aplicarTodos, paineis]);

  const togglePainel = (id: string) => {
    if (aplicarTodos) return;
    setPaineisSelecionados(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (paineisSelecionados.length === 0) {
      toast.error('Selecione pelo menos um painel');
      return;
    }

    setIsSaving(true);
    try {
      const horarioConfig = {
        inicio: horarioInicio,
        fim: horarioFim,
        herdar_predio: false
      };

      const { error } = await supabase
        .from('painels')
        .update({ horario_funcionamento: horarioConfig })
        .in('id', paineisSelecionados);

      if (error) throw error;

      toast.success(`Horário configurado em ${paineisSelecionados.length} painel(is)`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar horário:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  const formatPreview = () => {
    if (horarioInicio === '00:00' && horarioFim === '00:00') {
      return '24 horas (sempre ativo)';
    }
    return `${horarioInicio} às ${horarioFim}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Horário de Funcionamento
          </DialogTitle>
          <DialogDescription>
            Configure o horário em que os painéis devem estar online. 
            Fora desse período, não serão gerados alertas de offline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Horário */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inicio">Início</Label>
                <input
                  id="inicio"
                  type="time"
                  value={horarioInicio}
                  onChange={(e) => setHorarioInicio(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fim">Fim</Label>
                <input
                  id="fim"
                  type="time"
                  value={horarioFim}
                  onChange={(e) => setHorarioFim(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Painéis ativos das <strong>{formatPreview()}</strong>
              </span>
            </div>
          </div>

          {/* Aplicar em todos */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium text-sm">Aplicar em todos os painéis</p>
              <p className="text-xs text-muted-foreground">
                {paineis.length} painéis serão atualizados
              </p>
            </div>
            <Switch
              checked={aplicarTodos}
              onCheckedChange={setAplicarTodos}
            />
          </div>

          {/* Lista de painéis (quando não aplicar todos) */}
          {!aplicarTodos && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <Label>Selecionar painéis</Label>
              {paineis.map(painel => (
                <div
                  key={painel.id}
                  onClick={() => togglePainel(painel.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    paineisSelecionados.includes(painel.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      paineisSelecionados.includes(painel.id)
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}>
                      {paineisSelecionados.includes(painel.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{painel.name || painel.code || painel.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {painel.buildings?.nome || painel.building?.nome || 'Sem prédio'}
                      </p>
                    </div>
                  </div>
                  {painel.horario_funcionamento && (
                    <Badge variant="outline" className="text-[10px]">
                      {painel.horario_funcionamento.inicio}-{painel.horario_funcionamento.fim}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : `Salvar (${paineisSelecionados.length} painéis)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
