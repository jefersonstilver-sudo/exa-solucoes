import React, { useState } from 'react';
import { Bell, Clock, Mail, Plus, X, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const AIReportsConfig = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedHour, setSelectedHour] = useState('06:00');
  const [emails, setEmails] = useState<string[]>(['diretor@exa.com.br', 'ceo@examidia.com.br']);
  const [newEmail, setNewEmail] = useState('');
  const { toast } = useToast();

  const handleAddEmail = () => {
    if (newEmail && newEmail.includes('@')) {
      setEmails([...emails, newEmail]);
      setNewEmail('');
      toast({
        title: "Email adicionado",
        description: `${newEmail} foi adicionado à lista de destinatários.`,
      });
    } else {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove));
    toast({
      title: "Email removido",
      description: `${emailToRemove} foi removido da lista.`,
    });
  };

  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "As configurações de relatórios foram atualizadas com sucesso.",
    });
  };

  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6 space-y-6">
        {/* Header with Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Envio Diário Automático</h2>
              <p className="text-sm text-gray-600 mt-1">
                Receba relatórios automaticamente todos os dias
              </p>
            </div>
          </div>
          
          {/* Apple-style Toggle */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isEnabled ? 'text-purple-600' : 'text-gray-400'}`}>
              {isEnabled ? 'Ativo' : 'Inativo'}
            </span>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
        </div>

        {/* Expanded Configuration */}
        <AnimatePresence>
          {isEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5 pt-4 border-t border-gray-100"
            >
              {/* Time Selector */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4 text-purple-600" />
                  Horário de Envio
                </div>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email List */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="w-4 h-4 text-purple-600" />
                  Destinatários ({emails.length})
                </div>
                
                <div className="space-y-2">
                  {emails.map((email, index) => (
                    <motion.div
                      key={email}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 group hover:border-purple-300 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-700">{email}</span>
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Add New Email */}
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="novo@email.com.br"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                    className="flex-1 h-11 bg-gray-50 border-gray-200 focus:ring-purple-500"
                  />
                  <Button
                    onClick={handleAddEmail}
                    variant="outline"
                    className="h-11 px-4 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                className="w-full h-11 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
