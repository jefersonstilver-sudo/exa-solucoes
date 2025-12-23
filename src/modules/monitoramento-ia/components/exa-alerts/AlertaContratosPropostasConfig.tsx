import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FileText, 
  Clock, 
  Bell, 
  Plus, 
  Trash2, 
  Save, 
  Settings2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Send,
  Phone,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AlertConfig {
  id: string;
  ativo: boolean;
  horarios_envio: string[];
  dias_semana: string[];
  alerta_propostas_pendentes: boolean;
  alerta_contratos_pendentes: boolean;
  alerta_propostas_expirando: boolean;
  template_propostas: string;
  template_contratos: string;
}

const defaultConfig: Omit<AlertConfig, 'id'> = {
  ativo: true,
  horarios_envio: ['09:00', '12:00', '15:00'],
  dias_semana: ['seg', 'ter', 'qua', 'qui', 'sex'],
  alerta_propostas_pendentes: true,
  alerta_contratos_pendentes: true,
  alerta_propostas_expirando: true,
  template_propostas: '📊 *Relatório Comercial*\n\n⏳ {{pending_count}} propostas aguardando resposta há mais de 24h\n\n📋 Detalhes disponíveis no painel administrativo.',
  template_contratos: '📝 *Contratos Pendentes*\n\n✍️ {{unsigned_count}} contratos aguardando assinatura\n\n📋 Verifique o painel jurídico para mais detalhes.'
};

const diasSemana = [
  { id: 'seg', label: 'Seg' },
  { id: 'ter', label: 'Ter' },
  { id: 'qua', label: 'Qua' },
  { id: 'qui', label: 'Qui' },
  { id: 'sex', label: 'Sex' },
  { id: 'sab', label: 'Sáb' },
  { id: 'dom', label: 'Dom' },
];

export const AlertaContratosPropostasConfig: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [newHorario, setNewHorario] = useState('');
  
  // Test module state
  const [testPhone, setTestPhone] = useState('');
  const [testTemplateType, setTestTemplateType] = useState<'propostas' | 'contratos'>('propostas');
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('commercial_alerts_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configuração:', error);
        throw error;
      }

      if (data) {
        setConfig({
          id: data.id,
          ativo: data.ativo ?? true,
          horarios_envio: (data.horarios_envio as string[]) || defaultConfig.horarios_envio,
          dias_semana: (data.dias_semana as string[]) || defaultConfig.dias_semana,
          alerta_propostas_pendentes: data.alerta_propostas_pendentes ?? true,
          alerta_contratos_pendentes: data.alerta_contratos_pendentes ?? true,
          alerta_propostas_expirando: data.alerta_propostas_expirando ?? true,
          template_propostas: data.template_propostas || defaultConfig.template_propostas,
          template_contratos: data.template_contratos || defaultConfig.template_contratos,
        });
      } else {
        const { data: newData, error: insertError } = await supabase
          .from('commercial_alerts_config')
          .insert([{
            ativo: defaultConfig.ativo,
            horarios_envio: defaultConfig.horarios_envio,
            dias_semana: defaultConfig.dias_semana,
            alerta_propostas_pendentes: defaultConfig.alerta_propostas_pendentes,
            alerta_contratos_pendentes: defaultConfig.alerta_contratos_pendentes,
            alerta_propostas_expirando: defaultConfig.alerta_propostas_expirando,
            template_propostas: defaultConfig.template_propostas,
            template_contratos: defaultConfig.template_contratos,
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Erro ao criar configuração:', insertError);
        } else if (newData) {
          setConfig({
            id: newData.id,
            ativo: newData.ativo ?? true,
            horarios_envio: (newData.horarios_envio as string[]) || defaultConfig.horarios_envio,
            dias_semana: (newData.dias_semana as string[]) || defaultConfig.dias_semana,
            alerta_propostas_pendentes: newData.alerta_propostas_pendentes ?? true,
            alerta_contratos_pendentes: newData.alerta_contratos_pendentes ?? true,
            alerta_propostas_expirando: newData.alerta_propostas_expirando ?? true,
            template_propostas: newData.template_propostas || defaultConfig.template_propostas,
            template_contratos: newData.template_contratos || defaultConfig.template_contratos,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('commercial_alerts_config')
        .update({
          ativo: config.ativo,
          horarios_envio: config.horarios_envio,
          dias_semana: config.dias_semana,
          alerta_propostas_pendentes: config.alerta_propostas_pendentes,
          alerta_contratos_pendentes: config.alerta_contratos_pendentes,
          alerta_propostas_expirando: config.alerta_propostas_expirando,
          template_propostas: config.template_propostas,
          template_contratos: config.template_contratos,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const addHorario = () => {
    if (!newHorario || !config) return;
    
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(newHorario)) {
      toast.error('Formato inválido. Use HH:MM');
      return;
    }

    if (config.horarios_envio.includes(newHorario)) {
      toast.error('Este horário já foi adicionado');
      return;
    }

    setConfig({
      ...config,
      horarios_envio: [...config.horarios_envio, newHorario].sort()
    });
    setNewHorario('');
    toast.success('Horário adicionado');
  };

  const removeHorario = (horario: string) => {
    if (!config) return;
    if (config.horarios_envio.length <= 1) {
      toast.error('Deve haver pelo menos um horário');
      return;
    }
    setConfig({
      ...config,
      horarios_envio: config.horarios_envio.filter(h => h !== horario)
    });
  };

  const toggleDia = (dia: string) => {
    if (!config) return;
    const newDias = config.dias_semana.includes(dia)
      ? config.dias_semana.filter(d => d !== dia)
      : [...config.dias_semana, dia];
    
    if (newDias.length === 0) {
      toast.error('Selecione pelo menos um dia');
      return;
    }
    
    setConfig({ ...config, dias_semana: newDias });
  };

  const sendTestAlert = async () => {
    if (!testPhone.trim()) {
      toast.error('Informe o número de telefone');
      return;
    }

    // Validar formato do telefone
    const cleanPhone = testPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      toast.error('Número de telefone inválido');
      return;
    }

    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-commercial-alerts', {
        body: {
          testMode: true,
          testPhone: cleanPhone,
          templateType: testTemplateType
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Alerta de teste enviado com sucesso!');
      } else {
        toast.error(data?.message || 'Erro ao enviar teste');
      }
    } catch (error: any) {
      console.error('Erro ao enviar teste:', error);
      toast.error('Erro ao enviar alerta de teste');
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md border-2 border-amber-500/30 rounded-xl">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="group bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md border-2 border-amber-500/30 dark:border-amber-500/30 hover:border-amber-500/50 dark:hover:border-amber-500/50 rounded-xl lg:rounded-2xl transition-all cursor-pointer hover:shadow-xl shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  Alertas de Propostas & Contratos
                </h3>
                <p className="text-xs text-muted-foreground">
                  Lembretes automáticos diários
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {config?.ativo ? (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 text-green-600 hidden sm:inline-flex"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
              ) : (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 hidden sm:inline-flex"
                >
                  Desativado
                </Badge>
              )}
              <Switch 
                checked={config?.ativo ?? false}
                onCheckedChange={(checked) => {
                  if (config) setConfig({ ...config, ativo: checked });
                }}
                onClick={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-500"
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
              
              {/* Configurações Section */}
              <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <CollapsibleTrigger 
                  className="flex items-center justify-between w-full p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-sm">Configurações</span>
                  </div>
                  {isConfigOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-4 space-y-4">
                  {/* Horários de Envio */}
                  <div className="space-y-3 p-4 bg-white/60 dark:bg-neutral-800/40 rounded-xl border border-white/50 dark:border-white/10">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4 text-amber-500" />
                      Horários de Envio (Brasília)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {config?.horarios_envio.map((horario) => (
                        <Badge 
                          key={horario} 
                          className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm px-3 py-1 flex items-center gap-2"
                        >
                          {horario}
                          <button
                            onClick={() => removeHorario(horario)}
                            className="hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={newHorario}
                        onChange={(e) => setNewHorario(e.target.value)}
                        className="w-32"
                        placeholder="HH:MM"
                      />
                      <Button variant="outline" size="sm" onClick={addHorario} className="border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  {/* Dias da Semana */}
                  <div className="space-y-3 p-4 bg-white/60 dark:bg-neutral-800/40 rounded-xl border border-white/50 dark:border-white/10">
                    <Label className="text-sm font-medium">Dias de Envio</Label>
                    <div className="flex flex-wrap gap-2">
                      {diasSemana.map((dia) => (
                        <button
                          key={dia.id}
                          onClick={() => toggleDia(dia.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            config?.dias_semana.includes(dia.id)
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                              : 'bg-white/60 dark:bg-neutral-800/60 text-muted-foreground hover:bg-amber-100 dark:hover:bg-amber-900/20'
                          }`}
                        >
                          {dia.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tipos de Alerta */}
                  <div className="space-y-3 p-4 bg-white/60 dark:bg-neutral-800/40 rounded-xl border border-white/50 dark:border-white/10">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Bell className="h-4 w-4 text-amber-500" />
                      Tipos de Alerta
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={config?.alerta_propostas_pendentes ?? false}
                            onCheckedChange={(checked) => 
                              config && setConfig({ ...config, alerta_propostas_pendentes: !!checked })
                            }
                          />
                          <Label className="text-sm cursor-pointer">Propostas não aceitas ({'>'}24h)</Label>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-amber-500/30">
                          <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                          Destinatários
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={config?.alerta_contratos_pendentes ?? false}
                            onCheckedChange={(checked) => 
                              config && setConfig({ ...config, alerta_contratos_pendentes: !!checked })
                            }
                          />
                          <Label className="text-sm cursor-pointer">Contratos não assinados ({'>'}48h)</Label>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-amber-500/30">
                          <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                          Signatários
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={config?.alerta_propostas_expirando ?? false}
                            onCheckedChange={(checked) => 
                              config && setConfig({ ...config, alerta_propostas_expirando: !!checked })
                            }
                          />
                          <Label className="text-sm cursor-pointer">Propostas prestes a expirar (24h antes)</Label>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-blue-500/30">
                          <Clock className="h-3 w-3 mr-1 text-blue-500" />
                          Preventivo
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Templates Section */}
              <Collapsible open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
                <CollapsibleTrigger 
                  className="flex items-center justify-between w-full p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-sm">Templates de Mensagem</span>
                  </div>
                  {isTemplatesOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      📊 Template Propostas
                    </Label>
                    <Textarea
                      value={config?.template_propostas ?? ''}
                      onChange={(e) => config && setConfig({ ...config, template_propostas: e.target.value })}
                      rows={4}
                      placeholder="Use {{pending_count}} para número de propostas pendentes"
                      className="text-sm font-mono bg-white/60 dark:bg-neutral-800/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      📄 Template Contratos
                    </Label>
                    <Textarea
                      value={config?.template_contratos ?? ''}
                      onChange={(e) => config && setConfig({ ...config, template_contratos: e.target.value })}
                      rows={4}
                      placeholder="Use {{unsigned_count}} para número de contratos pendentes"
                      className="text-sm font-mono bg-white/60 dark:bg-neutral-800/40"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Test Module Section */}
              <Collapsible open={isTestOpen} onOpenChange={setIsTestOpen}>
                <CollapsibleTrigger 
                  className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 border border-violet-500/20 rounded-lg transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-violet-500" />
                    <span className="font-semibold text-sm">Enviar Teste</span>
                    <Badge className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 text-[10px]">
                      Testar Alertas
                    </Badge>
                  </div>
                  {isTestOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-4">
                  <div className="space-y-4 p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 rounded-xl border border-violet-200/50 dark:border-violet-700/30">
                    {/* Phone Input */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="h-4 w-4 text-violet-500" />
                        Número de Telefone
                      </Label>
                      <Input
                        type="tel"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="+55 (00) 00000-0000"
                        className="bg-white/80 dark:bg-neutral-800/60"
                      />
                      <p className="text-xs text-muted-foreground">
                        Informe o número com DDD para enviar o teste via WhatsApp
                      </p>
                    </div>

                    {/* Template Type Selector */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tipo de Template</Label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTestTemplateType('propostas')}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            testTemplateType === 'propostas'
                              ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md'
                              : 'bg-white/60 dark:bg-neutral-800/60 text-muted-foreground hover:bg-violet-100 dark:hover:bg-violet-900/20'
                          }`}
                        >
                          📊 Propostas
                        </button>
                        <button
                          onClick={() => setTestTemplateType('contratos')}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            testTemplateType === 'contratos'
                              ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md'
                              : 'bg-white/60 dark:bg-neutral-800/60 text-muted-foreground hover:bg-violet-100 dark:hover:bg-violet-900/20'
                          }`}
                        >
                          📄 Contratos
                        </button>
                      </div>
                    </div>

                    {/* Template Preview */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Preview do Template</Label>
                      <div className="p-3 bg-white/80 dark:bg-neutral-800/60 rounded-lg border border-violet-200/50 dark:border-violet-700/30">
                        <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                          {testTemplateType === 'propostas' 
                            ? config?.template_propostas 
                            : config?.template_contratos}
                        </pre>
                      </div>
                    </div>

                    {/* Send Button */}
                    <Button 
                      onClick={sendTestAlert}
                      disabled={isSendingTest || !testPhone.trim()}
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg"
                    >
                      {isSendingTest ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Enviar Alerta de Teste
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving} 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};
