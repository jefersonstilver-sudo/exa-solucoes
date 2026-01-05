import React, { useState } from 'react';
import { GitMerge, AlertTriangle, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Contact, CATEGORIAS_CONFIG } from '@/types/contatos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

interface ConsolidateContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  onSuccess?: () => void;
}

export const ConsolidateContactModal: React.FC<ConsolidateContactModalProps> = ({
  open,
  onOpenChange,
  contacts,
  onSuccess
}) => {
  const [primaryId, setPrimaryId] = useState<string>(contacts[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();

  const handleConsolidate = async () => {
    if (!primaryId) {
      toast.error('Selecione o contato principal');
      return;
    }

    try {
      setLoading(true);

      const primaryContact = contacts.find(c => c.id === primaryId);
      const secondaryContacts = contacts.filter(c => c.id !== primaryId);

      if (!primaryContact || secondaryContacts.length === 0) {
        toast.error('Erro ao identificar contatos');
        return;
      }

      // Mesclar dados: preencher campos vazios do primário com dados dos secundários
      const mergedData: Partial<Contact> = {};
      
      const fieldsToMerge: (keyof Contact)[] = [
        'sobrenome', 'empresa', 'email', 'website', 'cnpj',
        'endereco', 'bairro', 'cidade', 'estado', 'cep',
        'onde_anuncia_hoje', 'publico_alvo', 'dores_identificadas',
        'observacoes_estrategicas', 'tomador_decisao', 'cargo_tomador',
        'tipo_negocio', 'instagram', 'ticket_estimado', 'logo_url'
      ];

      for (const field of fieldsToMerge) {
        if (!primaryContact[field]) {
          for (const secondary of secondaryContacts) {
            if (secondary[field]) {
              (mergedData as any)[field] = secondary[field];
              break;
            }
          }
        }
      }

      // Atualizar contato principal com dados mesclados
      if (Object.keys(mergedData).length > 0) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update({
            ...mergedData,
            is_potential_duplicate: false,
            duplicate_group_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', primaryId);

        if (updateError) throw updateError;
      } else {
        // Apenas remover flag de duplicado
        const { error: updateError } = await supabase
          .from('contacts')
          .update({
            is_potential_duplicate: false,
            duplicate_group_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', primaryId);

        if (updateError) throw updateError;
      }

      // Arquivar contatos secundários
      for (const secondary of secondaryContacts) {
        const { error: archiveError } = await supabase
          .from('contacts')
          .update({
            status: 'arquivado',
            is_potential_duplicate: false,
            duplicate_group_id: null,
            observacoes_estrategicas: `[CONSOLIDADO] Mesclado ao contato ${primaryContact.nome} (${primaryContact.telefone}) em ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n\n${secondary.observacoes_estrategicas || ''}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', secondary.id);

        if (archiveError) {
          console.error('Erro ao arquivar contato:', archiveError);
        }
      }

      toast.success(`Contatos consolidados! ${secondaryContacts.length} registro(s) arquivado(s)`);
      onOpenChange(false);
      onSuccess?.();
      
      // Redirecionar para o contato principal se não for o atual
      navigate(buildPath(`contatos/${primaryId}`));
    } catch (error: any) {
      console.error('Erro ao consolidar contatos:', error);
      toast.error(error.message || 'Erro ao consolidar contatos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-amber-600" />
            Consolidar Contatos Duplicados
          </DialogTitle>
          <DialogDescription>
            Selecione qual contato será mantido como principal. Os demais serão arquivados e seus dados mesclados.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              O contato principal receberá os dados complementares dos demais. 
              Os contatos secundários serão arquivados com nota de consolidação.
            </p>
          </div>

          <RadioGroup value={primaryId} onValueChange={setPrimaryId} className="space-y-2">
            {contacts.map((contact, index) => (
              <div
                key={contact.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                  primaryId === contact.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value={contact.id} id={contact.id} className="mt-1" />
                <Label htmlFor={contact.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {contact.empresa || contact.nome}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${CATEGORIAS_CONFIG[contact.categoria]?.bgColor} ${CATEGORIAS_CONFIG[contact.categoria]?.color}`}>
                      {CATEGORIAS_CONFIG[contact.categoria]?.emoji}
                    </span>
                    {index === 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        Mais antigo
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {contact.telefone}
                    {contact.email && ` • ${contact.email}`}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Criado em {format(new Date(contact.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </Label>
                {primaryId === contact.id && (
                  <Check className="h-4 w-4 text-primary mt-1" />
                )}
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConsolidate} disabled={loading || !primaryId}>
            {loading ? 'Consolidando...' : 'Consolidar Contatos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
