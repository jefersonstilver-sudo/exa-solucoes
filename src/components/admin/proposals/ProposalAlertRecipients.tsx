import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Phone, User, Users, AlertTriangle, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PhoneInput, type CountryCode } from '@/components/ui/phone-input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface AlertRecipient {
  id: string;
  name: string;
  phone: string;
  phoneCountry: CountryCode;
  receiveWhatsapp: boolean;
  active: boolean;
}

interface SuperAdmin {
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
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
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    phone: '',
    phoneFullNumber: '',
    phoneCountry: 'BR' as CountryCode,
  });

  // Carregar super admins quando o dialog de admins abrir
  useEffect(() => {
    if (adminDialogOpen) {
      loadSuperAdmins();
    }
  }, [adminDialogOpen]);

  const loadSuperAdmins = async () => {
    try {
      setLoadingAdmins(true);
      
      // Buscar todos os super_admins
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'super_admin');
      
      if (rolesError) throw rolesError;
      
      const superAdminIds = rolesData?.map(r => r.user_id) || [];
      
      if (superAdminIds.length === 0) {
        setSuperAdmins([]);
        return;
      }

      // Buscar dados dos usuários super_admin
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, nome, email, telefone')
        .in('id', superAdminIds);
      
      if (usersError) throw usersError;

      const admins: SuperAdmin[] = (usersData || []).map(user => ({
        user_id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone
      }));
      
      setSuperAdmins(admins);
    } catch (error: any) {
      console.error('Error loading super admins:', error);
      toast.error('Erro ao carregar admins');
    } finally {
      setLoadingAdmins(false);
    }
  };

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

  const handleAddAdmin = (admin: SuperAdmin) => {
    // Verificar se já foi adicionado
    const alreadyAdded = recipients.some(r => 
      r.name === admin.nome || 
      (admin.telefone && r.phone === admin.telefone)
    );

    if (alreadyAdded) {
      toast.error('Este admin já foi adicionado');
      return;
    }

    if (!admin.telefone) {
      toast.error(`${admin.nome} não possui WhatsApp cadastrado`);
      return;
    }

    const recipient: AlertRecipient = {
      id: `admin_${admin.user_id}_${Date.now()}`,
      name: admin.nome,
      phone: admin.telefone,
      phoneCountry: 'BR',
      receiveWhatsapp: true,
      active: true,
    };

    onRecipientsChange([...recipients, recipient]);
    toast.success(`${admin.nome} adicionado às notificações`);
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

      {/* Botões de ação */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 h-9 text-xs border-dashed"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> 
          Adicionar destinatário
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 h-9 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
          onClick={() => setAdminDialogOpen(true)}
        >
          <UserPlus className="h-3.5 w-3.5 mr-1.5" /> 
          Adicionar Admin
        </Button>
      </div>

      {/* Dialog para adicionar destinatário manual */}
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

      {/* Dialog para selecionar Admin */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Adicionar Admin
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {loadingAdmins ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-500">Carregando admins...</span>
              </div>
            ) : superAdmins.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhum admin encontrado</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {superAdmins.map((admin) => {
                    const isAdded = recipients.some(r => 
                      r.name === admin.nome || 
                      (admin.telefone && r.phone === admin.telefone)
                    );
                    const hasPhone = !!admin.telefone;

                    return (
                      <div 
                        key={admin.user_id}
                        className={`p-3 rounded-lg border transition-colors ${
                          isAdded 
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                            : hasPhone
                              ? 'bg-gray-50 hover:bg-gray-100 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
                              : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {admin.nome}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {admin.email}
                                </p>
                              </div>
                            </div>
                            
                            {/* Telefone ou aviso */}
                            <div className="mt-2 ml-7">
                              {hasPhone ? (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {formatPhoneDisplay(admin.telefone!)}
                                </span>
                              ) : (
                                <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  WhatsApp não cadastrado
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant={isAdded ? "ghost" : "outline"}
                            className={`ml-2 h-8 ${
                              isAdded 
                                ? 'text-green-600 hover:text-green-700' 
                                : hasPhone
                                  ? 'text-blue-600 hover:bg-blue-50'
                                  : 'text-amber-600 hover:bg-amber-50'
                            }`}
                            onClick={() => !isAdded && handleAddAdmin(admin)}
                            disabled={isAdded || !hasPhone}
                          >
                            {isAdded ? (
                              <>✓ Adicionado</>
                            ) : hasPhone ? (
                              <>
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Adicionar
                              </>
                            ) : (
                              <>Sem WhatsApp</>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ProposalAlertRecipients;
