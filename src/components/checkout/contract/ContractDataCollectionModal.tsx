import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, CheckCircle, Loader2, User, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ContractData {
  primeiro_nome: string;
  sobrenome: string;
  cpf: string;
  data_nascimento: string;
  email: string;
}

interface ContractDataCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedidoId: string;
  userEmail?: string;
  userName?: string;
  onSuccess: () => void;
}

const ContractDataCollectionModal: React.FC<ContractDataCollectionModalProps> = ({
  isOpen,
  onClose,
  pedidoId,
  userEmail = '',
  userName = '',
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContractData>({
    primeiro_nome: '',
    sobrenome: '',
    cpf: '',
    data_nascimento: '',
    email: userEmail
  });

  // Preencher nome se disponível
  useEffect(() => {
    if (userName) {
      const nameParts = userName.split(' ');
      setFormData(prev => ({
        ...prev,
        primeiro_nome: nameParts[0] || '',
        sobrenome: nameParts.slice(1).join(' ') || '',
        email: userEmail || prev.email
      }));
    }
  }, [userName, userEmail]);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  };

  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    return numbers.length === 11;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.primeiro_nome.trim()) {
      toast.error('Preencha o primeiro nome');
      return;
    }
    if (!formData.sobrenome.trim()) {
      toast.error('Preencha o sobrenome');
      return;
    }
    if (!validateCPF(formData.cpf)) {
      toast.error('CPF inválido');
      return;
    }
    if (!formData.data_nascimento) {
      toast.error('Preencha a data de nascimento');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Preencha o e-mail');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('📄 [ContractModal] Enviando dados do contrato:', { pedidoId, formData });
      
      // Chamar edge function para enviar contrato
      const { data, error } = await supabase.functions.invoke('send-contract-email', {
        body: {
          pedidoId,
          clientEmail: formData.email,
          clientName: `${formData.primeiro_nome} ${formData.sobrenome}`,
          clientCpf: formData.cpf.replace(/\D/g, ''),
          clientBirthDate: formData.data_nascimento
        }
      });

      if (error) throw error;

      console.log('✅ [ContractModal] Contrato enviado:', data);
      toast.success('Contrato enviado para seu e-mail!');
      onSuccess();
    } catch (error: any) {
      console.error('❌ [ContractModal] Erro:', error);
      toast.error(error.message || 'Erro ao enviar contrato');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Dados para o Contrato
          </DialogTitle>
          <DialogDescription>
            Preencha seus dados para receber o contrato por e-mail.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1">
                <User className="h-3 w-3" />
                Primeiro Nome
              </Label>
              <Input
                value={formData.primeiro_nome}
                onChange={(e) => setFormData(prev => ({ ...prev, primeiro_nome: e.target.value }))}
                placeholder="João"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Sobrenome</Label>
              <Input
                value={formData.sobrenome}
                onChange={(e) => setFormData(prev => ({ ...prev, sobrenome: e.target.value }))}
                placeholder="Silva"
                className="mt-1"
                required
              />
            </div>
          </div>

          {/* CPF */}
          <div>
            <Label className="text-xs flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              CPF
            </Label>
            <Input
              value={formData.cpf}
              onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
              placeholder="000.000.000-00"
              className="mt-1"
              maxLength={14}
              required
            />
          </div>

          {/* Data de Nascimento */}
          <div>
            <Label className="text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Data de Nascimento
            </Label>
            <Input
              type="date"
              value={formData.data_nascimento}
              onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
              className="mt-1"
              required
            />
          </div>

          {/* E-mail */}
          <div>
            <Label className="text-xs">E-mail para receber o contrato</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="seu@email.com"
              className="mt-1"
              required
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#9C1E1E] hover:bg-[#7A1818]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Enviar Contrato
                </>
              )}
            </Button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-2">
          📧 Você receberá o contrato no e-mail informado
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ContractDataCollectionModal;
