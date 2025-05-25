
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PanelBasicFormProps {
  formData: any;
  buildings: any[];
  onFormUpdate: (field: string, value: string) => void;
}

const PanelBasicForm: React.FC<PanelBasicFormProps> = ({
  formData,
  buildings,
  onFormUpdate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Básicas</CardTitle>
        <CardDescription>Configure as informações principais do painel</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código do Painel *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => onFormUpdate('code', e.target.value)}
            placeholder="Ex: PANEL001"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="building_id">Prédio *</Label>
          <Select value={formData.building_id} onValueChange={(value) => onFormUpdate('building_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um prédio" />
            </SelectTrigger>
            <SelectContent>
              {buildings.map((building) => (
                <SelectItem key={building.id} value={building.id}>
                  {building.nome} - {building.bairro}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => onFormUpdate('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="maintenance">Manutenção</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="localizacao">Localização</Label>
          <Input
            id="localizacao"
            value={formData.localizacao}
            onChange={(e) => onFormUpdate('localizacao', e.target.value)}
            placeholder="Ex: Térreo - Hall Principal"
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            value={formData.observacoes}
            onChange={(e) => onFormUpdate('observacoes', e.target.value)}
            placeholder="Observações gerais sobre o painel"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PanelBasicForm;
