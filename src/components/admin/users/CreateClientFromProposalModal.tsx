import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  FileText, 
  Building2, 
  Mail, 
  Phone, 
  CheckCircle,
  Loader2,
  User,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Proposal {
  id: string;
  nome_cliente: string;
  cnpj_cliente: string | null;
  email_cliente: string | null;
  telefone_cliente: string | null;
  status: string;
  valor_total: number;
  created_at: string;
  buildings?: { id: string; nome: string }[];
}

interface CreateClientFromProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateClientFromProposalModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateClientFromProposalModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [emailOverride, setEmailOverride] = useState('');
  const [creating, setCreating] = useState(false);

  // Buscar propostas aceitas ou pendentes
  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['proposals-for-account-creation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select(`
          id,
          nome_cliente,
          cnpj_cliente,
          email_cliente,
          telefone_cliente,
          status,
          valor_total,
          created_at,
          proposal_buildings(
            buildings(id, nome)
          )
        `)
        .in('status', ['aceita', 'pendente', 'enviada'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      return (data || []).map((p: any) => ({
        ...p,
        buildings: p.proposal_buildings?.map((pb: any) => pb.buildings).filter(Boolean) || []
      }));
    },
    enabled: open
  });

  const filteredProposals = proposals.filter((p: Proposal) =>
    p.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cnpj_cliente?.includes(searchTerm)
  );

  const handleSelectProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setEmailOverride(proposal.email_cliente || '');
    setStep('confirm');
  };

  const handleBack = () => {
    setStep('select');
    setSelectedProposal(null);
    setEmailOverride('');
  };

  const handleClose = () => {
    setStep('select');
    setSelectedProposal(null);
    setEmailOverride('');
    setSearchTerm('');
    onOpenChange(false);
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(x => chars[x % chars.length]).join('');
  };

  const handleCreateAccount = async () => {
    if (!selectedProposal || !emailOverride.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    setCreating(true);
    try {
      const password = generateSecurePassword();
      const nameParts = selectedProposal.nome_cliente?.split(' ') || ['Cliente'];
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Criar conta via Edge Function
      const { data, error } = await supabase.functions.invoke('create-client-account', {
        body: {
          email: emailOverride.trim(),
          password,
          primeiro_nome: firstName,
          sobrenome: lastName,
          telefone: selectedProposal.telefone_cliente,
          role: 'client'
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao criar conta');

      const userId = data.userId;

      // Atualizar proposta com client_id (se aceita, criar pedido)
      if (selectedProposal.status === 'aceita') {
        // Criar pedido a partir da proposta
        const { error: orderError } = await supabase
          .from('pedidos')
          .insert({
            client_id: userId,
            proposal_id: selectedProposal.id,
            valor_total: selectedProposal.valor_total,
            status: 'aguardando_pagamento',
            observacoes: `Pedido criado a partir da proposta ${selectedProposal.id}`
          });

        if (orderError) {
          console.error('Erro ao criar pedido:', orderError);
        }
      }

      // Log da criação
      console.log('✅ Conta cliente criada:', { userId, email: emailOverride, proposal: selectedProposal.id });

      // Copiar credenciais
      const credentials = `🔐 CREDENCIAIS DE ACESSO EXA\n\nEmail: ${emailOverride}\nSenha: ${password}\n\n⚠️ Altere a senha no primeiro acesso!`;
      await navigator.clipboard.writeText(credentials);

      toast.success('Conta criada com sucesso!', {
        description: 'Credenciais copiadas para a área de transferência'
      });

      onSuccess();
      handleClose();

    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      toast.error('Erro ao criar conta: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aceita':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Aceita</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'enviada':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Enviada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            {step === 'select' ? 'Criar Conta a partir de Proposta' : 'Confirmar Criação de Conta'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {step === 'select' 
              ? 'Selecione uma proposta para criar a conta do cliente automaticamente'
              : 'Revise os dados e confirme a criação da conta'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </div>

            {/* Proposals List */}
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : filteredProposals.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma proposta encontrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProposals.map((proposal: Proposal) => (
                    <button
                      key={proposal.id}
                      onClick={() => handleSelectProposal(proposal)}
                      className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 truncate">
                              {proposal.nome_cliente}
                            </span>
                            {getStatusBadge(proposal.status)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            {proposal.email_cliente && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {proposal.email_cliente}
                              </span>
                            )}
                            {proposal.telefone_cliente && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {proposal.telefone_cliente}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(proposal.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            {proposal.buildings && proposal.buildings.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {proposal.buildings.length} prédio(s)
                              </span>
                            )}
                            <span className="font-medium text-gray-600">
                              {formatCurrency(proposal.valor_total || 0)}
                            </span>
                          </div>
                        </div>

                        <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}

        {step === 'confirm' && selectedProposal && (
          <div className="space-y-6">
            {/* Preview Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{selectedProposal.nome_cliente}</h3>
                  <p className="text-sm text-gray-500">{selectedProposal.cnpj_cliente || 'CNPJ não informado'}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {getStatusBadge(selectedProposal.status)}
                    <span className="text-sm font-medium text-gray-700">
                      {formatCurrency(selectedProposal.valor_total || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email para a conta
              </Label>
              <Input
                id="email"
                type="email"
                value={emailOverride}
                onChange={(e) => setEmailOverride(e.target.value)}
                placeholder="cliente@empresa.com"
                className="bg-white border-gray-200"
              />
              <p className="text-xs text-gray-500">
                O cliente receberá as credenciais de acesso neste email
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Ao confirmar:</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li>Uma conta será criada para o cliente</li>
                    <li>Uma senha segura será gerada automaticamente</li>
                    <li>As credenciais serão copiadas para sua área de transferência</li>
                    {selectedProposal.status === 'aceita' && (
                      <li>Um pedido será criado automaticamente</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'confirm' && (
            <Button variant="outline" onClick={handleBack}>
              Voltar
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {step === 'confirm' && (
            <Button
              onClick={handleCreateAccount}
              disabled={creating || !emailOverride.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Criar Conta
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
