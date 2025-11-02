
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CommercialDataFormProps {
  formData: {
    numero_unidades: number;
    numero_andares: number;
    numero_elevadores: number;
    numero_blocos: number;
    publico_estimado: number;
    preco_base: number;
    status: string;
  };
  onUpdate: (updates: Partial<CommercialDataFormProps['formData']>) => void;
}

const CommercialDataForm: React.FC<CommercialDataFormProps> = ({ formData, onUpdate }) => {
  // Função para calcular público estimado automaticamente
  const handleUnidadesChange = (value: number) => {
    const publicoCalculado = value * 3;
    onUpdate({ 
      numero_unidades: value,
      publico_estimado: publicoCalculado 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Comerciais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numero_unidades">Número de Unidades</Label>
            <Input
              id="numero_unidades"
              type="number"
              value={formData.numero_unidades}
              onChange={(e) => handleUnidadesChange(parseInt(e.target.value) || 0)}
              min="0"
              placeholder="Ex: 120 (opcional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publico_estimado">Público Aproximado</Label>
            <Input
              id="publico_estimado"
              type="number"
              value={formData.publico_estimado}
              onChange={(e) => onUpdate({ publico_estimado: parseInt(e.target.value) || 0 })}
              min="0"
              placeholder="Calculado automaticamente (editável)"
            />
            <p className="text-xs text-muted-foreground">
              Calculado como: {formData.numero_unidades} unidades × 3 = {formData.numero_unidades * 3}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numero_andares">Número de Andares</Label>
            <Input
              id="numero_andares"
              type="number"
              value={formData.numero_andares}
              onChange={(e) => onUpdate({ numero_andares: parseInt(e.target.value) || 0 })}
              min="0"
              placeholder="Ex: 15 (opcional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numero_elevadores">Número de Telas</Label>
            <Input
              id="numero_elevadores"
              type="number"
              value={formData.numero_elevadores}
              onChange={(e) => onUpdate({ numero_elevadores: parseInt(e.target.value) || 0 })}
              min="0"
              placeholder="Ex: 2 (opcional)"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="numero_blocos">Número de Blocos</Label>
          <Input
            id="numero_blocos"
            type="number"
            value={formData.numero_blocos}
            onChange={(e) => onUpdate({ numero_blocos: parseInt(e.target.value) || 1 })}
            min="1"
            placeholder="Ex: 1 (opcional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preco_base">Preço Base (R$)</Label>
          <Input
            id="preco_base"
            type="number"
            step="0.01"
            value={formData.preco_base}
            onChange={(e) => onUpdate({ preco_base: parseFloat(e.target.value) || 0 })}
            min="0"
            placeholder="Ex: 1500.00 (opcional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => onUpdate({ status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="manutenção">Manutenção</SelectItem>
              <SelectItem value="instalação">Instalação</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </CardContent>
    </Card>
  );
};

export default CommercialDataForm;
