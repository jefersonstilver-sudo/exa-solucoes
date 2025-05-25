
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

interface BasicInfoFormProps {
  formData: {
    nome: string;
    endereco: string;
    bairro: string;
    venue_type: string;
    padrao_publico: 'alto' | 'medio' | 'normal';
    latitude: number;
    longitude: number;
  };
  onUpdate: (updates: Partial<BasicInfoFormProps['formData']>) => void;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ formData, onUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Dados Básicos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Prédio</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => onUpdate({ nome: e.target.value })}
            placeholder="Ex: Residencial Solar do Jardim (opcional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endereco">Endereço Completo</Label>
          <Textarea
            id="endereco"
            value={formData.endereco}
            onChange={(e) => onUpdate({ endereco: e.target.value })}
            placeholder="Rua, número, complemento... (opcional)"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={formData.bairro}
              onChange={(e) => onUpdate({ bairro: e.target.value })}
              placeholder="Bairro (opcional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue_type">Tipo de Prédio</Label>
            <Select
              value={formData.venue_type}
              onValueChange={(value) => onUpdate({ venue_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="Residencial">🏠 Residencial</SelectItem>
                <SelectItem value="Comercial">🏢 Comercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="padrao_publico">Categoria</Label>
          <Select
            value={formData.padrao_publico}
            onValueChange={(value: 'alto' | 'medio' | 'normal') => 
              onUpdate({ padrao_publico: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="medio">Intermediário</SelectItem>
              <SelectItem value="alto">Alto Padrão</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => onUpdate({ latitude: parseFloat(e.target.value) || 0 })}
              placeholder="Coordenada (opcional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => onUpdate({ longitude: parseFloat(e.target.value) || 0 })}
              placeholder="Coordenada (opcional)"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicInfoForm;
