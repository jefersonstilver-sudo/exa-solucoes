import { useState } from 'react';
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
  const [instanceId, setInstanceId] = useState(currentConfig?.instance_id || '');
  const [token, setToken] = useState(currentConfig?.token || '');
  const [apiUrl, setApiUrl] = useState(currentConfig?.api_url || 'https://api.z-api.io');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!instanceId.trim() || !token.trim()) {
      toast.error('Preencha Instance ID e Token');
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
      <DialogContent className="sm:max-w-[600px] bg-module-card border-module">
        <DialogHeader>
          <DialogTitle className="text-module-primary flex items-center gap-2">
            🔐 Configurar Credenciais Z-API
          </DialogTitle>
          <DialogDescription className="text-module-secondary">
            Configure as credenciais da sua instância Z-API para conectar o agente ao WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Instance ID */}
          <div className="space-y-2">
            <Label htmlFor="instanceId" className="text-module-primary font-medium">
              Instance ID *
            </Label>
            <Input
              id="instanceId"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="Ex: 3C6B8F4A-1234-5678-90AB-CDEF12345678"
              className="bg-module-input border-module text-module-primary"
            />
            <p className="text-xs text-module-tertiary">
              Encontre no painel Z-API em "Minhas Instâncias"
            </p>
          </div>

          {/* Token */}
          <div className="space-y-2">
            <Label htmlFor="token" className="text-module-primary font-medium">
              Token *
            </Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Ex: 1A2B3C4D5E6F7G8H9I0J"
              className="bg-module-input border-module text-module-primary font-mono text-sm"
            />
            <p className="text-xs text-module-tertiary">
              Token de autenticação da instância
            </p>
          </div>

          {/* API URL */}
          <div className="space-y-2">
            <Label htmlFor="apiUrl" className="text-module-primary font-medium">
              API URL
            </Label>
            <Input
              id="apiUrl"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.z-api.io"
              className="bg-module-input border-module text-module-primary"
            />
            <p className="text-xs text-module-tertiary">
              URL base da API (geralmente não precisa alterar)
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-400 font-medium mb-2">
              💡 Como obter essas informações?
            </p>
            <ol className="text-xs text-blue-300 space-y-1 list-decimal list-inside">
              <li>Acesse o painel Z-API</li>
              <li>Vá em "Minhas Instâncias"</li>
              <li>Selecione a instância desejada</li>
              <li>Copie o Instance ID e o Token</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="border-module text-module-secondary"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#9C1E1E] hover:bg-[#7A1616] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Credenciais'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
