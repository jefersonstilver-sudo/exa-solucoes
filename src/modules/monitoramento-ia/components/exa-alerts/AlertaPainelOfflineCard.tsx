import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Phone,
  User,
  Users,
  Edit2,
  AlertTriangle,
  Zap,
  MessageSquare,
  CheckCircle,
  Smile
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface AlertRule {
  id: string;
  nome: string;
  descricao: string | null;
  tempo_offline_segundos: number;
  intervalo_repeticao_segundos: number;
  repetir_ate_resolver: boolean;
  notificar_quando_online: boolean;
  ativo: boolean;
  prioridade: number;
}

interface Recipient {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
}

interface AdminUser {
  id: string;
  primeiro_nome: string;
  sobrenome: string;
  telefone: string;
  email: string;
  role: string;
}

interface ConfirmButton {
  id: string;
  label: string;
  emoji: string;
  ordem: number;
  ativo: boolean;
}

interface Confirmation {
  id: string;
  device_name: string;
  recipient_phone: string;
  recipient_name: string | null;
  button_label: string;
  confirmed_at: string;
}

// Format phone for display
const formatPhoneDisplay = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  if (numbers.startsWith('55') && numbers.length >= 12) {
    const ddd = numbers.slice(2, 4);
    const part1 = numbers.slice(4, 9);
    const part2 = numbers.slice(9);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }
  if (numbers.length === 11) {
    const ddd = numbers.slice(0, 2);
    const part1 = numbers.slice(2, 7);
    const part2 = numbers.slice(7);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }
  return phone;
};

// Format phone for storage (with country code)
const formatPhoneForStorage = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  if (!numbers.startsWith('55') && numbers.length === 11) {
    return '+55' + numbers;
  }
  if (numbers.startsWith('55')) {
    return '+' + numbers;
  }
  return '+' + numbers;
};

// Format seconds to human readable
const formatSecondsToDisplay = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}min ${remainingSeconds}s` : `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
};

export const AlertaPainelOfflineCard = () => {
  const { userProfile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecipientsOpen, setIsRecipientsOpen] = useState(true);
  const [isRulesOpen, setIsRulesOpen] = useState(true);
  const [isButtonsOpen, setIsButtonsOpen] = useState(false);
  const [isConfirmationsOpen, setIsConfirmationsOpen] = useState(false);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [confirmButtons, setConfirmButtons] = useState<ConfirmButton[]>([]);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New recipient form
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientPhone, setNewRecipientPhone] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Button dialog
  const [showButtonDialog, setShowButtonDialog] = useState(false);
  const [editingButton, setEditingButton] = useState<ConfirmButton | null>(null);
  const [buttonForm, setButtonForm] = useState({ label: '', emoji: '✅' });

  // Rule dialog
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    nome: '',
    descricao: '',
    tempo_offline_segundos: 60,
    intervalo_repeticao_segundos: 300,
    repetir_ate_resolver: false,
    notificar_quando_online: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('panel_offline_alert_rules')
        .select('*')
        .order('tempo_offline_segundos', { ascending: true });

      if (rulesError) throw rulesError;
      setRules(rulesData || []);

      // Load recipients
      const { data: recipientsData, error: recipientsError } = await supabase
        .from('panel_offline_alert_recipients')
        .select('*')
        .order('created_at', { ascending: true });

      if (recipientsError) throw recipientsError;
      setRecipients(recipientsData || []);

      // Load admin users with phone numbers
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, primeiro_nome, sobrenome, telefone, email, role')
        .in('role', ['admin', 'super_admin'])
        .not('telefone', 'is', null);

      if (usersError) throw usersError;
      setAdminUsers(usersData || []);

      // Load confirmation buttons
      const { data: buttonsData } = await supabase
        .from('panel_offline_alert_buttons')
        .select('*')
        .order('ordem', { ascending: true });
      setConfirmButtons(buttonsData || []);

      // Load recent confirmations
      const { data: confirmData } = await supabase
        .from('panel_offline_alert_confirmations')
        .select('*')
        .order('confirmed_at', { ascending: false })
        .limit(20);
      setConfirmations(confirmData || []);
    } catch (error) {
      console.error('Error loading offline alert data:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  // ========== BUTTON MANAGEMENT ==========
  const saveButton = async () => {
    if (!buttonForm.label.trim()) {
      toast.error('Label é obrigatório');
      return;
    }
    setSaving(true);
    try {
      if (editingButton) {
        await supabase.from('panel_offline_alert_buttons').update({
          label: buttonForm.label.trim(),
          emoji: buttonForm.emoji || '✅'
        }).eq('id', editingButton.id);
      } else {
        await supabase.from('panel_offline_alert_buttons').insert({
          label: buttonForm.label.trim(),
          emoji: buttonForm.emoji || '✅',
          ordem: confirmButtons.length + 1,
          ativo: true
        });
      }
      setShowButtonDialog(false);
      loadData();
      toast.success(editingButton ? 'Botão atualizado' : 'Botão criado');
    } catch (error) {
      toast.error('Erro ao salvar botão');
    } finally {
      setSaving(false);
    }
  };

  const toggleButton = async (btn: ConfirmButton) => {
    await supabase.from('panel_offline_alert_buttons').update({ ativo: !btn.ativo }).eq('id', btn.id);
    loadData();
  };

  const deleteButton = async (id: string) => {
    if (!confirm('Excluir este botão?')) return;
    await supabase.from('panel_offline_alert_buttons').delete().eq('id', id);
    loadData();
    toast.success('Botão excluído');
  };

  // ========== RULE MANAGEMENT ==========
  const openNewRuleDialog = () => {
    setEditingRule(null);
    setRuleForm({
      nome: '',
      descricao: '',
      tempo_offline_segundos: 60,
      intervalo_repeticao_segundos: 300,
      repetir_ate_resolver: false,
      notificar_quando_online: true
    });
    setShowRuleDialog(true);
  };

  const openEditRuleDialog = (rule: AlertRule) => {
    setEditingRule(rule);
    setRuleForm({
      nome: rule.nome,
      descricao: rule.descricao || '',
      tempo_offline_segundos: rule.tempo_offline_segundos,
      intervalo_repeticao_segundos: rule.intervalo_repeticao_segundos,
      repetir_ate_resolver: rule.repetir_ate_resolver,
      notificar_quando_online: rule.notificar_quando_online
    });
    setShowRuleDialog(true);
  };

  const saveRule = async () => {
    if (!ruleForm.nome.trim()) {
      toast.error('Nome da regra é obrigatório');
      return;
    }

    setSaving(true);
    try {
      if (editingRule) {
        const { error } = await supabase
          .from('panel_offline_alert_rules')
          .update({
            nome: ruleForm.nome.trim(),
            descricao: ruleForm.descricao.trim() || null,
            tempo_offline_segundos: ruleForm.tempo_offline_segundos,
            intervalo_repeticao_segundos: ruleForm.intervalo_repeticao_segundos,
            repetir_ate_resolver: ruleForm.repetir_ate_resolver,
            notificar_quando_online: ruleForm.notificar_quando_online
          })
          .eq('id', editingRule.id);

        if (error) throw error;
        toast.success('Regra atualizada');
      } else {
        const { error } = await supabase
          .from('panel_offline_alert_rules')
          .insert({
            nome: ruleForm.nome.trim(),
            descricao: ruleForm.descricao.trim() || null,
            tempo_offline_segundos: ruleForm.tempo_offline_segundos,
            intervalo_repeticao_segundos: ruleForm.intervalo_repeticao_segundos,
            repetir_ate_resolver: ruleForm.repetir_ate_resolver,
            notificar_quando_online: ruleForm.notificar_quando_online,
            ativo: true,
            prioridade: rules.length + 1
          });

        if (error) throw error;
        toast.success('Regra criada');
      }

      setShowRuleDialog(false);
      loadData();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Erro ao salvar regra');
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule: AlertRule) => {
    try {
      const { error } = await supabase
        .from('panel_offline_alert_rules')
        .update({ ativo: !rule.ativo })
        .eq('id', rule.id);

      if (error) throw error;
      loadData();
      toast.success(rule.ativo ? 'Regra desativada' : 'Regra ativada');
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Erro ao atualizar');
    }
  };

  const deleteRule = async (rule: AlertRule) => {
    if (!confirm(`Excluir a regra "${rule.nome}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('panel_offline_alert_rules')
        .delete()
        .eq('id', rule.id);

      if (error) throw error;
      loadData();
      toast.success('Regra excluída');
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Erro ao excluir');
    }
  };

  // ========== RECIPIENT MANAGEMENT ==========
  const isUserAlreadyRecipient = (userId: string): boolean => {
    const user = adminUsers.find(u => u.id === userId);
    if (!user) return false;
    const userPhone = formatPhoneForStorage(user.telefone);
    return recipients.some(r => formatPhoneForStorage(r.telefone) === userPhone);
  };

  const addAdminAsRecipient = async (user: AdminUser) => {
    if (isUserAlreadyRecipient(user.id)) {
      toast.info('Este usuário já está na lista');
      return;
    }

    try {
      const fullName = `${user.primeiro_nome} ${user.sobrenome || ''}`.trim();
      const formattedPhone = formatPhoneForStorage(user.telefone);
      
      const { error } = await supabase
        .from('panel_offline_alert_recipients')
        .insert({
          nome: fullName,
          telefone: formattedPhone,
          ativo: true
        });

      if (error) throw error;
      
      loadData();
      toast.success(`${user.primeiro_nome} adicionado como destinatário`);
    } catch (error) {
      console.error('Error adding recipient:', error);
      toast.error('Erro ao adicionar destinatário');
    }
  };

  const addManualRecipient = async () => {
    if (!newRecipientName.trim() || !newRecipientPhone.trim()) {
      toast.error('Preencha nome e telefone');
      return;
    }

    try {
      const formattedPhone = formatPhoneForStorage(newRecipientPhone);
      
      const { error } = await supabase
        .from('panel_offline_alert_recipients')
        .insert({
          nome: newRecipientName.trim(),
          telefone: formattedPhone,
          ativo: true
        });

      if (error) throw error;
      
      setNewRecipientName('');
      setNewRecipientPhone('');
      setShowManualInput(false);
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

  // Current user info
  const currentUserPhone = userProfile?.telefone ? formatPhoneForStorage(userProfile.telefone) : null;
  const isCurrentUserRecipient = currentUserPhone && recipients.some(r => formatPhoneForStorage(r.telefone) === currentUserPhone);
  const activeRulesCount = rules.filter(r => r.ativo).length;

  return (
    <>
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
                    {activeRulesCount} regra{activeRulesCount !== 1 ? 's' : ''} ativa{activeRulesCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="text-xs bg-amber-500/10 border-amber-500/30 hidden sm:inline-flex"
                >
                  {recipients.filter(r => r.ativo).length} dest.
                </Badge>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </div>
            </div>
          </CardHeader>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="space-y-4 pt-0" onClick={(e) => e.stopPropagation()}>
                  {/* RULES SECTION */}
                  <Collapsible open={isRulesOpen} onOpenChange={setIsRulesOpen}>
                    <CollapsibleTrigger 
                      className="flex items-center justify-between w-full p-4 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-600" />
                        <span className="font-semibold text-sm">Regras de Alerta</span>
                        <Badge variant="secondary" className="text-xs bg-amber-500/20">
                          {activeRulesCount} ativas
                        </Badge>
                      </div>
                      {isRulesOpen ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-4 space-y-3">
                      {/* Rules List */}
                      {rules.map((rule) => (
                        <div 
                          key={rule.id}
                          className={`p-4 rounded-lg border transition-all ${
                            rule.ativo 
                              ? 'bg-white/50 dark:bg-neutral-800/50 border-amber-500/30' 
                              : 'bg-muted/30 border-muted opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className={`h-4 w-4 ${rule.ativo ? 'text-amber-600' : 'text-muted-foreground'}`} />
                                <span className="font-semibold text-sm">{rule.nome}</span>
                                {!rule.ativo && (
                                  <Badge variant="secondary" className="text-xs">Inativa</Badge>
                                )}
                              </div>
                              {rule.descricao && (
                                <p className="text-xs text-muted-foreground mb-2">{rule.descricao}</p>
                              )}
                              <div className="flex flex-wrap gap-2 text-xs">
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Após {formatSecondsToDisplay(rule.tempo_offline_segundos)}
                                </Badge>
                                {rule.repetir_ate_resolver && (
                                  <Badge variant="outline" className="text-xs">
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    A cada {formatSecondsToDisplay(rule.intervalo_repeticao_segundos)}
                                  </Badge>
                                )}
                                {rule.notificar_quando_online && (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    <Bell className="h-3 w-3 mr-1" />
                                    Notifica online
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rule.ativo}
                                onCheckedChange={() => toggleRule(rule)}
                                className="data-[state=checked]:bg-amber-500"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditRuleDialog(rule)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => deleteRule(rule)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {rules.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhuma regra configurada</p>
                        </div>
                      )}

                      {/* Add Rule Button */}
                      <Button
                        variant="outline"
                        className="w-full border-dashed border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                        onClick={openNewRuleDialog}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Regra de Alerta
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* RECIPIENTS SECTION */}
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
                    
                    <CollapsibleContent className="mt-4 space-y-4">
                      {/* Quick add: Current user */}
                      {userProfile?.telefone && !isCurrentUserRecipient && (
                        <div 
                          className="flex items-center justify-between p-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                          onClick={() => addAdminAsRecipient({
                            id: userProfile.id,
                            primeiro_nome: (userProfile as any).primeiro_nome || userProfile.name || userProfile.nome || 'Eu',
                            sobrenome: (userProfile as any).sobrenome || '',
                            telefone: userProfile.telefone!,
                            email: userProfile.email || '',
                            role: userProfile.role || 'admin'
                          })}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-primary">Meu número</p>
                              <p className="text-xs text-muted-foreground">{formatPhoneDisplay(userProfile.telefone)}</p>
                            </div>
                          </div>
                          <Plus className="h-5 w-5 text-primary" />
                        </div>
                      )}

                      {/* Admin users list */}
                      {adminUsers.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Administradores
                          </p>
                          {adminUsers
                            .filter(u => u.id !== userProfile?.id)
                            .map((user) => {
                              const isRecipient = isUserAlreadyRecipient(user.id);
                              return (
                                <div 
                                  key={user.id}
                                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                    isRecipient 
                                      ? 'bg-muted/30 border-muted cursor-default' 
                                      : 'bg-muted/10 hover:bg-muted/30 cursor-pointer border-transparent'
                                  }`}
                                  onClick={() => !isRecipient && addAdminAsRecipient(user)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                      <User className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {user.primeiro_nome} {user.sobrenome}
                                      </p>
                                      <p className="text-xs text-muted-foreground">{formatPhoneDisplay(user.telefone)}</p>
                                    </div>
                                  </div>
                                  {isRecipient ? (
                                    <Badge variant="secondary" className="text-xs">Adicionado</Badge>
                                  ) : (
                                    <Plus className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {/* Manual input toggle */}
                      {!showManualInput ? (
                        <Button
                          variant="outline"
                          className="w-full border-dashed"
                          onClick={() => setShowManualInput(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar número manualmente
                        </Button>
                      ) : (
                        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                          <p className="text-xs font-medium">Adicionar destinatário</p>
                          <div className="grid gap-2">
                            <Input
                              placeholder="Nome"
                              value={newRecipientName}
                              onChange={(e) => setNewRecipientName(e.target.value)}
                            />
                            <Input
                              placeholder="Telefone (+55...)"
                              value={newRecipientPhone}
                              onChange={(e) => setNewRecipientPhone(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={addManualRecipient}>
                              Adicionar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setShowManualInput(false);
                                setNewRecipientName('');
                                setNewRecipientPhone('');
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Current recipients */}
                      {recipients.length > 0 && (
                        <div className="space-y-2 pt-2 border-t">
                          <p className="text-xs font-medium text-muted-foreground">
                            Destinatários configurados
                          </p>
                          {recipients.map((recipient) => (
                            <div 
                              key={recipient.id}
                              className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${recipient.ativo ? 'bg-green-500' : 'bg-muted'}`} />
                                <div>
                                  <p className="text-sm font-medium">{recipient.nome}</p>
                                  <p className="text-xs text-muted-foreground">{formatPhoneDisplay(recipient.telefone)}</p>
                                </div>
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
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Editar Regra' : 'Nova Regra de Alerta'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Regra *</Label>
              <Input
                placeholder="Ex: Pequena Queda, Queda Crítica..."
                value={ruleForm.nome}
                onChange={(e) => setRuleForm(f => ({ ...f, nome: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder="Descrição opcional"
                value={ruleForm.descricao}
                onChange={(e) => setRuleForm(f => ({ ...f, descricao: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Alertar após (segundos)
                </Label>
                <Input
                  type="number"
                  min={10}
                  max={86400}
                  value={ruleForm.tempo_offline_segundos}
                  onChange={(e) => setRuleForm(f => ({ ...f, tempo_offline_segundos: parseInt(e.target.value) || 60 }))}
                />
                <p className="text-[10px] text-muted-foreground">
                  = {formatSecondsToDisplay(ruleForm.tempo_offline_segundos)}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Repetir a cada (seg)
                </Label>
                <Input
                  type="number"
                  min={30}
                  max={86400}
                  value={ruleForm.intervalo_repeticao_segundos}
                  onChange={(e) => setRuleForm(f => ({ ...f, intervalo_repeticao_segundos: parseInt(e.target.value) || 300 }))}
                  disabled={!ruleForm.repetir_ate_resolver}
                />
                <p className="text-[10px] text-muted-foreground">
                  = {formatSecondsToDisplay(ruleForm.intervalo_repeticao_segundos)}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Repetir até resolver</span>
                </div>
                <Switch
                  checked={ruleForm.repetir_ate_resolver}
                  onCheckedChange={(checked) => setRuleForm(f => ({ ...f, repetir_ate_resolver: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Notificar quando voltar online</span>
                </div>
                <Switch
                  checked={ruleForm.notificar_quando_online}
                  onCheckedChange={(checked) => setRuleForm(f => ({ ...f, notificar_quando_online: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={saveRule} 
              disabled={saving}
              className="bg-gradient-to-r from-amber-500 to-orange-600"
            >
              {saving ? 'Salvando...' : (editingRule ? 'Atualizar' : 'Criar Regra')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
