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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion } from 'framer-motion';
import { Clock, MessageSquare, Users, ChevronDown, ChevronUp, Loader2, Zap, CalendarIcon, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const CONTACT_TYPES = [
  { value: 'lead', label: 'Leads' },
  { value: 'sindico', label: 'Síndicos' },
  { value: 'sindico_lead', label: 'Síndicos Lead' },
  { value: 'tke_supervisor', label: 'Supervisores TKE' },
  { value: 'oriente_supervisor', label: 'Supervisores Oriente' },
  { value: 'ligga_provedor', label: 'Ligga (Provedor)' },
  { value: 'vivo_provedor', label: 'Vivo (Provedor)' },
  { value: 'equipe_exa', label: 'Equipe EXA' },
  { value: 'outros', label: 'Outros' },
];
interface ConfigAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alertTitle: string;
}
const DAYS_OF_WEEK = [{
  value: 'seg',
  label: 'Seg'
}, {
  value: 'ter',
  label: 'Ter'
}, {
  value: 'qua',
  label: 'Qua'
}, {
  value: 'qui',
  label: 'Qui'
}, {
  value: 'sex',
  label: 'Sex'
}, {
  value: 'sab',
  label: 'Sáb'
}, {
  value: 'dom',
  label: 'Dom'
}];
interface Director {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
}
export const ConfigAlertModal = ({
  open,
  onOpenChange,
  alertTitle
}: ConfigAlertModalProps) => {
  const [frequency, setFrequency] = useState('diario');
  const [time, setTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(['seg', 'ter', 'qua', 'qui', 'sex']);
  const [templateType, setTemplateType] = useState<'texto' | 'html'>('texto');
  const [templateContent, setTemplateContent] = useState(`━━━━━━━━━━━━━━━━━━━━

📊 *Relatório de Atendimento*

Olá!

O relatório do período está disponível.

*Resumo:*
• {total_conversas} conversas
• {taxa_resolucao}% resolução
• {tempo_medio} tempo médio

🔗 *Ver relatório completo:*
{link_relatorio}

━━━━━━━━━━━━━━━━━━━━`);
  const [selectedDirectors, setSelectedDirectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  // Estados para Relatório Sob Demanda
  const [demandPeriod, setDemandPeriod] = useState('hoje');
  const [demandStartDate, setDemandStartDate] = useState<Date | undefined>(new Date());
  const [demandEndDate, setDemandEndDate] = useState<Date | undefined>(new Date());
  const [demandFormat, setDemandFormat] = useState<'whatsapp' | 'email'>('whatsapp');
  const [demandSendType, setDemandSendType] = useState<'link' | 'complete'>('link');
  const [demandSelectedDirectors, setDemandSelectedDirectors] = useState<string[]>([]);
  const [demandContactTypes, setDemandContactTypes] = useState<string[]>(['all']); // Todos por padrão
  const [generatingReport, setGeneratingReport] = useState(false);

  // Buscar diretores reais do banco
  useEffect(() => {
    const loadDirectors = async () => {
      const {
        data,
        error
      } = await supabase.from('exa_alerts_directors').select('id, nome, telefone, ativo').eq('ativo', true).order('nome');
      if (data && !error) {
        setDirectors(data);
      }
    };
    if (open) {
      loadDirectors();
    }
  }, [open]);
  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };
  const handleDirectorToggle = (directorId: string) => {
    setSelectedDirectors(prev => prev.includes(directorId) ? prev.filter(id => id !== directorId) : [...prev, directorId]);
  };
  const handleDemandDirectorToggle = (directorId: string) => {
    setDemandSelectedDirectors(prev => 
      prev.includes(directorId) 
        ? prev.filter(id => id !== directorId) 
        : [...prev, directorId]
    );
  };

  const handleContactTypeToggle = (type: string) => {
    if (type === 'all') {
      // Selecionar "Todos" desmarca todos os outros
      setDemandContactTypes(['all']);
    } else {
      // Selecionar específico desmarca "Todos"
      setDemandContactTypes(prev => {
        const filtered = prev.filter(t => t !== 'all');
        return filtered.includes(type) 
          ? filtered.filter(t => t !== type)
          : [...filtered, type];
      });
    }
  };

  const handleGenerateReport = async () => {
    if (demandSelectedDirectors.length === 0) {
      toast.error('Selecione pelo menos um diretor');
      return;
    }

    setGeneratingReport(true);
    try {
      let startDate = new Date();
      let endDate = new Date();

      // Calcular período
      switch (demandPeriod) {
        case 'hoje':
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'ontem':
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case '7dias':
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '30dias':
          startDate.setDate(startDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'custom':
          if (demandStartDate && demandEndDate) {
            startDate = demandStartDate;
            endDate = demandEndDate;
          }
          break;
      }

      // Gerar relatório (passar tipos apenas se não for "all")
      const contactTypesFilter = demandContactTypes.includes('all') 
        ? undefined 
        : demandContactTypes;

      const { data: reportData, error: generateError } = await supabase.functions.invoke(
        'relatorio-var-generate',
        {
          body: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            contact_types: contactTypesFilter,
            agent_key: 'eduardo'
          }
        }
      );

      if (generateError) throw generateError;

      // Enviar relatório
      const { error: sendError } = await supabase.functions.invoke(
        'relatorio-var-send',
        {
          body: {
            report_data: reportData,
            format: demandFormat,
            send_type: demandSendType,
            director_ids: demandSelectedDirectors
          }
        }
      );

      if (sendError) throw sendError;

      toast.success('✅ Relatório gerado e enviado!', {
        description: `Enviado via ${demandFormat === 'whatsapp' ? 'WhatsApp' : 'Email'} para ${demandSelectedDirectors.length} diretor(es)`
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório', {
        description: error instanceof Error ? error.message : 'Tente novamente'
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Salvar configuração real no banco
      const configData = {
        frequency,
        time,
        selectedDays,
        templateType,
        templateContent,
        selectedDirectors,
        updatedAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('exa_alerts_config')
        .upsert({
          config_key: 'relatorio_conversas',
          config_value: configData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'config_key'
        });

      if (error) throw error;

      toast.success('✅ Configuração salva!', {
        description: 'O relatório será enviado conforme programado.'
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[950px] w-[95vw] max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-800/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Configurar {alertTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ============= CONFIGURAÇÕES GERAIS ============= */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-4 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-base text-gray-700 dark:text-gray-300">Configurações Gerais</h3>
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
                    {Array.from({
                    length: 24
                  }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>;
                  })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dias da Semana */}
            <div className="space-y-2">
              <Label className="text-gray-600 dark:text-gray-400">Dias da Semana</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <Badge
                    key={day.value}
                    variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                    className={`cursor-pointer px-4 py-2 transition-all duration-300 ${
                      selectedDays.includes(day.value)
                        ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900'
                        : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
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
              className="space-y-4 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-base text-gray-700 dark:text-gray-300">Template da Mensagem</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isTemplateOpen && <span className="text-xs text-gray-500 truncate max-w-[400px]">
                        Preview: "Relatório de Conversas Total: {'{total_conversas}'}..."
                      </span>}
                    {isTemplateOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-4 pt-3">
                {/* Tipo de Template */}
                <div className="space-y-3">
                  <Label className="text-gray-600 dark:text-gray-400">Tipo de Template</Label>
                  <div className="flex gap-3">
                    <Badge 
                      variant={templateType === 'texto' ? 'default' : 'outline'} 
                      className={`cursor-pointer px-4 py-2 transition-all duration-300 ${
                        templateType === 'texto' 
                          ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900' 
                          : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`} 
                      onClick={() => setTemplateType('texto')}
                    >
                      TEXTO (WhatsApp)
                    </Badge>
                    <Badge 
                      variant={templateType === 'html' ? 'default' : 'outline'} 
                      className={`cursor-pointer px-4 py-2 transition-all duration-300 ${
                        templateType === 'html' 
                          ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900' 
                          : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`} 
                      onClick={() => setTemplateType('html')}
                    >
                      HTML (Email/Web)
                    </Badge>
                  </div>
                </div>

                {/* Editor de Template */}
                <div className="space-y-2">
                  <Label>Conteúdo do Template</Label>
                  <Textarea value={templateContent} onChange={e => setTemplateContent(e.target.value)} rows={8} className="font-mono text-sm bg-white dark:bg-gray-900" placeholder={templateType === 'texto' ? '*Título*\n\nConteúdo com {variaveis}' : '<b>Título</b>\n\n<p>Conteúdo com {variaveis}</p>'} />
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
            className="space-y-4 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-base text-gray-700 dark:text-gray-300">Diretores que Recebem</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {directors.map(director => <div key={director.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                  <Checkbox id={`director-${director.id}`} checked={selectedDirectors.includes(director.id)} onCheckedChange={() => handleDirectorToggle(director.id)} />
                  <Label htmlFor={`director-${director.id}`} className="flex-1 cursor-pointer font-medium text-sm">
                    {director.nome}
                  </Label>
                </div>)}
            </div>

            {directors.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum diretor ativo encontrado
              </p>}
          </motion.div>

          <Separator />

          {/* ============= SOLICITAR RELATÓRIO AGORA (SOB DEMANDA) ============= */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-base text-gray-700 dark:text-gray-300">Solicitar Relatório Agora (Sob Demanda)</h3>
            </div>

            {/* Período */}
            <div className="space-y-2">
              <Label className="text-gray-600 dark:text-gray-400">Período do Relatório</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'hoje', label: 'Hoje' },
                  { value: 'ontem', label: 'Ontem' },
                  { value: '7dias', label: 'Últimos 7 dias' },
                  { value: '30dias', label: 'Últimos 30 dias' },
                  { value: 'custom', label: 'Personalizado' }
                ].map(period => (
                  <Badge
                    key={period.value}
                    variant={demandPeriod === period.value ? 'default' : 'outline'}
                    className={`cursor-pointer px-3 py-2 transition-all duration-300 ${
                      demandPeriod === period.value
                        ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900'
                        : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setDemandPeriod(period.value)}
                  >
                    {period.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Filtrar por Tipo de Contato */}
            <div className="space-y-3">
              <Label className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtrar por Tipo de Contato
              </Label>
              
              {/* Botão "Todos" destacado */}
              <div className="flex gap-2">
                <Badge
                  variant={demandContactTypes.includes('all') ? 'default' : 'outline'}
                  className={`cursor-pointer px-4 py-2.5 transition-all duration-300 font-medium ${
                    demandContactTypes.includes('all')
                      ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900 shadow-sm'
                      : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleContactTypeToggle('all')}
                >
                  Todos
                </Badge>
              </div>

              {/* Tipos específicos */}
              <div className="flex flex-wrap gap-2">
                {CONTACT_TYPES.map(type => (
                  <Badge
                    key={type.value}
                    variant={demandContactTypes.includes(type.value) ? 'default' : 'outline'}
                    className={`cursor-pointer px-3 py-2 transition-all duration-300 ${
                      demandContactTypes.includes(type.value)
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                        : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleContactTypeToggle(type.value)}
                  >
                    {type.label}
                  </Badge>
                ))}
              </div>
              
              {!demandContactTypes.includes('all') && demandContactTypes.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">Selecione tipos específicos ou use "Todos"</p>
              )}
            </div>

            {/* Date Pickers para período custom */}
            {demandPeriod === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {demandStartDate ? format(demandStartDate, 'dd/MM/yyyy') : 'Selecione'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={demandStartDate}
                        onSelect={setDemandStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {demandEndDate ? format(demandEndDate, 'dd/MM/yyyy') : 'Selecione'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={demandEndDate}
                        onSelect={setDemandEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Formato de Envio */}
            <div className="space-y-2">
              <Label className="text-gray-600 dark:text-gray-400">Formato de Envio</Label>
              <div className="flex gap-3 flex-wrap">
                <Badge
                  variant={demandFormat === 'whatsapp' ? 'default' : 'outline'}
                  className={`cursor-pointer px-4 py-2 transition-all duration-300 ${
                    demandFormat === 'whatsapp'
                      ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900'
                      : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setDemandFormat('whatsapp')}
                >
                  WhatsApp
                </Badge>
                <Badge
                  variant={demandFormat === 'email' ? 'default' : 'outline'}
                  className={`cursor-pointer px-4 py-2 transition-all duration-300 ${
                    demandFormat === 'email'
                      ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900'
                      : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setDemandFormat('email')}
                >
                  Email
                </Badge>
              </div>
            </div>

            {/* Tipo de Envio (Link ou Completo) */}
            {demandFormat === 'whatsapp' && (
              <div className="space-y-2">
                <Label className="text-gray-600 dark:text-gray-400">Tipo de Mensagem</Label>
                <div className="flex gap-3">
                  <Badge
                    variant={demandSendType === 'link' ? 'default' : 'outline'}
                    className={`cursor-pointer px-4 py-2 transition-all duration-300 ${
                      demandSendType === 'link'
                        ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900'
                        : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setDemandSendType('link')}
                  >
                    Notificação com Link
                  </Badge>
                  <Badge
                    variant={demandSendType === 'complete' ? 'default' : 'outline'}
                    className={`cursor-pointer px-4 py-2 transition-all duration-300 ${
                      demandSendType === 'complete'
                        ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900'
                        : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setDemandSendType('complete')}
                  >
                    Relatório Completo
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {demandSendType === 'link' 
                    ? 'Envia mensagem elegante com resumo e link para visualização completa' 
                    : 'Envia relatório completo diretamente no WhatsApp'}
                </p>
              </div>
            )}

            {/* Diretores que receberão */}
            <div className="space-y-2">
              <Label>Diretores que Receberão</Label>
              <div className="grid grid-cols-2 gap-3">
                {directors.map(director => (
                  <div
                    key={director.id}
                    className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                  >
                    <Checkbox
                      id={`demand-director-${director.id}`}
                      checked={demandSelectedDirectors.includes(director.id)}
                      onCheckedChange={() => handleDemandDirectorToggle(director.id)}
                    />
                    <Label
                      htmlFor={`demand-director-${director.id}`}
                      className="flex-1 cursor-pointer font-medium text-sm"
                    >
                      {director.nome}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Botão de Gerar */}
            <Button
              onClick={handleGenerateReport}
              disabled={generatingReport || demandSelectedDirectors.length === 0}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-12 shadow-sm hover:shadow-md transition-all"
            >
              {generatingReport ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Relatório...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Gerar e Enviar Relatório Agora
                </>
              )}
            </Button>
          </motion.div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-lg">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || selectedDirectors.length === 0} className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-sm hover:shadow-md transition-all">
            {loading ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};