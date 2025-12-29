import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Save, Lock, Clock, Bot, Loader2, Globe, Smartphone } from 'lucide-react';
import { AdditionalConfiguration } from '@/hooks/useAdditionalConfigurations';
import { toast } from '@/hooks/use-toast';
import { ActiveSessionsManager } from '../security/ActiveSessionsManager';
import { Login2FAConfig } from '../security/Login2FAConfig';

interface SecurityTabProps {
  config: AdditionalConfiguration | null;
  updateConfig: (updates: Partial<AdditionalConfiguration>) => Promise<boolean>;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ config, updateConfig }) => {
  const [localConfig, setLocalConfig] = useState(config || {} as any);
  const [saving, setSaving] = useState(false);
  const [savingSofia, setSavingSofia] = useState<string | null>(null);

  React.useEffect(() => {
    if (config) setLocalConfig(config);
  }, [config]);

  const handleChange = (field: string, value: any) => {
    setLocalConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  // Handler específico para toggles da Sofia - salva automaticamente
  const handleSofiaToggle = async (field: 'sofia_ativa' | 'sofia_2fa_gerente_master', value: boolean) => {
    setSavingSofia(field);
    setLocalConfig((prev: any) => ({ ...prev, [field]: value }));
    
    const success = await updateConfig({ [field]: value });
    
    if (success) {
      toast({
        title: field === 'sofia_ativa' ? 'Sofia atualizada' : '2FA atualizado',
        description: value ? 'Configuração ativada com sucesso' : 'Configuração desativada com sucesso',
      });
    }
    
    setSavingSofia(null);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateConfig(localConfig);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Controle de Login */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Controle de Login
          </CardTitle>
          <CardDescription>
            Configurações de segurança para autenticação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seguranca_max_tentativas_login">
                Máximo de Tentativas de Login
              </Label>
              <Input
                id="seguranca_max_tentativas_login"
                type="number"
                min="3"
                max="10"
                value={localConfig.seguranca_max_tentativas_login || 5}
                onChange={(e) => handleChange('seguranca_max_tentativas_login', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Número de tentativas antes de bloquear
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seguranca_tempo_bloqueio_minutos">
                Tempo de Bloqueio (minutos)
              </Label>
              <Input
                id="seguranca_tempo_bloqueio_minutos"
                type="number"
                min="5"
                max="120"
                value={localConfig.seguranca_tempo_bloqueio_minutos || 15}
                onChange={(e) => handleChange('seguranca_tempo_bloqueio_minutos', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Duração do bloqueio temporário
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Gerenciamento de Sessões
          </CardTitle>
          <CardDescription>
            Controle de duração e expiração de sessões
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seguranca_sessao_timeout_minutos">
              Timeout de Sessão (minutos)
            </Label>
            <Input
              id="seguranca_sessao_timeout_minutos"
              type="number"
              min="30"
              max="1440"
              value={localConfig.seguranca_sessao_timeout_minutos || 480}
              onChange={(e) => handleChange('seguranca_sessao_timeout_minutos', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Tempo de inatividade até logout automático (padrão: 480 = 8 horas)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configurações da Sofia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-violet-500" />
            Configurações da Sofia
          </CardTitle>
          <CardDescription>
            Controle a IA assistente Sofia no site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="sofia_ativa" className="font-medium">
                Sofia Ativa no Site
              </Label>
              <p className="text-xs text-muted-foreground">
                Se desligado, o ícone da Sofia ficará oculto em todo o site
              </p>
            </div>
            {savingSofia === 'sofia_ativa' ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="sofia_ativa"
                checked={localConfig.sofia_ativa ?? true}
                onCheckedChange={(checked) => handleSofiaToggle('sofia_ativa', checked)}
              />
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="sofia_2fa_gerente_master" className="font-medium">
                2FA para Modo Gerente Master
              </Label>
              <p className="text-xs text-muted-foreground">
                Se desligado, a Sofia inicia diretamente em modo gerente master sem pedir código
              </p>
            </div>
            {savingSofia === 'sofia_2fa_gerente_master' ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="sofia_2fa_gerente_master"
                checked={localConfig.sofia_2fa_gerente_master ?? true}
                onCheckedChange={(checked) => handleSofiaToggle('sofia_2fa_gerente_master', checked)}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sessões Ativas do Master */}
      <ActiveSessionsManager />

      {/* Autenticação em Dois Fatores */}
      <Login2FAConfig config={config} updateConfig={updateConfig} />

      {/* Alertas de Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Alertas e Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
            <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
              <li>✓ Use senhas fortes com mínimo de 8 caracteres</li>
              <li>✓ Habilite autenticação em dois fatores quando disponível</li>
              <li>✓ Revise logs de acesso regularmente</li>
              <li>✓ Mantenha as integrações atualizadas</li>
              <li>✓ Configure alertas de segurança por email</li>
            </ul>
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
