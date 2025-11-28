import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion } from 'framer-motion';
import { Clock, MessageSquare, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ConfigAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alertTitle: string;
}

const DAYS_OF_WEEK = [
  { value: 'seg', label: 'Seg' },
  { value: 'ter', label: 'Ter' },
  { value: 'qua', label: 'Qua' },
  { value: 'qui', label: 'Qui' },
  { value: 'sex', label: 'Sex' },
  { value: 'sab', label: 'Sáb' },
  { value: 'dom', label: 'Dom' },
];

interface Director {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
}

export const ConfigAlertModal = ({ open, onOpenChange, alertTitle }: ConfigAlertModalProps) => {
  const [frequency, setFrequency] = useState('diario');
  const [time, setTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(['seg', 'ter', 'qua', 'qui', 'sex']);
  const [templateType, setTemplateType] = useState<'texto' | 'html'>('texto');
  const [templateContent, setTemplateContent] = useState(
    `📊 *Relatório de Conversas*\n\nTotal: {total_conversas}\nResolvidas: {resolvidas}\nPendentes: {pendentes}\n\n⏱ Tempo médio: {tempo_medio}`
  );
  const [selectedDirectors, setSelectedDirectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  // Buscar diretores reais do banco
  useEffect(() => {
    const loadDirectors = async () => {
      const { data, error } = await supabase
        .from('exa_alerts_directors')
        .select('id, nome, telefone, ativo')
        .eq('ativo', true)
        .order('nome');

      if (data && !error) {
        setDirectors(data);
      }
    };

    if (open) {
      loadDirectors();
    }
  }, [open]);

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleDirectorToggle = (directorId: string) => {
    setSelectedDirectors((prev) =>
      prev.includes(directorId) ? prev.filter((id) => id !== directorId) : [...prev, directorId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simular save
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success('Configuração salva com sucesso!', {
        description: 'O alerta foi configurado e será enviado conforme definido.'
      });
      
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[950px] w-[95vw] max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-2">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            📊 Configurar {alertTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ============= CONFIGURAÇÕES GERAIS ============= */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border-2 border-blue-200 dark:border-blue-900"
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-base">⚙️ Configurações Gerais</h3>
            </div>

            {/* Frequência e Horário */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="bg-white dark:bg-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Horário</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="bg-white dark:bg-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dias da Semana */}
            <div className="space-y-3">
              <Label>Dias da Semana</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Badge
                    key={day.value}
                    variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                    className={`cursor-pointer px-3 py-2 transition-all ${
                      selectedDays.includes(day.value)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'hover:bg-blue-100 dark:hover:bg-blue-950'
                    }`}
                    onClick={() => handleDayToggle(day.value)}
                  >
                    {day.label}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>

          <Separator />

          {/* ============= TEMPLATE DA MENSAGEM (COLAPSÁVEL) ============= */}
          <Collapsible open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4 p-5 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl border-2 border-green-200 dark:border-green-900"
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-bold text-base">📝 Template da Mensagem</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isTemplateOpen && (
                      <span className="text-xs text-muted-foreground truncate max-w-[400px]">
                        Preview: "📊 *Relatório de Conversas* Total: {'{total_conversas}'}..."
                      </span>
                    )}
                    {isTemplateOpen ? (
                      <ChevronUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-4 pt-3">
                {/* Tipo de Template */}
                <div className="space-y-3">
                  <Label>Tipo de Template</Label>
                  <div className="flex gap-3">
                    <Badge
                      variant={templateType === 'texto' ? 'default' : 'outline'}
                      className={`cursor-pointer px-4 py-2 transition-all ${
                        templateType === 'texto'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'hover:bg-green-100 dark:hover:bg-green-950'
                      }`}
                      onClick={() => setTemplateType('texto')}
                    >
                      📱 TEXTO (WhatsApp)
                    </Badge>
                    <Badge
                      variant={templateType === 'html' ? 'default' : 'outline'}
                      className={`cursor-pointer px-4 py-2 transition-all ${
                        templateType === 'html'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'hover:bg-green-100 dark:hover:bg-green-950'
                      }`}
                      onClick={() => setTemplateType('html')}
                    >
                      📧 HTML (Email/Web)
                    </Badge>
                  </div>
                </div>

                {/* Editor de Template */}
                <div className="space-y-2">
                  <Label>Conteúdo do Template</Label>
                  <Textarea
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    rows={8}
                    className="font-mono text-sm bg-white dark:bg-gray-900"
                    placeholder={
                      templateType === 'texto'
                        ? '*Título*\n\nConteúdo com {variaveis}'
                        : '<b>Título</b>\n\n<p>Conteúdo com {variaveis}</p>'
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Variáveis disponíveis:</span> {'{total_conversas}'}, {'{resolvidas}'}, {'{pendentes}'}, {'{tempo_medio}'}
                  </p>
                </div>
              </CollapsibleContent>
            </motion.div>
          </Collapsible>

          <Separator />

          {/* ============= DIRETORES ============= */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 p-5 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl border-2 border-purple-200 dark:border-purple-900"
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-base">👤 Diretores que Recebem</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {directors.map((director) => (
                <div
                  key={director.id}
                  className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                >
                  <Checkbox
                    id={`director-${director.id}`}
                    checked={selectedDirectors.includes(director.id)}
                    onCheckedChange={() => handleDirectorToggle(director.id)}
                  />
                  <Label
                    htmlFor={`director-${director.id}`}
                    className="flex-1 cursor-pointer font-medium text-sm"
                  >
                    {director.nome}
                  </Label>
                </div>
              ))}
            </div>

            {directors.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum diretor ativo encontrado
              </p>
            )}
          </motion.div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-lg"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || selectedDirectors.length === 0}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg"
          >
            {loading ? 'Salvando...' : '💾 Salvar Configuração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};