
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface PanelRemoteFormProps {
  formData: any;
  showPassword: boolean;
  onFormUpdate: (field: string, value: string) => void;
  onTogglePassword: () => void;
}

const PanelRemoteForm: React.FC<PanelRemoteFormProps> = ({
  formData,
  showPassword,
  onFormUpdate,
  onTogglePassword
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acesso Remoto</CardTitle>
        <CardDescription>Configure as credenciais de acesso remoto via AnyDesk</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="codigo_anydesk">Código AnyDesk</Label>
          <Input
            id="codigo_anydesk"
            value={formData.codigo_anydesk}
            onChange={(e) => onFormUpdate('codigo_anydesk', e.target.value)}
            placeholder="Ex: 123 456 789"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="senha_anydesk">Senha AnyDesk</Label>
          <div className="relative">
            <Input
              id="senha_anydesk"
              type={showPassword ? "text" : "password"}
              value={formData.senha_anydesk}
              onChange={(e) => onFormUpdate('senha_anydesk', e.target.value)}
              placeholder="Senha de acesso"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={onTogglePassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PanelRemoteForm;
