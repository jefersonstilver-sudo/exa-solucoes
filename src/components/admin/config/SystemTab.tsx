import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Save, 
  AlertTriangle,
  Database,
  HardDrive,
  Info,
  CheckCircle,
  Settings
} from 'lucide-react';
import { AdditionalConfiguration } from '@/hooks/useAdditionalConfigurations';
import type { SystemConfiguration } from '@/hooks/useConfigurationsData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SystemTabProps {
  baseConfig: SystemConfiguration | null;
  updateBaseConfig: (updates: Partial<SystemConfiguration>) => Promise<boolean>;
  additionalConfig: AdditionalConfiguration | null;
  updateAdditionalConfig: (updates: Partial<AdditionalConfiguration>) => Promise<boolean>;
}

export const SystemTab: React.FC<SystemTabProps> = ({ 
  baseConfig, 
  updateBaseConfig,
  additionalConfig,
  updateAdditionalConfig 
}) => {
  const [localConfig, setLocalConfig] = useState(additionalConfig || {} as any);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (additionalConfig) setLocalConfig(additionalConfig);
  }, [additionalConfig]);

  const handleChange = (field: string, value: any) => {
    setLocalConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleEmergencyModeToggle = async (checked: boolean) => {
    await updateBaseConfig({ modo_emergencia: checked });
  };

  const handleSaveAdditional = async () => {
    setSaving(true);
    await updateAdditionalConfig(localConfig);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Modo Emergência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Modo Emergência
          </CardTitle>
          <CardDescription>
            Restringe o acesso ao sistema apenas para administradores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Status Atual</p>
              {baseConfig?.modo_emergencia ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  MODO EMERGÊNCIA ATIVO
                </Badge>
              ) : (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  SISTEMA OPERACIONAL
                </Badge>
              )}
            </div>
            <Switch
              checked={baseConfig?.modo_emergencia || false}
              onCheckedChange={handleEmergencyModeToggle}
            />
          </div>

          {baseConfig?.updated_at && (
            <div className="text-xs text-muted-foreground">
              Última atualização: {format(new Date(baseConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="manutencao_mensagem">Mensagem de Manutenção</Label>
            <Textarea
              id="manutencao_mensagem"
              value={localConfig.manutencao_mensagem || ''}
              onChange={(e) => handleChange('manutencao_mensagem', e.target.value)}
              placeholder="Sistema em manutenção. Voltaremos em breve."
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Mensagem exibida quando o modo emergência está ativado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Informações do Sistema
          </CardTitle>
          <CardDescription>
            Status e métricas da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Database className="w-4 h-4 text-green-600" />
                <span className="text-muted-foreground">Supabase:</span>
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Conectado
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Server className="w-4 h-4 text-blue-600" />
                <span className="text-muted-foreground">Edge Functions:</span>
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Operacional
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <HardDrive className="w-4 h-4 text-purple-600" />
                <span className="text-muted-foreground">Ambiente:</span>
                <Badge variant="outline">Production</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-amber-600" />
                <span className="text-muted-foreground">Versão:</span>
                <Badge variant="outline">2.5.1</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup e Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Backup e Manutenção
          </CardTitle>
          <CardDescription>
            Configurações de backup automático
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Backup Automático</Label>
              <p className="text-xs text-muted-foreground">
                Ativar backups automáticos do banco de dados
              </p>
            </div>
            <Switch
              checked={localConfig.backup_automatico_ativo || false}
              onCheckedChange={(checked) => handleChange('backup_automatico_ativo', checked)}
            />
          </div>

          {localConfig.backup_automatico_ativo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backup_frequencia">Frequência</Label>
                <select
                  id="backup_frequencia"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={localConfig.backup_frequencia || 'daily'}
                  onChange={(e) => handleChange('backup_frequencia', e.target.value)}
                >
                  <option value="hourly">A cada hora</option>
                  <option value="daily">Diariamente</option>
                  <option value="weekly">Semanalmente</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup_retencao_dias">Retenção (dias)</Label>
                <Input
                  id="backup_retencao_dias"
                  type="number"
                  min="7"
                  max="365"
                  value={localConfig.backup_retencao_dias || 30}
                  onChange={(e) => handleChange('backup_retencao_dias', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Limites e Cotas */}
      <Card>
        <CardHeader>
          <CardTitle>Limites e Cotas do Sistema</CardTitle>
          <CardDescription>
            Limites operacionais da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="limite_videos_por_cliente">
                Vídeos por Cliente
              </Label>
              <Input
                id="limite_videos_por_cliente"
                type="number"
                min="1"
                max="100"
                value={localConfig.limite_videos_por_cliente || 5}
                onChange={(e) => handleChange('limite_videos_por_cliente', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limite_tamanho_video_mb">
                Tamanho Vídeo (MB)
              </Label>
              <Input
                id="limite_tamanho_video_mb"
                type="number"
                min="100"
                max="5000"
                value={localConfig.limite_tamanho_video_mb || 500}
                onChange={(e) => handleChange('limite_tamanho_video_mb', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limite_pedidos_simultaneos">
                Pedidos Simultâneos
              </Label>
              <Input
                id="limite_pedidos_simultaneos"
                type="number"
                min="1"
                max="100"
                value={localConfig.limite_pedidos_simultaneos || 10}
                onChange={(e) => handleChange('limite_pedidos_simultaneos', parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outras Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Outras Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Modo Demonstração</Label>
              <p className="text-xs text-muted-foreground">
                Exibir avisos de modo demonstração
              </p>
            </div>
            <Switch
              checked={localConfig.modo_demonstracao || false}
              onCheckedChange={(checked) => handleChange('modo_demonstracao', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Mostrar Preços</Label>
              <p className="text-xs text-muted-foreground">
                Exibir preços na loja pública
              </p>
            </div>
            <Switch
              checked={localConfig.mostrar_precos ?? true}
              onCheckedChange={(checked) => handleChange('mostrar_precos', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Permitir Registro Público</Label>
              <p className="text-xs text-muted-foreground">
                Permitir que visitantes criem contas
              </p>
            </div>
            <Switch
              checked={localConfig.permitir_registro_publico || false}
              onCheckedChange={(checked) => handleChange('permitir_registro_publico', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSaveAdditional} disabled={saving}>
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
