import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, Save, BarChart3 } from 'lucide-react';
import { AdditionalConfiguration } from '@/hooks/useAdditionalConfigurations';

interface IntegrationsTabProps {
  config: AdditionalConfiguration | null;
  updateConfig: (updates: Partial<AdditionalConfiguration>) => Promise<boolean>;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({ config, updateConfig }) => {
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
      {/* Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Ferramentas de Analytics
          </CardTitle>
          <CardDescription>
            IDs de integração com ferramentas de análise e marketing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
            <Input
              id="google_analytics_id"
              value={localConfig.google_analytics_id || ''}
              onChange={(e) => handleChange('google_analytics_id', e.target.value)}
              placeholder="G-XXXXXXXXXX"
            />
            <p className="text-xs text-muted-foreground">
              ID do Google Analytics 4 (formato: G-XXXXXXXXXX)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_tag_manager_id">Google Tag Manager ID</Label>
            <Input
              id="google_tag_manager_id"
              value={localConfig.google_tag_manager_id || ''}
              onChange={(e) => handleChange('google_tag_manager_id', e.target.value)}
              placeholder="GTM-XXXXXXX"
            />
            <p className="text-xs text-muted-foreground">
              ID do Google Tag Manager (formato: GTM-XXXXXXX)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
            <Input
              id="facebook_pixel_id"
              value={localConfig.facebook_pixel_id || ''}
              onChange={(e) => handleChange('facebook_pixel_id', e.target.value)}
              placeholder="123456789012345"
            />
            <p className="text-xs text-muted-foreground">
              ID do pixel do Facebook/Meta
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Outras Integrações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Outras Integrações
          </CardTitle>
          <CardDescription>
            Configurações de integrações adicionais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p>
              Integrações adicionais podem ser configuradas conforme necessário.
              Entre em contato com o suporte para ativar novas integrações.
            </p>
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
