import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateWebhookUrl } from '../../utils/webhookHelper';

interface ManyChatCredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentKey: string;
  currentConfig?: {
    api_key?: string;
    page_id?: string;
    webhook_url?: string;
    status?: string;
  } | null;
  onSave: (config?: any) => void | Promise<void>;
}

export const ManyChatCredentialsModal = ({
  open,
  onOpenChange,
  agentKey,
  currentConfig,
  onSave
}: ManyChatCredentialsModalProps) => {
  const [apiKey, setApiKey] = useState('');
  const [pageId, setPageId] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookUrl = generateWebhookUrl(agentKey);

  useEffect(() => {
    if (open) {
      setApiKey(currentConfig?.api_key || '');
      setPageId(currentConfig?.page_id || '');
    }
  }, [open, currentConfig]);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success('URL do Webhook copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Preencha a API Key do ManyChat');
      return;
    }

    // Validar formato da API Key (deve ser número:hash)
    if (!apiKey.includes(':')) {
      toast.error('Formato inválido. Use: número:hash (ex: 1663612:ebed5dd)');
      return;
    }

    setSaving(true);
    try {
      const updatedConfig = {
        manychat_config: {
          api_key: apiKey.trim(),
          page_id: pageId.trim() || undefined,
          webhook_url: webhookUrl,
          status: 'connected',
          last_updated: new Date().toISOString()
        },
        manychat_connected: true
      };

      const { error } = await supabase
        .from('agents')
        .update(updatedConfig)
        .eq('key', agentKey);

      if (error) throw error;
      
      toast.success('Credenciais ManyChat atualizadas com sucesso!');
      
      const saveResult = onSave(updatedConfig.manychat_config);
      if (saveResult && typeof saveResult === 'object' && 'then' in saveResult) {
        await saveResult;
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar credenciais ManyChat:', error);
      toast.error('Erro ao salvar credenciais ManyChat');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] !bg-white dark:!bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2 text-xl font-bold">
            💬 Configurar Credenciais ManyChat
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Configure a API Key do ManyChat para conectar o agente Eduardo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-gray-900 dark:text-gray-100 font-medium text-sm">
              API Key *
            </Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ex: 1663612:ebed5dd"
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono text-sm placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Formato: número:hash (encontre em ManyChat → Settings → API)
            </p>
          </div>

          {/* Page ID (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="pageId" className="text-gray-900 dark:text-gray-100 font-medium text-sm">
              Page ID (Opcional)
            </Label>
            <Input
              id="pageId"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              placeholder="Ex: 123456789012345"
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ID da página Facebook conectada ao ManyChat
            </p>
          </div>

          {/* Webhook URL (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="webhookUrl" className="text-gray-900 dark:text-gray-100 font-medium text-sm">
              Webhook URL (Configure no ManyChat)
            </Label>
            <div className="flex gap-2">
              <Input
                id="webhookUrl"
                value={webhookUrl}
                readOnly
                className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyWebhook}
                className="shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cole esta URL no ManyChat em Settings → Integrations → Custom Webhooks
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
              💡 Como configurar?
            </p>
            <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Acesse o ManyChat → Settings → API</li>
              <li>Copie a API Key (formato: número:hash)</li>
              <li>Cole a API Key acima e clique em "Salvar e Testar"</li>
              <li>Após salvar, copie o Webhook URL</li>
              <li>No ManyChat, vá em Settings → Integrations → Custom Webhooks</li>
              <li>Cole o Webhook URL e ative os eventos desejados</li>
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
            {saving ? 'Salvando...' : 'Salvar e Testar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
