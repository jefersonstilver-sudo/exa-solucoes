import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Bug, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useModuleTheme, getThemeClass } from '../../hooks/useModuleTheme';
import { cn } from '@/lib/utils';

interface AgentDebugPanelProps {
  agentKey: string;
  displayName: string;
  open: boolean;
  onClose: () => void;
}

interface DebugData {
  timestamp: string;
  databaseData?: any;
  edgeFunctionResponse?: any;
  zapiResponse?: any;
  sessionStatus?: {
    active: boolean;
    userId?: string;
  };
  errors: string[];
}

export const AgentDebugPanel = ({ agentKey, displayName, open, onClose }: AgentDebugPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const { theme } = useModuleTheme();

  const runCompleteDebug = async () => {
    setLoading(true);
    const errors: string[] = [];
    const timestamp = new Date().toISOString();

    try {
      console.log('🔍 [DEBUG PANEL] Iniciando diagnóstico completo...');

      // 1. Verificar sessão do usuário
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 [DEBUG PANEL] Sessão:', session ? 'Ativa' : 'Inativa');

      // 2. Buscar dados do agente no banco
      console.log('📊 [DEBUG PANEL] Buscando dados do banco...');
      const { data: dbAgent, error: dbError } = await supabase
        .from('agents')
        .select('*')
        .eq('key', agentKey)
        .single();

      if (dbError) {
        errors.push(`Erro ao buscar banco: ${dbError.message}`);
        console.error('❌ [DEBUG PANEL] Erro no banco:', dbError);
      } else {
        console.log('✅ [DEBUG PANEL] Dados do banco:', dbAgent);
      }

      // 3. Testar edge function
      console.log('📤 [DEBUG PANEL] Testando edge function...');
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('test-agent-status', {
        body: { agentKey }
      });

      if (edgeError) {
        errors.push(`Erro na edge function: ${edgeError.message}`);
        console.error('❌ [DEBUG PANEL] Erro na edge function:', edgeError);
      } else {
        console.log('✅ [DEBUG PANEL] Resposta edge function:', edgeData);
      }

      // 4. Se for Z-API, testar via Edge Function segura (não expor credenciais no frontend)
      let zapiResponse = null;
      if (dbAgent?.whatsapp_provider === 'zapi' && dbAgent?.zapi_config) {
        const config = dbAgent.zapi_config as any;
        if (config.instance_id && config.token) {
          try {
            console.log('🌐 [DEBUG PANEL] Testando Z-API via Edge Function segura...');
            
            // Usar Edge Function segura ao invés de chamada direta
            const { data: zapiData, error: zapiError } = await supabase.functions.invoke('check-zapi-status', {
              body: { 
                instanceId: config.instance_id,
                instanceToken: config.token,
                clientToken: config.client_token
              }
            });
            
            if (zapiError) {
              errors.push(`Erro ao verificar Z-API: ${zapiError.message}`);
              console.error('❌ [DEBUG PANEL] Erro na Edge Function Z-API:', zapiError);
            } else {
              zapiResponse = {
                source: 'secure-edge-function',
                ok: zapiData?.success,
                data: zapiData
              };
              
              console.log('✅ [DEBUG PANEL] Resposta Z-API (segura):', zapiResponse);
              
              // Verificar erros específicos
              if (!zapiData?.success) {
                errors.push(`Erro Z-API: ${zapiData?.error || 'Falha na verificação'}`);
              } else if (!zapiData?.status?.connected) {
                errors.push('⚠️ Instância Z-API desconectada - Escaneie o QR Code');
              }
            }
          } catch (error: any) {
            errors.push(`Erro ao conectar Z-API: ${error.message}`);
            console.error('❌ [DEBUG PANEL] Erro no Z-API:', error);
          }
        }
      }

      setDebugData({
        timestamp,
        databaseData: dbAgent,
        edgeFunctionResponse: edgeData,
        zapiResponse,
        sessionStatus: {
          active: !!session,
          userId: session?.user?.id
        },
        errors
      });

      if (errors.length === 0) {
        toast.success('Debug completo sem erros!');
      } else {
        toast.warning(`Debug completo com ${errors.length} erro(s)`);
      }

    } catch (error: any) {
      console.error('💥 [DEBUG PANEL] Erro crítico:', error);
      errors.push(`Erro crítico: ${error.message}`);
      toast.error('Erro ao executar debug');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn(getThemeClass(theme), "max-w-4xl max-h-[80vh] overflow-y-auto bg-module-card border-module")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Debug Completo - {displayName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button 
            onClick={runCompleteDebug} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Executando diagnóstico...
              </>
            ) : (
              <>
                <Bug className="w-4 h-4 mr-2" />
                Executar Diagnóstico Completo
              </>
            )}
          </Button>

          {debugData && (
            <div className="space-y-4">
              {/* Status Geral */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  {debugData.errors.length === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  Status Geral
                </h3>
                <p className="text-sm text-muted-foreground">
                  Timestamp: {new Date(debugData.timestamp).toLocaleString('pt-BR')}
                </p>
                {debugData.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {debugData.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-500 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sessão do Usuário */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">🔐 Sessão do Usuário</h3>
                <Badge variant={debugData.sessionStatus?.active ? "default" : "destructive"}>
                  {debugData.sessionStatus?.active ? 'Ativa' : 'Inativa'}
                </Badge>
                {debugData.sessionStatus?.userId && (
                  <p className="text-sm text-muted-foreground mt-2">
                    User ID: {debugData.sessionStatus.userId}
                  </p>
                )}
              </div>

              {/* Dados do Banco */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">📊 Dados do Banco de Dados</h3>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(debugData.databaseData, null, 2)}
                </pre>
              </div>

              {/* Resposta Edge Function */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">📤 Resposta Edge Function</h3>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(debugData.edgeFunctionResponse, null, 2)}
                </pre>
              </div>

              {/* Resposta Z-API */}
              {debugData.zapiResponse && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🌐 Resposta Z-API Direto</h3>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(debugData.zapiResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
