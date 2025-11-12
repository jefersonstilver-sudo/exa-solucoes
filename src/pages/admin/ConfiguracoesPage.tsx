import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  RefreshCw,
  Building2,
  Mail,
  Shield,
  Bell,
  Server,
  Bot,
  Database,
  FileText,
  Globe,
  Share2
} from 'lucide-react';
import { useConfigurationsData } from '@/hooks/useConfigurationsData';
import { useAdditionalConfigurations } from '@/hooks/useAdditionalConfigurations';
import { useAuth } from '@/hooks/useAuth';
import { AIDebugService } from '@/services/debug/AIDebugService';
import { AIDebugHistory } from '@/components/debug/AIDebugHistory';
import { ReAuthModal } from '@/components/debug/ReAuthModal';
import { ResendStatusCard } from '@/components/admin/ResendStatusCard';
import { toast } from 'sonner';

// Import dos componentes das tabs
import { SiteInfoTab } from '@/components/admin/config/SiteInfoTab';
import { EmailConfigTab } from '@/components/admin/config/EmailConfigTab';
import { SecurityTab } from '@/components/admin/config/SecurityTab';
import { NotificationsTab } from '@/components/admin/config/NotificationsTab';
import { SystemTab } from '@/components/admin/config/SystemTab';
import { DebugAITab } from '@/components/admin/config/DebugAITab';
import { IntegrationsTab } from '@/components/admin/config/IntegrationsTab';
import { SocialTab } from '@/components/admin/config/SocialTab';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { config: baseConfig, loading: baseLoading, updateConfiguration: updateBaseConfig, refetch: refetchBase } = useConfigurationsData();
  const { config: additionalConfig, loading: additionalLoading, updateConfiguration: updateAdditionalConfig, refetch: refetchAdditional } = useAdditionalConfigurations();
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
    if (baseConfig?.debug_ai_enabled) {
      AIDebugService.getStatistics().then(setStats);
    }
  }, [baseConfig?.debug_ai_enabled]);

  const handleDebugAIToggle = async (checked: boolean) => {
    // Garantir que configuração está carregada
    if (!baseConfig) {
      console.warn('⚠️ Config não carregado, fazendo refetch...');
      await refetchBase();
    }
    
    setPendingDebugAIValue(checked);
    setShowReAuthModal(true);
  };

  const handleDebugAIConfirm = async () => {
    console.log('🔹 handleDebugAIConfirm INICIADO');
    console.log('🔹 pendingDebugAIValue:', pendingDebugAIValue);
    console.log('🔹 baseConfig:', baseConfig);
    console.log('🔹 user:', user);
    
    if (!baseConfig) {
      console.error('❌ baseConfig é null - não pode salvar!');
      toast.error('Erro: Configuração base não carregada');
      setShowReAuthModal(false);
      return;
    }

    if (!user?.id) {
      console.error('❌ user.id é null - não pode salvar!');
      toast.error('Erro: Usuário não identificado');
      setShowReAuthModal(false);
      return;
    }
    
    const success = await updateBaseConfig({ 
      debug_ai_enabled: pendingDebugAIValue,
      debug_ai_activated_at: pendingDebugAIValue ? new Date().toISOString() : baseConfig?.debug_ai_activated_at,
      debug_ai_activated_by: pendingDebugAIValue ? user.id : baseConfig?.debug_ai_activated_by,
    });

    console.log('🔹 Resultado do update:', success);

    if (success) {
      toast.success(
        pendingDebugAIValue
          ? '🤖 Debug AI ATIVADO - Análise inteligente disponível'
          : '🔒 Debug AI DESATIVADO'
      );
      
      if (pendingDebugAIValue) {
        AIDebugService.getStatistics().then(setStats);
      }
    } else {
      toast.error('Falha ao atualizar configuração do Debug AI');
    }
    
    setShowReAuthModal(false);
  };

  const handleRefreshAll = async () => {
    await Promise.all([refetchBase(), refetchAdditional()]);
    toast.success('Configurações recarregadas!');
  };

  const loading = baseLoading || additionalLoading;

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
            Gerenciamento completo da plataforma EXA Soluções Digitais
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefreshAll} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recarregar Tudo
          </Button>
        </div>
      </div>

      <Separator />

      {/* Tabs de Configuração */}
      <Tabs defaultValue="site" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="site" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Site</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Server className="w-4 h-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="debug" className="gap-2">
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Debug AI</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Integrações</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Redes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="site">
          <SiteInfoTab 
            config={additionalConfig} 
            updateConfig={updateAdditionalConfig}
          />
        </TabsContent>

        <TabsContent value="email">
          <EmailConfigTab 
            config={additionalConfig} 
            updateConfig={updateAdditionalConfig}
          />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab 
            config={additionalConfig} 
            updateConfig={updateAdditionalConfig}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab 
            config={additionalConfig} 
            updateConfig={updateAdditionalConfig}
          />
        </TabsContent>

        <TabsContent value="system">
          <SystemTab 
            baseConfig={baseConfig}
            updateBaseConfig={updateBaseConfig}
            additionalConfig={additionalConfig}
            updateAdditionalConfig={updateAdditionalConfig}
          />
        </TabsContent>

        <TabsContent value="debug">
          <DebugAITab 
            config={baseConfig}
            stats={stats}
            onToggleDebugAI={handleDebugAIToggle}
            onShowHistory={() => setShowHistory(true)}
          />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsTab 
            config={additionalConfig} 
            updateConfig={updateAdditionalConfig}
          />
        </TabsContent>

        <TabsContent value="social">
          <SocialTab 
            config={additionalConfig} 
            updateConfig={updateAdditionalConfig}
          />
        </TabsContent>
      </Tabs>

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
