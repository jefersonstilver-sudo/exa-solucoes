import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useModuleTheme, getThemeClass } from '../../hooks/useModuleTheme';
import { cn } from '@/lib/utils';

interface ZAPICredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentKey?: string;
  currentConfig?: {
    instance_id?: string;
    token?: string;
    api_url?: string;
    client_token?: string;
  } | null;
  onSave: (config?: any) => void | Promise<void>;
}

export const ZAPICredentialsModal = ({
  open,
  onOpenChange,
  agentKey,
  currentConfig,
  onSave
}: ZAPICredentialsModalProps) => {
  const [instanceId, setInstanceId] = useState('');
  const [token, setToken] = useState('');
  const [clientToken, setClientToken] = useState('');
  const [apiUrl, setApiUrl] = useState('https://api.z-api.io');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { theme } = useModuleTheme();

  // Reseta os valores quando o modal abre ou quando a config muda
  useEffect(() => {
    if (open) {
      setInstanceId(currentConfig?.instance_id || '');
      setToken(currentConfig?.token || '');
      setClientToken((currentConfig as any)?.client_token || '');
      setApiUrl(currentConfig?.api_url || 'https://api.z-api.io');
    }
  }, [open, currentConfig]);

  const handleSave = async () => {
    if (!instanceId.trim() || !token.trim() || !clientToken.trim()) {
      toast.error('Preencha Instance ID, Token e Client-Token');
      return;
    }

    setSaving(true);
    try {
      const updatedConfig = {
        whatsapp_provider: 'zapi',
        zapi_config: {
          instance_id: instanceId.trim(),
          token: token.trim(),
          client_token: clientToken.trim(),
          api_url: apiUrl.trim(),
          webhook_url: `/functions/v1/zapi-webhook`,
          status: 'connected'
        }
      };

      const { error } = await supabase
        .from('agents')
        .update(updatedConfig)
        .eq('key', agentKey || '');

      if (error) throw error;
      
      toast.success('Credenciais Z-API atualizadas com sucesso!');
      
      // Chama onSave e espera se for promise
      const saveResult = onSave(agentKey ? undefined : updatedConfig.zapi_config);
      if (saveResult && typeof saveResult === 'object' && 'then' in saveResult) {
        await saveResult;
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar credenciais Z-API:', error);
      toast.error('Erro ao salvar credenciais Z-API');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!instanceId.trim() || !token.trim() || !clientToken.trim()) {
      toast.error('Preencha todas as credenciais antes de testar');
      return;
    }

    setTesting(true);
    try {
      // Testa a conexão fazendo uma chamada simples à API Z-API
      const testUrl = `${apiUrl.trim()}/instances/${instanceId.trim()}/token/${token.trim()}/status`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken.trim()
        }
      });

      const result = await response.json();

      if (response.ok && result) {
        toast.success('✅ Conexão Z-API testada com sucesso!', {
          description: `Instância conectada: ${result.connected ? 'Sim' : 'Não'}`
        });
      } else {
        toast.error('❌ Erro ao testar conexão', {
          description: result.error || 'Verifique suas credenciais'
        });
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast.error('❌ Falha ao testar conexão', {
        description: 'Verifique suas credenciais e tente novamente'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(getThemeClass(theme), "sm:max-w-[900px] bg-module-card border-2 border-module shadow-2xl")}>
        <DialogHeader>
          <DialogTitle className="text-module-primary flex items-center gap-2 text-xl font-bold">
            🔐 Configurar Credenciais Z-API
          </DialogTitle>
          <DialogDescription className="text-module-secondary">
            Configure as credenciais da sua instância Z-API para conectar o agente ao WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[85vh] overflow-y-auto pr-2">
          {/* Instance ID */}
          <div className="space-y-2">
            <Label htmlFor="instanceId" className="text-module-primary font-medium text-sm">
              Instance ID *
            </Label>
            <Input
              id="instanceId"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="Ex: 3C6B8F4A-1234-5678-90AB-CDEF12345678"
              className="bg-module-secondary border-module text-module-primary placeholder:text-module-secondary/50"
            />
            <p className="text-xs text-module-secondary">
              Encontre no painel Z-API em "Minhas Instâncias"
            </p>
          </div>

          {/* Token */}
          <div className="space-y-2">
            <Label htmlFor="token" className="text-module-primary font-medium text-sm">
              Token *
            </Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Ex: 1A2B3C4D5E6F7G8H9I0J"
              className="bg-module-secondary border-module text-module-primary font-mono text-sm placeholder:text-module-secondary/50"
            />
            <p className="text-xs text-module-secondary">
              Token de autenticação da instância
            </p>
          </div>

          {/* Client-Token */}
          <div className="space-y-2">
            <Label htmlFor="clientToken" className="text-module-primary font-medium text-sm">
              Client-Token (Token de Segurança da Conta) *
            </Label>
            <Input
              id="clientToken"
              type="password"
              value={clientToken}
              onChange={(e) => setClientToken(e.target.value)}
              placeholder="Ex: E29F7B3C..."
              className="bg-module-secondary border-module text-module-primary font-mono text-sm placeholder:text-module-secondary/50"
            />
            <p className="text-xs text-module-secondary">
              Token de segurança da conta (encontre em: Segurança → Token de Segurança)
            </p>
          </div>

          {/* API URL */}
          <div className="space-y-2">
            <Label htmlFor="apiUrl" className="text-module-primary font-medium text-sm">
              API URL
            </Label>
            <Input
              id="apiUrl"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.z-api.io"
              className="bg-module-secondary border-module text-module-primary placeholder:text-module-secondary/50"
            />
            <p className="text-xs text-module-secondary">
              URL base da API (geralmente não precisa alterar)
            </p>
          </div>

          {/* Info Box with Visual Guide */}
          <div className="bg-module-secondary/30 border-2 border-module rounded-lg p-5">
            <p className="text-sm text-module-primary font-bold mb-3 flex items-center gap-2">
              💡 Guia Visual: Como obter as credenciais
            </p>
            
            <div className="space-y-4">
              {/* Etapa 1 */}
              <div className="bg-module-card/60 rounded-lg p-3 border border-module/50">
                <p className="text-xs font-bold text-module-primary mb-1">
                  1️⃣ Instance ID e Token
                </p>
                <p className="text-xs text-module-secondary">
                  • Painel Z-API → <strong>"Minhas Instâncias"</strong><br/>
                  • Selecione sua instância<br/>
                  • Copie o <strong>Instance ID</strong> (formato: 3C6B8F4A-1234-...)<br/>
                  • Copie o <strong>Token</strong> (formato: AF7014E33113...)
                </p>
              </div>

              {/* Etapa 2 */}
              <div className="bg-module-card/60 rounded-lg p-3 border border-module/50">
                <p className="text-xs font-bold text-module-primary mb-1">
                  2️⃣ Client-Token (Token de Segurança da Conta)
                </p>
                <p className="text-xs text-module-secondary">
                  • Painel Z-API → <strong>"Segurança"</strong><br/>
                  • Procure por <strong>"Token de Segurança da Conta"</strong><br/>
                  • Copie o token exibido (diferente do token da instância)<br/>
                  • ⚠️ Este token é <strong>global</strong> para todas as instâncias
                </p>
              </div>

              {/* Etapa 3 */}
              <div className="bg-module-card/60 rounded-lg p-3 border border-module/50">
                <p className="text-xs font-bold text-module-primary mb-1">
                  3️⃣ Diferença entre os tokens
                </p>
                <div className="text-xs text-module-secondary space-y-1">
                  <p>• <strong>Instance Token:</strong> Específico da instância (na URL)</p>
                  <p>• <strong>Client-Token:</strong> Segurança da conta (no header HTTP)</p>
                  <p className="text-red-500 font-bold mt-2">
                    ⚠️ AMBOS são necessários para funcionar!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-3 pt-4 border-t border-module">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={saving || testing}
            className="border-module text-module-primary hover:bg-module-secondary/50"
          >
            {testing ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-module-primary border-t-transparent rounded-full animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Testar Conexão
              </>
            )}
          </Button>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving || testing}
              className="border-module text-module-primary hover:bg-module-secondary/50"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || testing}
              className="bg-[#9C1E1E] hover:bg-[#7A1616] text-white border-0"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Credenciais'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
