
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PanelNetworkFormProps {
  formData: any;
  onFormUpdate: (field: string, value: string) => void;
}

const PanelNetworkForm: React.FC<PanelNetworkFormProps> = ({
  formData,
  onFormUpdate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Rede</CardTitle>
        <CardDescription>Configure as informações de rede do painel</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ip_interno">IP Interno</Label>
          <Input
            id="ip_interno"
            value={formData.ip_interno}
            onChange={(e) => onFormUpdate('ip_interno', e.target.value)}
            placeholder="Ex: 192.168.1.100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mac_address">Endereço MAC</Label>
          <Input
            id="mac_address"
            value={formData.mac_address}
            onChange={(e) => onFormUpdate('mac_address', e.target.value)}
            placeholder="Ex: 00:1B:44:11:3A:B7"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PanelNetworkForm;
