import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Mail, Plus, X, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface DailyReportConfigData {
  id: string;
  enabled: boolean;
  schedule_time: string;
  recipient_emails: string[];
}

export const DailyReportConfig = () => {
  const [config, setConfig] = useState<DailyReportConfigData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_report_config')
        .select('*')
        .single();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const toggleEnabled = async (enabled: boolean) => {
    if (!config) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('daily_report_config')
        .update({ enabled })
        .eq('id', config.id);

      if (error) throw error;

      setConfig({ ...config, enabled });
      toast({
        title: enabled ? 'Relatórios diários ativados' : 'Relatórios diários desativados',
        description: enabled 
          ? `Será enviado diariamente às ${config.schedule_time.slice(0, 5)}`
          : 'Você não receberá mais relatórios diários',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a configuração',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateScheduleTime = async (time: string) => {
    if (!config) return;
    
    try {
      const { error } = await supabase
        .from('daily_report_config')
        .update({ schedule_time: time })
        .eq('id', config.id);

      if (error) throw error;

      setConfig({ ...config, schedule_time: time });
      toast({
        title: 'Horário atualizado',
        description: `Relatórios serão enviados às ${time.slice(0, 5)}`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o horário',
        variant: 'destructive',
      });
    }
  };

  const addEmail = async () => {
    if (!config || !newEmail) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, insira um email válido',
        variant: 'destructive',
      });
      return;
    }

    if (config.recipient_emails.includes(newEmail)) {
      toast({
        title: 'Email já cadastrado',
        description: 'Este email já está na lista de destinatários',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updatedEmails = [...config.recipient_emails, newEmail];
      const { error } = await supabase
        .from('daily_report_config')
        .update({ recipient_emails: updatedEmails })
        .eq('id', config.id);

      if (error) throw error;

      setConfig({ ...config, recipient_emails: updatedEmails });
      setNewEmail('');
      toast({
        title: 'Email adicionado',
        description: `${newEmail} receberá os relatórios diários`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o email',
        variant: 'destructive',
      });
    }
  };

  const removeEmail = async (email: string) => {
    if (!config) return;
    
    try {
      const updatedEmails = config.recipient_emails.filter(e => e !== email);
      const { error } = await supabase
        .from('daily_report_config')
        .update({ recipient_emails: updatedEmails })
        .eq('id', config.id);

      if (error) throw error;

      setConfig({ ...config, recipient_emails: updatedEmails });
      toast({
        title: 'Email removido',
        description: `${email} não receberá mais os relatórios`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o email',
        variant: 'destructive',
      });
    }
  };

  if (!config) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="outline"
            className="group relative overflow-hidden border-primary/20 hover:border-primary/40 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Calendar className="mr-2 h-4 w-4" />
            Relatórios Diários
          </Button>
        </motion.div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Configurar Relatórios Diários
          </DialogTitle>
          <DialogDescription>
            Configure o envio automático de relatórios de atividades do Eduardo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Toggle Principal */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">
                Envio Automático
              </Label>
              <p className="text-sm text-muted-foreground">
                {config.enabled 
                  ? 'Relatórios sendo enviados diariamente' 
                  : 'Ative para receber relatórios por email'
                }
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={toggleEnabled}
              disabled={loading}
            />
          </div>

          {/* Horário */}
          <AnimatePresence>
            {config.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horário de Envio
                  </Label>
                  <Input
                    type="time"
                    value={config.schedule_time.slice(0, 5)}
                    onChange={(e) => updateScheduleTime(e.target.value + ':00')}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Horário de Brasília (UTC-3)
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lista de Emails */}
          <AnimatePresence>
            {config.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="space-y-3"
              >
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Destinatários
                </Label>

                {/* Emails Cadastrados */}
                {config.recipient_emails.length > 0 && (
                  <div className="space-y-2">
                    {config.recipient_emails.map((email, index) => (
                      <motion.div
                        key={email}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-md bg-muted/50 group hover:bg-muted transition-colors"
                      >
                        <span className="text-sm font-medium">{email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEmail(email)}
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Adicionar Novo Email */}
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                    className="flex-1"
                  />
                  <Button
                    onClick={addEmail}
                    size="icon"
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {config.recipient_emails.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum destinatário cadastrado
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
