
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
    preco_base: number;
    status: string;
    monthly_traffic: number;
  };
  onUpdate: (updates: Partial<CommercialDataFormProps['formData']>) => void;
}

const CommercialDataForm: React.FC<CommercialDataFormProps> = ({ formData, onUpdate }) => {
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
              onChange={(e) => onUpdate({ numero_unidades: parseInt(e.target.value) || 0 })}
              min="0"
              placeholder="Ex: 120 (opcional)"
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
