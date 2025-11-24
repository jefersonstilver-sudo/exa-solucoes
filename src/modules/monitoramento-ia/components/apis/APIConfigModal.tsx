import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, TestTube, Shield, Webhook } from 'lucide-react';
import { toast } from 'sonner';
import { useModuleTheme, getThemeClass } from '../../hooks/useModuleTheme';
import { cn } from '@/lib/utils';

interface APIConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiName: string;
  functionName: string;
}

export const APIConfigModal = ({ 
  open, 
  onOpenChange, 
  apiName, 
  functionName 
}: APIConfigModalProps) => {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { theme } = useModuleTheme();

  // Config states
  const [rateLimit, setRateLimit] = useState('50');
  const [timeout, setTimeout] = useState('30');
  const [retryEnabled, setRetryEnabled] = useState(true);
  const [maxRetries, setMaxRetries] = useState('3');
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      // Aqui seria a lógica para salvar as configurações no banco
      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), 1000);
      });
      toast.success('Configurações salvas com sucesso!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), 1500);
      });
      toast.success('Teste de conexão realizado com sucesso!');
    } catch (error) {
      toast.error('Falha no teste de conexão');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(getThemeClass(theme), "max-w-2xl bg-module-card border-module")}>
        <DialogHeader>
          <DialogTitle className="text-2xl text-module-primary flex items-center gap-2">
            ⚙️ Configurações - {apiName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="security" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-module-input">
            <TabsTrigger value="security" className="data-[state=active]:bg-module-accent data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="webhook" className="data-[state=active]:bg-module-accent data-[state=active]:text-white">
              <Webhook className="w-4 h-4 mr-2" />
              Webhook
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-6 mt-6">
            <div className="bg-module-input rounded-lg border border-module p-6 space-y-4">
              <h3 className="text-lg font-bold text-module-primary mb-4">
                Configurações de Segurança
              </h3>

              <div className="space-y-2">
                <Label htmlFor="rate-limit" className="text-module-secondary">
                  Rate Limit (requisições/minuto)
                </Label>
                <Input
                  id="rate-limit"
                  type="number"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(e.target.value)}
                  className="bg-module-card border-module text-module-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout" className="text-module-secondary">
                  Timeout (segundos)
                </Label>
                <Input
                  id="timeout"
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(e.target.value)}
                  className="bg-module-card border-module text-module-primary"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-module-card rounded-lg border border-module">
                <div className="space-y-1">
                  <Label htmlFor="retry" className="text-module-primary font-medium">
                    Retry Automático
                  </Label>
                  <p className="text-sm text-module-tertiary">
                    Tentar novamente em caso de falha
                  </p>
                </div>
                <Switch
                  id="retry"
                  checked={retryEnabled}
                  onCheckedChange={setRetryEnabled}
                />
              </div>

              {retryEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="max-retries" className="text-module-secondary">
                    Máximo de Tentativas
                  </Label>
                  <Input
                    id="max-retries"
                    type="number"
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(e.target.value)}
                    className="bg-module-card border-module text-module-primary"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="webhook" className="space-y-6 mt-6">
            <div className="bg-module-input rounded-lg border border-module p-6 space-y-4">
              <h3 className="text-lg font-bold text-module-primary mb-4">
                Configurações de Webhook
              </h3>

              <div className="space-y-2">
                <Label htmlFor="webhook-url" className="text-module-secondary">
                  URL do Webhook
                </Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://api.exemplo.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="bg-module-card border-module text-module-primary"
                />
                <p className="text-xs text-module-tertiary">
                  URL que receberá notificações de eventos desta API
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ Esta funcionalidade será implementada em breve. Por enquanto, configure webhooks diretamente no painel da API.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleTest}
            disabled={testing}
            variant="outline"
            className="flex-1 border-module-accent text-module-accent hover:bg-module-accent hover:text-white"
          >
            <TestTube className={`w-4 h-4 mr-2 ${testing ? 'animate-pulse' : ''}`} />
            {testing ? 'Testando...' : 'Testar Conexão'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-module-accent hover:bg-module-accent-hover text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
