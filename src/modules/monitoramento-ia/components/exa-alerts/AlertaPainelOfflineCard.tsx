import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp, 
  Monitor, 
  Clock, 
  RefreshCw, 
  Bell, 
  Plus, 
  Trash2,
  Settings2,
  Phone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPhoneNumber } from '@/utils/phoneUtils';

interface AlertConfig {
  id: string;
  ativo: boolean;
  tempo_offline_minutos: number;
  repetir_ate_resolver: boolean;
  intervalo_repeticao_minutos: number;
  notificar_quando_online: boolean;
}

interface Recipient {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
}

export const AlertaPainelOfflineCard = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecipientsOpen, setIsRecipientsOpen] = useState(true);
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New recipient form
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientPhone, setNewRecipientPhone] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load config
      const { data: configData, error: configError } = await supabase
        .from('panel_offline_alert_config')
        .select('*')
        .limit(1)
        .single();

      if (configError && configError.code !== 'PGRST116') throw configError;
      setConfig(configData);

      // Load recipients
      const { data: recipientsData, error: recipientsError } = await supabase
        .from('panel_offline_alert_recipients')
        .select('*')
        .order('created_at', { ascending: true });

      if (recipientsError) throw recipientsError;
      setRecipients(recipientsData || []);
    } catch (error) {
      console.error('Error loading offline alert data:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<AlertConfig>) => {
    if (!config) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('panel_offline_alert_config')
        .update(updates)
        .eq('id', config.id);

      if (error) throw error;
      setConfig({ ...config, ...updates });
      toast.success('Configuração atualizada');
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const addRecipient = async () => {
    if (!newRecipientName.trim() || !newRecipientPhone.trim()) {
      toast.error('Preencha nome e telefone');
      return;
    }

    try {
      const { error } = await supabase
        .from('panel_offline_alert_recipients')
        .insert({
          nome: newRecipientName.trim(),
          telefone: newRecipientPhone.trim(),
          ativo: true
        });

      if (error) throw error;
      
      setNewRecipientName('');
      setNewRecipientPhone('');
      loadData();
      toast.success('Destinatário adicionado');
    } catch (error) {
      console.error('Error adding recipient:', error);
      toast.error('Erro ao adicionar destinatário');
    }
  };

  const toggleRecipient = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('panel_offline_alert_recipients')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error toggling recipient:', error);
      toast.error('Erro ao atualizar');
    }
  };

  const removeRecipient = async (id: string) => {
    if (!confirm('Remover este destinatário?')) return;
    try {
      const { error } = await supabase
        .from('panel_offline_alert_recipients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
      toast.success('Destinatário removido');
    } catch (error) {
      console.error('Error removing recipient:', error);
      toast.error('Erro ao remover');
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md border border-white/20 rounded-xl lg:rounded-2xl">
        <CardHeader className="p-4 md:p-6">
          <div className="animate-pulse flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded"></div>
              <div className="h-3 w-24 bg-muted rounded"></div>
            </div>
          </div>
        </CardHeader>
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
        className="group bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md border-2 border-amber-500/30 hover:border-amber-500/50 rounded-xl lg:rounded-2xl transition-all cursor-pointer hover:shadow-xl shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <Monitor className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Alerta Painel Offline
                </h3>
                <p className="text-xs text-muted-foreground">
                  Notificação quando painéis ficarem offline
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {config?.ativo && (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-amber-500/10 border-amber-500/30 hidden sm:inline-flex"
                >
                  ⏱️ {config.tempo_offline_minutos}min
                </Badge>
              )}
              <Switch 
                checked={config?.ativo || false} 
                onCheckedChange={(checked) => updateConfig({ ativo: checked })}
                onClick={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-600"
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
              {/* Configuration Section */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Settings2 className="h-3 w-3" />
                  Configurações do Alerta
                </p>

                {/* Tempo offline */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Alertar após (min)
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={config?.tempo_offline_minutos || 10}
                      onChange={(e) => updateConfig({ tempo_offline_minutos: parseInt(e.target.value) || 10 })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Repetir a cada (min)
                    </Label>
                    <Input
                      type="number"
                      min={5}
                      max={120}
                      value={config?.intervalo_repeticao_minutos || 30}
                      onChange={(e) => updateConfig({ intervalo_repeticao_minutos: parseInt(e.target.value) || 30 })}
                      className="h-9"
                      disabled={!config?.repetir_ate_resolver}
                    />
                  </div>
                </div>

                {/* Switches */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Repetir até resolver</span>
                    </div>
                    <Switch
                      checked={config?.repetir_ate_resolver || false}
                      onCheckedChange={(checked) => updateConfig({ repetir_ate_resolver: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Notificar quando voltar online</span>
                    </div>
                    <Switch
                      checked={config?.notificar_quando_online || false}
                      onCheckedChange={(checked) => updateConfig({ notificar_quando_online: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Recipients Section */}
              <Collapsible open={isRecipientsOpen} onOpenChange={setIsRecipientsOpen}>
                <CollapsibleTrigger 
                  className="flex items-center justify-between w-full p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="font-semibold text-sm">Destinatários</span>
                    <Badge variant="secondary" className="text-xs">
                      {recipients.filter(r => r.ativo).length} ativos
                    </Badge>
                  </div>
                  {isRecipientsOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-4 space-y-3">
                  {/* Add new recipient form */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome"
                      value={newRecipientName}
                      onChange={(e) => setNewRecipientName(e.target.value)}
                      className="h-9"
                    />
                    <Input
                      placeholder="+55 45 99999-9999"
                      value={newRecipientPhone}
                      onChange={(e) => setNewRecipientPhone(formatPhoneNumber(e.target.value))}
                      className="h-9"
                    />
                    <Button size="sm" onClick={addRecipient} className="h-9 px-3">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Recipients list */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {recipients.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum destinatário cadastrado
                      </p>
                    ) : (
                      recipients.map((recipient) => (
                        <div
                          key={recipient.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            recipient.ativo 
                              ? 'border-border bg-background' 
                              : 'border-muted bg-muted/30 opacity-60'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium">{recipient.nome}</p>
                            <p className="text-xs text-muted-foreground">{recipient.telefone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={recipient.ativo}
                              onCheckedChange={() => toggleRecipient(recipient.id, recipient.ativo)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeRecipient(recipient.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};
