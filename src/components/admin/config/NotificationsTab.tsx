import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Save, Mail } from 'lucide-react';
import { AdditionalConfiguration } from '@/hooks/useAdditionalConfigurations';

interface NotificationsTabProps {
  config: AdditionalConfiguration | null;
  updateConfig: (updates: Partial<AdditionalConfiguration>) => Promise<boolean>;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ config, updateConfig }) => {
  const [localConfig, setLocalConfig] = useState(config || {} as any);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (config) setLocalConfig(config);
  }, [config]);

  const handleChange = (field: string, value: any) => {
    setLocalConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await updateConfig(localConfig);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Notificações por Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Notificações por Email
          </CardTitle>
          <CardDescription>
            Configure quais eventos devem gerar notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notificacoes_admin_email">Email do Administrador</Label>
            <Input
              id="notificacoes_admin_email"
              type="email"
              value={localConfig.notificacoes_admin_email || ''}
              onChange={(e) => handleChange('notificacoes_admin_email', e.target.value)}
              placeholder="admin@examidia.com.br"
            />
            <p className="text-xs text-muted-foreground">
              Email que receberá as notificações administrativas
            </p>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Sistema de Notificações</Label>
              <p className="text-xs text-muted-foreground">
                Ativar/desativar todas as notificações por email
              </p>
            </div>
            <Switch
              checked={localConfig.notificacoes_email_ativas || false}
              onCheckedChange={(checked) => handleChange('notificacoes_email_ativas', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tipos de Notificações */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos que Geram Notificações</CardTitle>
          <CardDescription>
            Escolha quais eventos devem enviar alertas por email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Novos Pedidos</Label>
              <p className="text-xs text-muted-foreground">
                Notificar quando um novo pedido for criado
              </p>
            </div>
            <Switch
              checked={localConfig.notificacoes_pedidos_novos || false}
              onCheckedChange={(checked) => handleChange('notificacoes_pedidos_novos', checked)}
              disabled={!localConfig.notificacoes_email_ativas}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Pagamentos Recebidos</Label>
              <p className="text-xs text-muted-foreground">
                Notificar quando um pagamento for confirmado
              </p>
            </div>
            <Switch
              checked={localConfig.notificacoes_pagamentos || false}
              onCheckedChange={(checked) => handleChange('notificacoes_pagamentos', checked)}
              disabled={!localConfig.notificacoes_email_ativas}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Novos Clientes</Label>
              <p className="text-xs text-muted-foreground">
                Notificar quando um novo cliente se registrar
              </p>
            </div>
            <Switch
              checked={localConfig.notificacoes_clientes_novos || false}
              onCheckedChange={(checked) => handleChange('notificacoes_clientes_novos', checked)}
              disabled={!localConfig.notificacoes_email_ativas}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Save className="w-4 h-4 mr-2 animate-pulse" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
