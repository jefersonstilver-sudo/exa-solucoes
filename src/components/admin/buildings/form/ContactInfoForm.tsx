
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle } from 'lucide-react';

interface ContactInfoFormProps {
  formData: {
    nome_sindico: string;
    contato_sindico: string;
    nome_vice_sindico: string;
    contato_vice_sindico: string;
    nome_contato_predio: string;
    numero_contato_predio: string;
  };
  onUpdate: (updates: Partial<ContactInfoFormProps['formData']>) => void;
}

const ContactInfoForm: React.FC<ContactInfoFormProps> = ({ formData, onUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserCircle className="h-5 w-5 mr-2" />
          Contatos do Prédio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome_sindico">Nome do Síndico</Label>
            <Input
              id="nome_sindico"
              value={formData.nome_sindico}
              onChange={(e) => onUpdate({ nome_sindico: e.target.value })}
              placeholder="Nome completo (opcional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contato_sindico">Contato do Síndico</Label>
            <Input
              id="contato_sindico"
              value={formData.contato_sindico}
              onChange={(e) => onUpdate({ contato_sindico: e.target.value })}
              placeholder="Telefone/Email (opcional)"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome_vice_sindico">Nome do Vice-Síndico</Label>
            <Input
              id="nome_vice_sindico"
              value={formData.nome_vice_sindico}
              onChange={(e) => onUpdate({ nome_vice_sindico: e.target.value })}
              placeholder="Nome completo (opcional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contato_vice_sindico">Contato do Vice-Síndico</Label>
            <Input
              id="contato_vice_sindico"
              value={formData.contato_vice_sindico}
              onChange={(e) => onUpdate({ contato_vice_sindico: e.target.value })}
              placeholder="Telefone/Email (opcional)"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome_contato_predio">Contato do Prédio</Label>
            <Input
              id="nome_contato_predio"
              value={formData.nome_contato_predio}
              onChange={(e) => onUpdate({ nome_contato_predio: e.target.value })}
              placeholder="Portaria/Administração (opcional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numero_contato_predio">Número do Prédio</Label>
            <Input
              id="numero_contato_predio"
              value={formData.numero_contato_predio}
              onChange={(e) => onUpdate({ numero_contato_predio: e.target.value })}
              placeholder="Telefone principal (opcional)"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactInfoForm;
