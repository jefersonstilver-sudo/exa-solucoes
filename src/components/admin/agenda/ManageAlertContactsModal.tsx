import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  UserPlus, 
  Trash2, 
  Phone, 
  User, 
  Loader2, 
  Bell, 
  MessageSquare,
  Check,
  X,
  Edit2,
  Save,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface AlertContact {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
  pode_agendar?: boolean;
  pode_usar_ia?: boolean;
  nivel_acesso?: string;
  created_at?: string;
}

interface ManageAlertContactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManageAlertContactsModal = ({ open, onOpenChange }: ManageAlertContactsModalProps) => {
  const queryClient = useQueryClient();
  const [newContact, setNewContact] = useState({ nome: '', telefone: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', telefone: '' });

  // Fetch contacts from exa_alerts_directors
  const { data: contacts, isLoading, refetch } = useQuery({
    queryKey: ['agenda-alert-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exa_alerts_directors')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data || []) as AlertContact[];
    },
    enabled: open
  });

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (contact: { nome: string; telefone: string }) => {
      // Format phone number
      const formattedPhone = contact.telefone.replace(/\D/g, '');
      
      const { data, error } = await supabase
        .from('exa_alerts_directors')
        .insert({
          nome: contact.nome.trim(),
          telefone: formattedPhone,
          ativo: true,
          pode_agendar: true,
          nivel_acesso: 'usuario'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Contato adicionado com sucesso!');
      setNewContact({ nome: '', telefone: '' });
      queryClient.invalidateQueries({ queryKey: ['agenda-alert-contacts'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao adicionar: ${error.message}`);
    }
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AlertContact> }) => {
      const { data, error } = await supabase
        .from('exa_alerts_directors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Contato atualizado!');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['agenda-alert-contacts'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    }
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exa_alerts_directors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Contato removido!');
      queryClient.invalidateQueries({ queryKey: ['agenda-alert-contacts'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover: ${error.message}`);
    }
  });

  const handleAddContact = () => {
    if (!newContact.nome.trim()) {
      toast.error('Digite o nome do contato');
      return;
    }
    if (!newContact.telefone.trim() || newContact.telefone.replace(/\D/g, '').length < 10) {
      toast.error('Digite um telefone válido');
      return;
    }
    addContactMutation.mutate(newContact);
  };

  const handleToggleActive = (contact: AlertContact) => {
    updateContactMutation.mutate({
      id: contact.id,
      updates: { ativo: !contact.ativo }
    });
  };

  const handleToggleCanSchedule = (contact: AlertContact) => {
    updateContactMutation.mutate({
      id: contact.id,
      updates: { pode_agendar: !contact.pode_agendar }
    });
  };

  const startEditing = (contact: AlertContact) => {
    setEditingId(contact.id);
    setEditForm({ nome: contact.nome, telefone: contact.telefone });
  };

  const saveEdit = (id: string) => {
    if (!editForm.nome.trim()) {
      toast.error('Nome não pode ser vazio');
      return;
    }
    updateContactMutation.mutate({
      id,
      updates: {
        nome: editForm.nome.trim(),
        telefone: editForm.telefone.replace(/\D/g, '')
      }
    });
  };

  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-blue-100">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            Gerenciar Contatos para Alertas
          </DialogTitle>
          <DialogDescription>
            Adicione pessoas que podem receber alertas e agendar lembretes via WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new contact form */}
          <Card className="p-4 bg-gray-50 border-dashed">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="nome" className="text-xs text-gray-600">Nome</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="nome"
                    placeholder="Ex: Suzana"
                    value={newContact.nome}
                    onChange={(e) => setNewContact({ ...newContact, nome: e.target.value })}
                    className="pl-8 h-9 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddContact()}
                  />
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="telefone" className="text-xs text-gray-600">WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="telefone"
                    placeholder="(45) 99999-9999"
                    value={newContact.telefone}
                    onChange={(e) => setNewContact({ ...newContact, telefone: e.target.value })}
                    className="pl-8 h-9 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddContact()}
                  />
                </div>
              </div>
              <Button
                onClick={handleAddContact}
                disabled={addContactMutation.isPending}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {addContactMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    Adicionar
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Contacts list */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Contatos Cadastrados ({contacts?.length || 0})
            </h3>
            <Button
              onClick={() => refetch()}
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Atualizar
            </Button>
          </div>

          <ScrollArea className="h-[320px] pr-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : contacts?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-3 rounded-full bg-gray-100 mb-3">
                  <MessageSquare className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Nenhum contato cadastrado</p>
                <p className="text-xs text-gray-400 mt-1">
                  Adicione contatos que poderão agendar tarefas via WhatsApp
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {contacts?.map((contact) => (
                  <Card
                    key={contact.id}
                    className={`p-3 transition-all ${
                      contact.ativo 
                        ? 'bg-white border-gray-200' 
                        : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar/Icon */}
                      <div className={`p-2 rounded-full ${
                        contact.ativo ? 'bg-blue-100' : 'bg-gray-200'
                      }`}>
                        <User className={`h-4 w-4 ${
                          contact.ativo ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {editingId === contact.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editForm.nome}
                              onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                              className="h-7 text-sm"
                              autoFocus
                            />
                            <Input
                              value={editForm.telefone}
                              onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                              className="h-7 text-sm w-32"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => saveEdit(contact.id)}
                            >
                              <Save className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-3.5 w-3.5 text-gray-500" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-gray-900 truncate">
                                {contact.nome}
                              </span>
                              {contact.pode_agendar && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200">
                                  Pode agendar
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {formatPhoneDisplay(contact.telefone)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      {editingId !== contact.id && (
                        <div className="flex items-center gap-3">
                          {/* Toggle can schedule */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-500">Agendar</span>
                            <Switch
                              checked={contact.pode_agendar}
                              onCheckedChange={() => handleToggleCanSchedule(contact)}
                              className="scale-75"
                            />
                          </div>

                          {/* Toggle active */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-500">Ativo</span>
                            <Switch
                              checked={contact.ativo}
                              onCheckedChange={() => handleToggleActive(contact)}
                              className="scale-75"
                            />
                          </div>

                          {/* Edit button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => startEditing(contact)}
                          >
                            <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                          </Button>

                          {/* Delete button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Remover ${contact.nome}?`)) {
                                deleteContactMutation.mutate(contact.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Info footer */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              💡 Contatos ativos com permissão de agendar podem enviar mensagens como 
              "me lembra..." no WhatsApp para criar tarefas automaticamente.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageAlertContactsModal;
