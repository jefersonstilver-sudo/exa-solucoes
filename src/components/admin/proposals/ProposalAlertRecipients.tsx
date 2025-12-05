import React, { useState } from 'react';
import { Bell, Plus, Trash2, Phone, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PhoneInput, type CountryCode } from '@/components/ui/phone-input';
import { toast } from 'sonner';

export interface AlertRecipient {
  id: string;
  name: string;
  phone: string;
  phoneCountry: CountryCode;
  receiveWhatsapp: boolean;
  active: boolean;
}

interface ProposalAlertRecipientsProps {
  recipients: AlertRecipient[];
  onRecipientsChange: (recipients: AlertRecipient[]) => void;
  className?: string;
}

export function ProposalAlertRecipients({ 
  recipients, 
  onRecipientsChange,
  className = ''
}: ProposalAlertRecipientsProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    phone: '',
    phoneFullNumber: '',
    phoneCountry: 'BR' as CountryCode,
  });

  const handleAddRecipient = () => {
    if (!newRecipient.name.trim()) {
      toast.error('Informe o nome do destinatário');
      return;
    }
    if (!newRecipient.phoneFullNumber) {
      toast.error('Informe o telefone do destinatário');
      return;
    }

    const recipient: AlertRecipient = {
      id: `temp_${Date.now()}`,
      name: newRecipient.name.trim(),
      phone: newRecipient.phoneFullNumber,
      phoneCountry: newRecipient.phoneCountry,
      receiveWhatsapp: true,
      active: true,
    };

    onRecipientsChange([...recipients, recipient]);
    setAddDialogOpen(false);
    setNewRecipient({ name: '', phone: '', phoneFullNumber: '', phoneCountry: 'BR' });
    toast.success('Destinatário adicionado');
  };

  const handleRemoveRecipient = (id: string) => {
    onRecipientsChange(recipients.filter(r => r.id !== id));
    toast.success('Destinatário removido');
  };

  const handleToggleWhatsapp = (id: string) => {
    onRecipientsChange(recipients.map(r => 
      r.id === id ? { ...r, receiveWhatsapp: !r.receiveWhatsapp } : r
    ));
  };

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 13 && clean.startsWith('55')) {
      return `+55 (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
    }
    return phone;
  };

  return (
    <Card className={`p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-white/50 dark:border-gray-700/50 shadow-md ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <Bell className="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notificações EXA Alert</h3>
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Receba notificações via WhatsApp quando houver movimentações nesta proposta: visualizações, aceite, pagamento, etc.
      </p>

      {/* Lista de destinatários */}
      {recipients.length > 0 ? (
        <div className="space-y-2 mb-3">
          {recipients.map((recipient) => (
            <div 
              key={recipient.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0">
                  <User className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {recipient.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {formatPhoneDisplay(recipient.phone)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch 
                  checked={recipient.receiveWhatsapp}
                  onCheckedChange={() => handleToggleWhatsapp(recipient.id)}
                  className="data-[state=checked]:bg-green-500 h-4 w-7"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleRemoveRecipient(recipient.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 mb-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
          <Bell className="h-6 w-6 text-gray-300 dark:text-gray-600 mx-auto mb-1" />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Nenhum destinatário cadastrado
          </p>
        </div>
      )}

      {/* Botão adicionar */}
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full h-9 text-xs border-dashed"
        onClick={() => setAddDialogOpen(true)}
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" /> 
        Adicionar destinatário
      </Button>

      {/* Dialog para adicionar destinatário */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-500" />
              Adicionar Destinatário
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-name">Nome</Label>
              <Input
                id="recipient-name"
                placeholder="Ex: João Silva"
                value={newRecipient.name}
                onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <PhoneInput
                value={newRecipient.phone}
                onChange={(value, fullNumber, country) => {
                  setNewRecipient(prev => ({
                    ...prev,
                    phone: value,
                    phoneFullNumber: fullNumber,
                    phoneCountry: country,
                  }));
                }}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddRecipient} className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ProposalAlertRecipients;
