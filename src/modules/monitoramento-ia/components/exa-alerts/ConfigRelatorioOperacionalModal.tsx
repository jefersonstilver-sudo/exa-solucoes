import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Clock, Calendar, Users, FileText, Building2, FileCheck, Wifi } from 'lucide-react';

interface RelatorioConfig {
  ativo: boolean;
  time: string;
  selectedDays: string[];
  selectedDirectors: string[];
  sections: {
    tarefas_hoje: boolean;
    tarefas_sem_agendamento: boolean;
    predios_sem_agendamento: boolean;
    propostas: boolean;
    status_paineis: boolean;
  };
}

interface Director {
  id: string;
  nome: string;
  telefone: string;
  cargo?: string;
  avatar_url?: string;
  ativo: boolean;
}

interface ConfigRelatorioOperacionalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: RelatorioConfig;
  onConfigChange: (config: RelatorioConfig) => void;
}

const DAYS_OF_WEEK = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
];

const SECTIONS = [
  { key: 'tarefas_hoje', label: 'Tarefas do Dia', icon: FileText, color: 'green', description: 'Tarefas agendadas para hoje' },
  { key: 'tarefas_sem_agendamento', label: 'Tarefas Sem Agendamento', icon: FileText, color: 'orange', description: 'Tarefas pendentes sem data definida' },
  { key: 'predios_sem_agendamento', label: 'Prédios Aguardando', icon: Building2, color: 'purple', description: 'Prédios com status de trabalho sem data' },
  { key: 'propostas', label: 'Propostas', icon: FileCheck, color: 'blue', description: 'Propostas pendentes, expiradas e atualizadas' },
  { key: 'status_paineis', label: 'Status dos Painéis', icon: Wifi, color: 'cyan', description: 'Dispositivos online e offline' },
];

export const ConfigRelatorioOperacionalModal = ({
  open,
  onOpenChange,
  config,
  onConfigChange
}: ConfigRelatorioOperacionalModalProps) => {
  const [localConfig, setLocalConfig] = useState<RelatorioConfig>(config);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalConfig(config);
      loadDirectors();
    }
  }, [open, config]);

  const loadDirectors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exa_alerts_directors')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setDirectors(data || []);
    } catch (error) {
      console.error('Error loading directors:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    const newDays = localConfig.selectedDays.includes(day)
      ? localConfig.selectedDays.filter(d => d !== day)
      : [...localConfig.selectedDays, day];
    setLocalConfig({ ...localConfig, selectedDays: newDays });
  };

  const toggleDirector = (directorId: string) => {
    const newDirectors = localConfig.selectedDirectors.includes(directorId)
      ? localConfig.selectedDirectors.filter(d => d !== directorId)
      : [...localConfig.selectedDirectors, directorId];
    setLocalConfig({ ...localConfig, selectedDirectors: newDirectors });
  };

  const toggleSection = (sectionKey: string) => {
    setLocalConfig({
      ...localConfig,
      sections: {
        ...localConfig.sections,
        [sectionKey]: !localConfig.sections[sectionKey as keyof typeof localConfig.sections]
      }
    });
  };

  const selectAllDirectors = () => {
    setLocalConfig({
      ...localConfig,
      selectedDirectors: directors.map(d => d.id)
    });
  };

  const deselectAllDirectors = () => {
    setLocalConfig({
      ...localConfig,
      selectedDirectors: []
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('exa_alerts_config')
        .upsert([{
          config_key: 'relatorio_operacional',
          config_value: JSON.parse(JSON.stringify(localConfig)),
          updated_at: new Date().toISOString()
        }], { onConflict: 'config_key' });

      if (error) throw error;

      onConfigChange(localConfig);
      toast.success('Configuração salva com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Configurar Relatório Operacional
          </DialogTitle>
          <DialogDescription>
            Configure horário, dias, destinatários e seções do relatório diário
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Horário */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <Label className="font-semibold">Horário de Envio</Label>
              </div>
              <Input
                type="time"
                value={localConfig.time}
                onChange={(e) => setLocalConfig({ ...localConfig, time: e.target.value })}
                className="w-32"
              />
            </div>

            {/* Dias da Semana */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <Label className="font-semibold">Dias da Semana</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.key}
                    type="button"
                    variant={localConfig.selectedDays.includes(day.key) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDay(day.key)}
                    className={localConfig.selectedDays.includes(day.key) 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-700' 
                      : ''}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Seções */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-500" />
                <Label className="font-semibold">Seções do Relatório</Label>
              </div>
              <div className="grid gap-3">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = localConfig.sections[section.key as keyof typeof localConfig.sections];
                  return (
                    <div
                      key={section.key}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                        isActive 
                          ? `bg-${section.color}-500/10 border-${section.color}-500/30` 
                          : 'bg-muted/30 border-muted'
                      }`}
                      onClick={() => toggleSection(section.key)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? `text-${section.color}-500` : 'text-muted-foreground'}`} />
                        <div>
                          <p className="font-medium text-sm">{section.label}</p>
                          <p className="text-xs text-muted-foreground">{section.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => toggleSection(section.key)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Destinatários */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-500" />
                  <Label className="font-semibold">Destinatários</Label>
                  <span className="text-xs text-muted-foreground">
                    ({localConfig.selectedDirectors.length} selecionados)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAllDirectors}
                  >
                    Todos
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={deselectAllDirectors}
                  >
                    Nenhum
                  </Button>
                </div>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : directors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum diretor cadastrado. Adicione diretores no Alerta CEO.
                </div>
              ) : (
                <div className="grid gap-2">
                  {directors.map((director) => {
                    const isSelected = localConfig.selectedDirectors.includes(director.id);
                    return (
                      <div
                        key={director.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border-primary/30' : 'bg-muted/30 border-muted hover:bg-muted/50'
                        }`}
                        onClick={() => toggleDirector(director.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleDirector(director.id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={director.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs">
                            {director.nome?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{director.nome}</p>
                          <p className="text-xs text-muted-foreground">{director.telefone}</p>
                        </div>
                        {director.cargo && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {director.cargo}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-500 to-blue-700 hover:opacity-90"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configuração
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
