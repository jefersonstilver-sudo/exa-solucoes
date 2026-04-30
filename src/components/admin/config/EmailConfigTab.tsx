import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Save } from 'lucide-react';
import { ResendStatusCard } from '@/components/admin/ResendStatusCard';
import { AdditionalConfiguration } from '@/hooks/useAdditionalConfigurations';

interface EmailConfigTabProps {
  config: AdditionalConfiguration | null;
  updateConfig: (updates: Partial<AdditionalConfiguration>) => Promise<boolean>;
}

export const EmailConfigTab: React.FC<EmailConfigTabProps> = ({ config, updateConfig }) => {
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
      {/* Status Resend */}
      <ResendStatusCard />

      {/* Configurações de Remetente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configurações de Remetente
          </CardTitle>
          <CardDescription>
            Informações que aparecerão nos emails enviados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email_remetente_nome">Nome do Remetente</Label>
              <Input
                id="email_remetente_nome"
                value={localConfig.email_remetente_nome || ''}
                onChange={(e) => handleChange('email_remetente_nome', e.target.value)}
                placeholder="EXA Soluções Digitais"
              />
              <p className="text-xs text-muted-foreground">
                Exemplo: "EXA Soluções Digitais" em "EXA Soluções Digitais &lt;noreply@examidia.com.br&gt;"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_remetente_email">Email do Remetente</Label>
              <Input
                id="email_remetente_email"
                type="email"
                value={localConfig.email_remetente_email || ''}
                onChange={(e) => handleChange('email_remetente_email', e.target.value)}
                placeholder="noreply@examidia.com.br"
              />
              <p className="text-xs text-muted-foreground">
                Deve ser um domínio verificado no Resend
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_footer_texto">Rodapé dos Emails</Label>
            <Textarea
              id="email_footer_texto"
              value={localConfig.email_footer_texto || ''}
              onChange={(e) => handleChange('email_footer_texto', e.target.value)}
              placeholder="© 2025 EXA Soluções Digitais LTDA. Todos os direitos reservados."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Texto que aparecerá no rodapé de todos os emails
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Termos e Políticas */}
      <Card>
        <CardHeader>
          <CardTitle>Links para Termos e Políticas</CardTitle>
          <CardDescription>
            URLs que serão incluídas nos emails e no site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="termos_uso_url">Termos de Uso</Label>
            <Input
              id="termos_uso_url"
              type="url"
              value={localConfig.termos_uso_url || ''}
              onChange={(e) => handleChange('termos_uso_url', e.target.value)}
              placeholder="https://www.examidia.com.br/termos-de-uso"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="politica_privacidade_url">Política de Privacidade</Label>
            <Input
              id="politica_privacidade_url"
              type="url"
              value={localConfig.politica_privacidade_url || ''}
              onChange={(e) => handleChange('politica_privacidade_url', e.target.value)}
              placeholder="https://www.examidia.com.br/politica-privacidade"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="politica_cookies_url">Política de Cookies</Label>
            <Input
              id="politica_cookies_url"
              type="url"
              value={localConfig.politica_cookies_url || ''}
              onChange={(e) => handleChange('politica_cookies_url', e.target.value)}
              placeholder="https://www.examidia.com.br/politica-cookies"
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
