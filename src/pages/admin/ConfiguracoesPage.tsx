import React, { useState, useEffect } from 'react';
import { Pagina, Cabecalho, Pilulas, BOTAO2, Carregando } from '@/components/admin/ui/exa';
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
  const [aba, setAba] = useState(() => { try { return localStorage.getItem('config_aba') || 'site'; } catch { return 'site'; } });
  useEffect(() => { try { localStorage.setItem('config_aba', aba); } catch { /* sem armazenamento */ } }, [aba]);
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

  if (loading) return <Carregando texto="Carregando configurações…" />;

  const ABAS = [
    { valor: 'site', rotulo: 'Site' }, { valor: 'email', rotulo: 'E-mail' }, { valor: 'security', rotulo: 'Segurança' }, { valor: 'notifications', rotulo: 'Notificações' },
    { valor: 'system', rotulo: 'Sistema' }, { valor: 'integrations', rotulo: 'Integrações' }, { valor: 'social', rotulo: 'Redes' },
  ];
  return (
    <Pagina>
      <Cabecalho
        titulo="Configurações"
        sub="Site, e-mail, segurança, notificações, sistema, integrações e redes. Mexa com calma: aqui tudo vale para a plataforma inteira."
        acoes={<button type="button" className={BOTAO2} onClick={handleRefreshAll}><RefreshCw className="h-4 w-4" /> Recarregar</button>}
      />
      <Pilulas valor={aba} onChange={setAba} opcoes={ABAS} />
      <div className="[&_.rounded-lg]:rounded-2xl [&_.border-border]:border-black/[0.06] [&_.bg-card]:bg-white/80">
        {aba === 'site' && <SiteInfoTab config={additionalConfig} updateConfig={updateAdditionalConfig} />}
        {aba === 'email' && <EmailConfigTab config={additionalConfig} updateConfig={updateAdditionalConfig} />}
        {aba === 'security' && <SecurityTab config={additionalConfig} updateConfig={updateAdditionalConfig} />}
        {aba === 'notifications' && <NotificationsTab config={additionalConfig} updateConfig={updateAdditionalConfig} />}
        {aba === 'system' && <SystemTab baseConfig={baseConfig} updateBaseConfig={updateBaseConfig} additionalConfig={additionalConfig} updateAdditionalConfig={updateAdditionalConfig} />}
        {aba === 'integrations' && <IntegrationsTab config={additionalConfig} updateConfig={updateAdditionalConfig} />}
        {aba === 'social' && <SocialTab config={additionalConfig} updateConfig={updateAdditionalConfig} />}
      </div>

    </Pagina>
  );
}
