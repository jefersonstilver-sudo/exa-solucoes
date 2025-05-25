
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PanelTechnicalFormProps {
  formData: any;
  panel?: any;
  onFormUpdate: (field: string, value: string) => void;
}

const PanelTechnicalForm: React.FC<PanelTechnicalFormProps> = ({
  formData,
  panel,
  onFormUpdate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Especificações Técnicas</CardTitle>
        <CardDescription>Especificações padrão: 22", 1080x1920 (Vertical), Linux</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="modelo">Modelo</Label>
          <Input
            id="modelo"
            value={formData.modelo}
            onChange={(e) => onFormUpdate('modelo', e.target.value)}
            placeholder="Ex: QM55R-T, 55UH5F-H"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="polegada">Tamanho (polegadas)</Label>
          <Input
            id="polegada"
            value={formData.polegada}
            onChange={(e) => onFormUpdate('polegada', e.target.value)}
            placeholder="Padrão: 22"
            disabled={!panel}
            className={!panel ? "bg-gray-100" : ""}
          />
          {!panel && (
            <p className="text-xs text-gray-500">Padrão fixo: 22 polegadas</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="orientacao">Orientação</Label>
          <Select 
            value={formData.orientacao} 
            onValueChange={(value) => onFormUpdate('orientacao', value)}
            disabled={!panel}
          >
            <SelectTrigger className={!panel ? "bg-gray-100" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horizontal">Horizontal (Paisagem)</SelectItem>
              <SelectItem value="vertical">Vertical (Retrato)</SelectItem>
            </SelectContent>
          </Select>
          {!panel && (
            <p className="text-xs text-gray-500">Padrão fixo: Vertical</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="resolucao">Resolução</Label>
          <Select 
            value={formData.resolucao} 
            onValueChange={(value) => onFormUpdate('resolucao', value)}
            disabled={!panel}
          >
            <SelectTrigger className={!panel ? "bg-gray-100" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1920x1080">Full HD (1920x1080)</SelectItem>
              <SelectItem value="3840x2160">4K UHD (3840x2160)</SelectItem>
              <SelectItem value="1366x768">HD (1366x768)</SelectItem>
              <SelectItem value="1080x1920">Full HD Vertical (1080x1920)</SelectItem>
              <SelectItem value="2160x3840">4K UHD Vertical (2160x3840)</SelectItem>
            </SelectContent>
          </Select>
          {!panel && (
            <p className="text-xs text-gray-500">Padrão fixo: 1080x1920 (Vertical)</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sistema_operacional">Sistema Operacional</Label>
          <Select 
            value={formData.sistema_operacional} 
            onValueChange={(value) => onFormUpdate('sistema_operacional', value)}
            disabled={!panel}
          >
            <SelectTrigger className={!panel ? "bg-gray-100" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="windows">Windows</SelectItem>
              <SelectItem value="linux">Linux</SelectItem>
              <SelectItem value="android">Android</SelectItem>
            </SelectContent>
          </Select>
          {!panel && (
            <p className="text-xs text-gray-500">Padrão fixo: Linux</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="versao_firmware">Versão do Firmware</Label>
          <Input
            id="versao_firmware"
            value={formData.versao_firmware}
            onChange={(e) => onFormUpdate('versao_firmware', e.target.value)}
            placeholder="Ex: 1.2.3, v2.0.1"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PanelTechnicalForm;
