import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, Settings, Send, FileText, Building2, FileCheck, Wifi } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ConfigRelatorioOperacionalModal } from './ConfigRelatorioOperacionalModal';

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

const defaultConfig: RelatorioConfig = {
  ativo: false,
  time: '07:00',
  selectedDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
  selectedDirectors: [],
  sections: {
    tarefas_hoje: true,
    tarefas_sem_agendamento: true,
    predios_sem_agendamento: true,
    propostas: true,
    status_paineis: true
  }
};

export const RelatorioOperacionalCard = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [config, setConfig] = useState<RelatorioConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('exa_alerts_config')
        .select('config_value')
        .eq('config_key', 'relatorio_operacional')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading config:', error);
        return;
      }

      if (data?.config_value) {
        setConfig(data.config_value as unknown as RelatorioConfig);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (checked: boolean) => {
    try {
      const newConfig = { ...config, ativo: checked };
      
      const { error } = await supabase
        .from('exa_alerts_config')
        .upsert([{
          config_key: 'relatorio_operacional',
          config_value: JSON.parse(JSON.stringify(newConfig)),
          updated_at: new Date().toISOString()
        }], { onConflict: 'config_key' });

      if (error) throw error;

      setConfig(newConfig);
      toast.success(checked ? 'Relatório ativado' : 'Relatório desativado');
    } catch (error) {
      console.error('Error toggling config:', error);
      toast.error('Erro ao atualizar configuração');
    }
  };

  const sendNow = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('relatorio-operacional-generate', {
        body: { sendNow: true }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Relatório enviado com sucesso!');
      } else {
        toast.error(data?.error || 'Erro ao enviar relatório');
      }
    } catch (error) {
      console.error('Error sending report:', error);
      toast.error('Erro ao enviar relatório');
    } finally {
      setSending(false);
    }
  };

  const activeSections = config.sections ? Object.values(config.sections).filter(Boolean).length : 0;

  const getDayLabel = (day: string) => {
    const labels: Record<string, string> = {
      seg: 'Seg',
      ter: 'Ter',
      qua: 'Qua',
      qui: 'Qui',
      sex: 'Sex',
      sab: 'Sáb',
      dom: 'Dom'
    };
    return labels[day] || day;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="group bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md border-2 border-blue-500/30 dark:border-blue-500/30 hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-xl lg:rounded-2xl transition-all cursor-pointer hover:shadow-xl shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                <span className="text-xl md:text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                  Relatório Operacional Diário
                </h3>
                <p className="text-xs text-muted-foreground">
                  Resumo diário de tarefas, prédios, propostas e painéis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {config.ativo && (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-gradient-to-r from-blue-500/10 to-blue-700/10 border-blue-500/30 hidden sm:inline-flex"
                >
                  ⏰ {config.time}
                </Badge>
              )}
              <Switch 
                checked={config.ativo} 
                onCheckedChange={toggleActive}
                onClick={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-700"
              />
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="space-y-4 pt-0" onClick={(e) => e.stopPropagation()}>
              {/* Sections Preview */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  📋 Seções do Relatório ({activeSections} ativas)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div className={`flex items-center gap-2 p-2 rounded-lg border ${config.sections?.tarefas_hoje ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/30 border-muted'}`}>
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">Tarefas Hoje</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded-lg border ${config.sections?.tarefas_sem_agendamento ? 'bg-orange-500/10 border-orange-500/30' : 'bg-muted/30 border-muted'}`}>
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">Sem Agenda</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded-lg border ${config.sections?.predios_sem_agendamento ? 'bg-purple-500/10 border-purple-500/30' : 'bg-muted/30 border-muted'}`}>
                    <Building2 className="w-4 h-4" />
                    <span className="text-xs">Prédios</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded-lg border ${config.sections?.propostas ? 'bg-blue-500/10 border-blue-500/30' : 'bg-muted/30 border-muted'}`}>
                    <FileCheck className="w-4 h-4" />
                    <span className="text-xs">Propostas</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded-lg border ${config.sections?.status_paineis ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-muted/30 border-muted'}`}>
                    <Wifi className="w-4 h-4" />
                    <span className="text-xs">Painéis</span>
                  </div>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>📅</span>
                <span>
                  {config.selectedDays?.length > 0 
                    ? config.selectedDays.map(d => getDayLabel(d)).join(', ')
                    : 'Nenhum dia selecionado'}
                </span>
                <span>•</span>
                <span>⏰ {config.time}</span>
                <span>•</span>
                <span>👥 {config.selectedDirectors?.length || 0} destinatários</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfigModalOpen(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 hover:opacity-90"
                  onClick={sendNow}
                  disabled={sending || config.selectedDirectors?.length === 0}
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Agora
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </motion.div>
        )}
      </Card>

      {/* Config Modal */}
      <ConfigRelatorioOperacionalModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        config={config}
        onConfigChange={(newConfig) => {
          setConfig(newConfig);
        }}
      />
    </motion.div>
  );
};
