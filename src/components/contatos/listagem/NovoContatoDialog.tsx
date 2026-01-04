import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORIAS_ORDER, CATEGORIAS_CONFIG, CategoriaContato, Contact } from '@/types/contatos';
import { useContatos } from '@/hooks/contatos';

interface NovoContatoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NovoContatoDialog: React.FC<NovoContatoDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { createContact } = useContatos();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Contact>>({
    nome: '',
    sobrenome: '',
    empresa: '',
    telefone: '',
    email: '',
    categoria: 'lead',
    bairro: '',
    cidade: 'Foz do Iguaçu',
    estado: 'PR',
    tipo_negocio: '',
    origem: ''
  });

  const handleChange = (field: keyof Contact, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.telefone || !formData.categoria) {
      return;
    }

    setLoading(true);
    try {
      await createContact(formData);
      onOpenChange(false);
      setFormData({
        nome: '',
        sobrenome: '',
        empresa: '',
        telefone: '',
        email: '',
        categoria: 'lead',
        bairro: '',
        cidade: 'Foz do Iguaçu',
        estado: 'PR',
        tipo_negocio: '',
        origem: ''
      });
    } catch (error) {
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contato</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Categoria - OBRIGATÓRIO */}
          <div className="space-y-2">
            <Label htmlFor="categoria" className="text-sm font-semibold">
              Categoria <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.categoria}
              onValueChange={(v) => handleChange('categoria', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_ORDER.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORIAS_CONFIG[cat].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome <span className="text-red-500">*</span></Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Nome"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sobrenome">Sobrenome</Label>
              <Input
                id="sobrenome"
                value={formData.sobrenome}
                onChange={(e) => handleChange('sobrenome', e.target.value)}
                placeholder="Sobrenome"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="empresa">Empresa</Label>
            <Input
              id="empresa"
              value={formData.empresa}
              onChange={(e) => handleChange('empresa', e.target.value)}
              placeholder="Nome da empresa"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone <span className="text-red-500">*</span></Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@empresa.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => handleChange('bairro', e.target.value)}
                placeholder="Bairro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => handleChange('cidade', e.target.value)}
                placeholder="Cidade"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_negocio">Tipo de Negócio</Label>
              <Input
                id="tipo_negocio"
                value={formData.tipo_negocio}
                onChange={(e) => handleChange('tipo_negocio', e.target.value)}
                placeholder="Ex: Restaurante, Loja, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="origem">Origem</Label>
              <Select
                value={formData.origem || ''}
                onValueChange={(v) => handleChange('origem', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Como conheceu?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="maps">Google Maps</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="rua">Prospecção na rua</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Contato'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NovoContatoDialog;
