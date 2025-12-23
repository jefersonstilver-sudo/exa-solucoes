import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [newHorario, setNewHorario] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      
      // Buscar configuração existente
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
        // Criar configuração padrão
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
    
    // Validar formato HH:MM
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

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-white/50">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/50 dark:border-amber-700/30 shadow-lg">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-800/20 transition-colors rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-xl">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Alertas de Propostas & Contratos
                      {config?.ativo ? (
                        <Badge className="bg-green-100 text-green-700 text-[10px]">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600 text-[10px]">
                          Desativado
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Lembretes automáticos para propostas e contratos pendentes
                    </CardDescription>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-6 pt-2">
              {/* Toggle Geral */}
              <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-neutral-800/40 rounded-xl border border-white/50 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-amber-600" />
                  <div>
                    <Label className="font-medium">Alertas Diários Ativos</Label>
                    <p className="text-xs text-muted-foreground">Ativar/desativar todos os alertas comerciais</p>
                  </div>
                </div>
                <Switch
                  checked={config?.ativo ?? false}
                  onCheckedChange={(checked) => config && setConfig({ ...config, ativo: checked })}
                />
              </div>

              {/* Horários de Envio */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Horários de Envio (Brasília)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {config?.horarios_envio.map((horario) => (
                    <Badge 
                      key={horario} 
                      className="bg-amber-100 text-amber-700 text-sm px-3 py-1 flex items-center gap-2"
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
                  <Button variant="outline" size="sm" onClick={addHorario}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Dias da Semana */}
              <div className="space-y-3">
                <Label>Dias de Envio</Label>
                <div className="flex flex-wrap gap-2">
                  {diasSemana.map((dia) => (
                    <button
                      key={dia.id}
                      onClick={() => toggleDia(dia.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        config?.dias_semana.includes(dia.id)
                          ? 'bg-amber-500 text-white'
                          : 'bg-white/60 dark:bg-neutral-800/60 text-muted-foreground hover:bg-amber-100'
                      }`}
                    >
                      {dia.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipos de Alerta */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  Tipos de Alerta
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-neutral-800/40 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={config?.alerta_propostas_pendentes ?? false}
                        onCheckedChange={(checked) => 
                          config && setConfig({ ...config, alerta_propostas_pendentes: !!checked })
                        }
                      />
                      <Label className="text-sm">Propostas não aceitas ({'>'}24h)</Label>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                      Destinatários da proposta
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-neutral-800/40 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={config?.alerta_contratos_pendentes ?? false}
                        onCheckedChange={(checked) => 
                          config && setConfig({ ...config, alerta_contratos_pendentes: !!checked })
                        }
                      />
                      <Label className="text-sm">Contratos não assinados ({'>'}48h)</Label>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                      Signatários + vendedor
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-neutral-800/40 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={config?.alerta_propostas_expirando ?? false}
                        onCheckedChange={(checked) => 
                          config && setConfig({ ...config, alerta_propostas_expirando: !!checked })
                        }
                      />
                      <Label className="text-sm">Propostas prestes a expirar (24h antes)</Label>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      <Clock className="h-3 w-3 mr-1 text-blue-500" />
                      Aviso preventivo
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Templates de Mensagem */}
              <div className="space-y-4">
                <Label>Templates de Mensagem</Label>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Template Propostas</Label>
                  <Textarea
                    value={config?.template_propostas ?? ''}
                    onChange={(e) => config && setConfig({ ...config, template_propostas: e.target.value })}
                    rows={4}
                    placeholder="Use {{pending_count}} para número de propostas pendentes"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Template Contratos</Label>
                  <Textarea
                    value={config?.template_contratos ?? ''}
                    onChange={(e) => config && setConfig({ ...config, template_contratos: e.target.value })}
                    rows={4}
                    placeholder="Use {{unsigned_count}} para número de contratos pendentes"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Botão Salvar */}
              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </motion.div>
  );
};
