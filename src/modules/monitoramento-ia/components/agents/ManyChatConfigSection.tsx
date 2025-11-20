import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Save, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ManyChatConfigSection = () => {
  const [config, setConfig] = useState({
    apiKey: '',
    whatsappNumberId: '',
    botId: '',
    webhookUrl: '',
    verifyToken: ''
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data } = await supabase
        .from('agent_context')
        .select('value')
        .eq('key', 'manychat_config')
        .single();

      if (data?.value) {
        setConfig(data.value as any);
      } else {
        // Gerar webhook URL e verify token padrão
        const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aakenoljsycyrcrchgxj.supabase.co';
        const webhookUrl = `${baseUrl}/functions/v1/webhook-manychat/sofia`;
        const verifyToken = `verify_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
        
        setConfig(prev => ({
          ...prev,
          webhookUrl,
          verifyToken
        }));
      }
    } catch (error) {
      console.error('[ManyChatConfig] Load error:', error);
    }
  };

  const saveConfig = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('agent_context')
        .upsert({
          key: 'manychat_config',
          value: config
        });

      if (error) throw error;

      toast.success('Configuração ManyChat salva');
    } catch (error: any) {
      toast.error('Erro ao salvar configuração');
      console.error('[ManyChatConfig] Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success('Copiado!');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-[#1A1A1A] rounded-[14px] border border-[#2A2A2A] p-6">
      <h2 className="text-xl font-bold text-white mb-4">Configurações ManyChat & WhatsApp</h2>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-500 font-medium mb-2">
              Variáveis necessárias no Supabase
            </p>
            <ul className="text-xs text-[#A0A0A0] space-y-1">
              <li><code className="bg-[#0A0A0A] px-2 py-0.5 rounded">MANYCHAT_API_KEY</code></li>
              <li><code className="bg-[#0A0A0A] px-2 py-0.5 rounded">MANYCHAT_SYNC_SECRET</code></li>
              <li><code className="bg-[#0A0A0A] px-2 py-0.5 rounded">WHATSAPP_API_KEY</code></li>
              <li><code className="bg-[#0A0A0A] px-2 py-0.5 rounded">WHATSAPP_PHONE_NUMBER_ID</code></li>
            </ul>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => window.open('/docs/AGENTS_SETUP.md', '_blank')}
            >
              📖 Ver Documentação Completa
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-white">ManyChat API Key</Label>
          <Input
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            placeholder="Chave de API do ManyChat"
            className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
          />
        </div>

        <div>
          <Label className="text-white">WhatsApp Number ID</Label>
          <Input
            type="text"
            value={config.whatsappNumberId}
            onChange={(e) => setConfig({ ...config, whatsappNumberId: e.target.value })}
            placeholder="ID do número WhatsApp"
            className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
          />
        </div>

        <div>
          <Label className="text-white">Bot ID</Label>
          <Input
            type="text"
            value={config.botId}
            onChange={(e) => setConfig({ ...config, botId: e.target.value })}
            placeholder="ID do bot no ManyChat"
            className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
          />
        </div>

        <div>
          <Label className="text-white">Webhook URL (auto-gerada)</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={config.webhookUrl}
              readOnly
              className="bg-[#0A0A0A] border-[#2A2A2A] text-[#A0A0A0]"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => copyToClipboard(config.webhookUrl, 'webhook')}
            >
              {copied === 'webhook' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-white">Verify Token (auto-gerado)</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={config.verifyToken}
              readOnly
              className="bg-[#0A0A0A] border-[#2A2A2A] text-[#A0A0A0]"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => copyToClipboard(config.verifyToken, 'verify')}
            >
              {copied === 'verify' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <Button
          onClick={saveConfig}
          disabled={loading}
          className="w-full bg-[#9C1E1E] hover:bg-[#7A1616]"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Salvando...' : 'Salvar Configuração'}
        </Button>
      </div>
    </div>
  );
};
