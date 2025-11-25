import { useState } from 'react';
import { Copy, Check, ExternalLink, Settings, AlertTriangle, CheckCircle, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ZAPICredentialsModal } from './ZAPICredentialsModal';
import { ZAPIWebhookDiagnostics } from '../zapi/ZAPIWebhookDiagnostics';
import { supabase } from '@/integrations/supabase/client';

interface ZAPIConfigSectionProps {
  agentKey: string;
  zapiConfig: {
    instance_id: string;
    token: string;
    api_url: string;
    webhook_url: string;
    status: 'connected' | 'pending_setup';
  } | null;
  whatsappNumber: string | null;
  onConfigUpdate?: () => void;
}

export const ZAPIConfigSection = ({ agentKey, zapiConfig, whatsappNumber, onConfigUpdate }: ZAPIConfigSectionProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copiado!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleImportHistory = async () => {
    setIsImporting(true);
    try {
      toast.info('Iniciando importação de histórico...', {
        description: 'Isso pode levar alguns minutos dependendo do volume de mensagens'
      });

      const { data, error } = await supabase.functions.invoke('zapi-import-history', {
        body: { agentKey }
      });

      if (error) throw error;

      toast.success('Histórico importado com sucesso!', {
        description: `${data.conversationsImported} conversas e ${data.messagesImported} mensagens importadas`
      });
    } catch (error: any) {
      console.error('Error importing history:', error);
      toast.error('Erro ao importar histórico', {
        description: error.message || 'Verifique os logs para mais detalhes'
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (!zapiConfig) {
    return (
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h3 className="text-lg font-bold text-module-primary mb-4">Configuração Z-API</h3>
        <p className="text-module-secondary">
          Este agente não está configurado para usar Z-API.
        </p>
      </div>
    );
  }

  const isPending = zapiConfig.status === 'pending_setup';
  const fullWebhookUrl = `${import.meta.env.VITE_SUPABASE_URL}${zapiConfig.webhook_url}`;

  return (
    <div className="bg-module-card rounded-[14px] border border-module p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-module-primary">Configuração Z-API (WhatsApp)</h3>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportHistory}
            disabled={isImporting || isPending}
            className="border-module-accent text-module-accent hover:bg-module-accent/10"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Importar Histórico
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCredentialsModal(true)}
            className="border-module text-module-secondary hover:text-module-primary"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar Credenciais
          </Button>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isPending 
              ? 'bg-yellow-500/10 text-yellow-500' 
              : 'bg-green-500/10 text-green-500'
          }`}>
            {isPending ? '⚠️ Configuração Pendente' : '✓ Conectado'}
          </div>
        </div>
      </div>

      {/* Diagnóstico do Webhook - CRÍTICO PARA fromMe=true */}
      <ZAPIWebhookDiagnostics
        agentKey={agentKey}
        agentName={`Agente ${agentKey}`}
      />

      {/* Info sobre importação de histórico */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-400">
              Importar Histórico de Conversas
            </p>
            <p className="text-xs text-module-secondary">
              Clique no botão "Importar Histórico" acima para buscar conversas antigas do Z-API. 
              O sistema irá importar até 500 mensagens por conversa, incluindo conversas que 
              existiam antes da conexão com este sistema.
            </p>
            <p className="text-xs text-yellow-500 font-medium">
              ⚠️ A importação pode levar alguns minutos dependendo do volume de mensagens
            </p>
          </div>
        </div>
      </div>

      {/* Número WhatsApp */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-module-secondary">
          Número WhatsApp do Agente
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-module-input border border-module rounded-lg p-3 text-module-primary font-mono">
            {whatsappNumber || 'Não configurado'}
          </div>
          {whatsappNumber && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(whatsappNumber, 'Número')}
            >
              {copiedField === 'Número' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Instance ID */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-module-secondary">
          Instance ID
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-module-input border border-module rounded-lg p-3 text-module-primary font-mono text-sm overflow-x-auto">
            {zapiConfig.instance_id}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(zapiConfig.instance_id, 'Instance ID')}
          >
            {copiedField === 'Instance ID' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        {isPending && (
          <p className="text-xs text-yellow-500">
            ⚠️ Substitua "PENDING_SETUP" pelos valores reais da instância Z-API
          </p>
        )}
      </div>

      {/* Token */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-module-secondary">
          Token (Instance Token)
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-module-input border border-module rounded-lg p-3 text-module-primary font-mono text-sm overflow-x-auto">
            {zapiConfig.token}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(zapiConfig.token, 'Token')}
          >
            {copiedField === 'Token' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Client Token Status */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-module-secondary">
          Client-Token (Token de Segurança da Conta)
        </label>
        <div className="flex items-center gap-2">
          <div className={`flex-1 border rounded-lg p-3 font-mono text-sm ${
            (zapiConfig as any).client_token 
              ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' 
              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400'
          }`}>
            {(zapiConfig as any).client_token ? '✓ Configurado (oculto por segurança)' : '⚠️ Não configurado'}
          </div>
        </div>
        {!(zapiConfig as any).client_token && (
          <p className="text-xs text-yellow-500 font-medium">
            ⚠️ Client-Token é necessário para enviar mensagens via Z-API
          </p>
        )}
      </div>

      {/* API URL */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-module-secondary">
          API URL
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-module-input border border-module rounded-lg p-3 text-module-primary font-mono text-xs overflow-x-auto">
            {zapiConfig.api_url}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(zapiConfig.api_url, 'API URL')}
          >
            {copiedField === 'API URL' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-module-secondary">
          Webhook URL (Configure no painel Z-API)
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-module-accent/10 border border-module-accent rounded-lg p-3 text-module-primary font-mono text-xs overflow-x-auto">
            {fullWebhookUrl}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(fullWebhookUrl, 'Webhook URL')}
          >
            {copiedField === 'Webhook URL' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-2">
          <p className="text-xs text-blue-400 font-medium">📋 Instruções de Configuração:</p>
          <ol className="text-xs text-module-secondary space-y-1 ml-4 list-decimal">
            <li>Acesse o painel da sua instância Z-API</li>
            <li>Vá em Configurações → Webhooks</li>
            <li>Cole a URL acima no campo de webhook</li>
            <li>Ative os eventos: "Mensagem Recebida"</li>
            <li>Salve as configurações</li>
          </ol>
        </div>
      </div>

      {/* Link para documentação */}
      <div className="flex items-center justify-between pt-4 border-t border-module">
        <p className="text-xs text-module-tertiary">
          Precisa de ajuda? Consulte a documentação da Z-API
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('https://developer.z-api.io/', '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Docs Z-API
        </Button>
      </div>

      {/* Modal de Credenciais */}
      <ZAPICredentialsModal
        open={showCredentialsModal}
        onOpenChange={setShowCredentialsModal}
        agentKey={agentKey}
        currentConfig={zapiConfig}
        onSave={() => {
          if (onConfigUpdate) onConfigUpdate();
        }}
      />
    </div>
  );
};
