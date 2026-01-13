import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddElevatorCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyAdded: () => void;
}

export const AddElevatorCompanyModal = ({
  isOpen,
  onClose,
  onCompanyAdded,
}: AddElevatorCompanyModalProps) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
  });

  const handleSave = async () => {
    if (!formData.nome_fantasia.trim()) {
      toast.error('Nome fantasia é obrigatório');
      return;
    }

    setSaving(true);
    try {
      // Gerar CNPJ único se não fornecido (para evitar conflito de constraint)
      const cnpjToUse = formData.cnpj.trim() || `ELEV-${Date.now()}`;

      const { error } = await supabase.from('fornecedores').insert({
        nome_fantasia: formData.nome_fantasia.trim(),
        razao_social: formData.razao_social.trim() || formData.nome_fantasia.trim(),
        cnpj: cnpjToUse,
        tipo: 'elevador',
        ativo: true,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('CNPJ já cadastrado para outro fornecedor');
          return;
        }
        throw error;
      }

      toast.success('Empresa de elevador cadastrada com sucesso!');
      setFormData({ nome_fantasia: '', razao_social: '', cnpj: '' });
      onCompanyAdded();
    } catch (error) {
      console.error('Erro ao cadastrar empresa:', error);
      toast.error('Erro ao cadastrar empresa de elevador');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({ nome_fantasia: '', razao_social: '', cnpj: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Nova Empresa de Elevador
          </DialogTitle>
          <DialogDescription>
            Cadastre uma nova empresa para vincular aos painéis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_fantasia">Nome Fantasia *</Label>
            <Input
              id="nome_fantasia"
              placeholder="Ex: ATLAS SCHINDLER"
              value={formData.nome_fantasia}
              onChange={(e) =>
                setFormData({ ...formData, nome_fantasia: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="razao_social">Razão Social</Label>
            <Input
              id="razao_social"
              placeholder="Ex: ELEVADORES ATLAS SCHINDLER S/A"
              value={formData.razao_social}
              onChange={(e) =>
                setFormData({ ...formData, razao_social: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0001-00"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Opcional. Se não preenchido, será gerado automaticamente.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
