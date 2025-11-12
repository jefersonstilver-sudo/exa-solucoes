import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Bot, 
  Save, 
  RefreshCw, 
  Info,
  Database,
  Server,
  HardDrive,
  CheckCircle,
  History,
  Shield
} from 'lucide-react';
import { useConfigurationsData } from '@/hooks/useConfigurationsData';
import { AIDebugService } from '@/services/debug/AIDebugService';
import { AIDebugHistory } from '@/components/debug/AIDebugHistory';
import { ReAuthModal } from '@/components/debug/ReAuthModal';
import { ResendStatusCard } from '@/components/admin/ResendStatusCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ConfiguracoesPage() {
  const { config, loading, updateConfiguration, refetch } = useConfigurationsData();
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showReAuthModal, setShowReAuthModal] = useState(false);
  const [pendingDebugAIValue, setPendingDebugAIValue] = useState(false);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    totalErrors: 0,
    totalTokens: 0,
    avgDuration: 0,
  });

  // Carregar estatísticas do Debug AI
  React.useEffect(() => {
    if (config?.debug_ai_enabled) {
      AIDebugService.getStatistics().then(setStats);
    }
  }, [config?.debug_ai_enabled]);

  const handleEmergencyModeToggle = async (checked: boolean) => {
    const success = await updateConfiguration({ modo_emergencia: checked });
    if (success) {
      toast.success(
        checked 
          ? '🚨 Modo Emergência ATIVADO - Apenas administradores podem acessar' 
          : '✅ Modo Emergência DESATIVADO - Sistema operando normalmente'
      );
    }
  };

  const handleDebugAIToggle = (checked: boolean) => {
    setPendingDebugAIValue(checked);
    setShowReAuthModal(true);
  };

  const handleDebugAIConfirm = async () => {
    const success = await updateConfiguration({ 
      debug_ai_enabled: pendingDebugAIValue,
      debug_ai_activated_at: pendingDebugAIValue ? new Date().toISOString() : config?.debug_ai_activated_at,
      debug_ai_activated_by: pendingDebugAIValue ? 'jefersonstilver@gmail.com' : config?.debug_ai_activated_by,
    });

    if (success) {
      toast.success(
        pendingDebugAIValue
          ? '🤖 Debug AI ATIVADO - Análise inteligente disponível'
          : '🔒 Debug AI DESATIVADO'
      );
      
      if (pendingDebugAIValue) {
        // Recarregar estatísticas
        AIDebugService.getStatistics().then(setStats);
      }
    }
    
    setShowReAuthModal(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    
    // Apenas salvar configurações que foram modificadas
    // Neste caso, as mudanças já são salvas individualmente
    toast.success('Todas as configurações estão salvas!');
    
    setSaving(false);
  };

  const handleRefresh = async () => {
    await refetch();
    toast.success('Configurações recarregadas!');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciamento centralizado da plataforma EXA
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recarregar
          </Button>
          <Button onClick={handleSaveAll} disabled={saving} size="sm">
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
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

      <Separator />

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
              {config?.modo_emergencia ? (
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
              checked={config?.modo_emergencia || false}
              onCheckedChange={handleEmergencyModeToggle}
            />
          </div>

          {config?.updated_at && (
            <div className="text-xs text-muted-foreground">
              Última atualização: {format(new Date(config.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          )}

          {config?.modo_emergencia && (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                ⚠️ Ao ativar o Modo Emergência, apenas usuários com perfil de administrador poderão acessar o sistema.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resend Email Configuration */}
      <ResendStatusCard />

      {/* Debug AI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-500" />
            Debug com Inteligência Artificial
          </CardTitle>
          <CardDescription>
            Análise automática de páginas usando Google Gemini 2.5 Flash
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Status do Debug AI</p>
              {config?.debug_ai_enabled ? (
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="gap-1">
                    <Bot className="w-3 h-3" />
                    ATIVO
                  </Badge>
                  {config?.debug_ai_activated_at && (
                    <span className="text-xs text-muted-foreground">
                      desde {format(new Date(config.debug_ai_activated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </div>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  INATIVO
                </Badge>
              )}
            </div>
            <Switch
              checked={config?.debug_ai_enabled || false}
              onCheckedChange={handleDebugAIToggle}
            />
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            Modelo: Google Gemini 2.5 Flash
          </div>

          {config?.debug_ai_enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Análises Realizadas</p>
                  <p className="text-2xl font-bold">{stats.totalAnalyses}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Erros Detectados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.totalErrors}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tokens Consumidos</p>
                  <p className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Duração Média</p>
                  <p className="text-2xl font-bold">{(stats.avgDuration / 1000).toFixed(2)}s</p>
                </div>
              </div>

              <Button
                onClick={() => setShowHistory(true)}
                variant="outline"
                className="w-full"
              >
                <History className="w-4 h-4 mr-2" />
                Ver Histórico de Análises
              </Button>
            </>
          )}

          <div className="rounded-md bg-purple-500/10 border border-purple-500/20 p-3">
            <p className="text-sm text-purple-700 dark:text-purple-400">
              <Shield className="w-4 h-4 inline mr-1" />
              Requer autenticação com senha - Restrito a jefersonstilver@gmail.com
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

      {/* Modals */}
      <ReAuthModal
        open={showReAuthModal}
        onClose={() => setShowReAuthModal(false)}
        onSuccess={handleDebugAIConfirm}
        action={pendingDebugAIValue ? 'activate' : 'deactivate'}
      />

      <AIDebugHistory
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
