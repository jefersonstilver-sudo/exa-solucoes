import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ZAPICredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentKey: string;
  currentConfig: {
    instance_id: string;
    token: string;
    api_url: string;
  } | null;
  onSave: () => void;
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
      const { error } = await supabase
        .from('agents')
        .update({
          zapi_config: {
            instance_id: instanceId.trim(),
            token: token.trim(),
            client_token: clientToken.trim(),
            api_url: apiUrl.trim(),
            webhook_url: `/functions/v1/zapi-webhook`,
            status: 'connected'
          }
        })
        .eq('key', agentKey);

      if (error) throw error;

      toast.success('✅ Credenciais Z-API salvas com sucesso!');
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar credenciais:', error);
      toast.error('Erro ao salvar credenciais: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] !bg-white dark:!bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2 text-xl font-bold">
            🔐 Configurar Credenciais Z-API
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Configure as credenciais da sua instância Z-API para conectar o agente ao WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Instance ID */}
          <div className="space-y-2">
            <Label htmlFor="instanceId" className="text-gray-900 dark:text-gray-100 font-medium text-sm">
              Instance ID *
            </Label>
            <Input
              id="instanceId"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="Ex: 3C6B8F4A-1234-5678-90AB-CDEF12345678"
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Encontre no painel Z-API em "Minhas Instâncias"
            </p>
          </div>

          {/* Token */}
          <div className="space-y-2">
            <Label htmlFor="token" className="text-gray-900 dark:text-gray-100 font-medium text-sm">
              Token *
            </Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Ex: 1A2B3C4D5E6F7G8H9I0J"
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono text-sm placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Token de autenticação da instância
            </p>
          </div>

          {/* Client-Token */}
          <div className="space-y-2">
            <Label htmlFor="clientToken" className="text-gray-900 dark:text-gray-100 font-medium text-sm">
              Client-Token (Token de Segurança da Conta) *
            </Label>
            <Input
              id="clientToken"
              type="password"
              value={clientToken}
              onChange={(e) => setClientToken(e.target.value)}
              placeholder="Ex: E29F7B3C..."
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono text-sm placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Token de segurança da conta (encontre em: Segurança → Token de Segurança)
            </p>
          </div>

          {/* API URL */}
          <div className="space-y-2">
            <Label htmlFor="apiUrl" className="text-gray-900 dark:text-gray-100 font-medium text-sm">
              API URL
            </Label>
            <Input
              id="apiUrl"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.z-api.io"
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              URL base da API (geralmente não precisa alterar)
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
              💡 Como obter essas informações?
            </p>
            <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Acesse o painel Z-API</li>
              <li>Vá em "Minhas Instâncias" e copie Instance ID e Token</li>
              <li>Vá em "Segurança" → "Token de Segurança da Conta"</li>
              <li>Copie o Client-Token (token de segurança)</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#9C1E1E] hover:bg-[#7A1616] text-white border-0"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Credenciais'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
