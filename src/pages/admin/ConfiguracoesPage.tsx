import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Bell, Database, Save, AlertTriangle, Mail, Globe, Lock, Server, RefreshCw, CheckCircle, Bug, ShieldOff, ShieldCheck, Brain } from 'lucide-react';
import { useConfigurationsData } from '@/hooks/useConfigurationsData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ReAuthModal } from '@/components/debug/ReAuthModal';
import { AIDebugHistory } from '@/components/debug/AIDebugHistory';
import { format } from 'date-fns';
const ConfiguracoesPage = () => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const {
    config,
    loading,
    updateConfiguration,
    refetch
  } = useConfigurationsData();
  const [isLoading, setIsLoading] = useState(false);
  const [reAuthModalOpen, setReAuthModalOpen] = useState(false);
  const [debugAIAction, setDebugAIAction] = useState<'activate' | 'deactivate'>('activate');
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [debugAIStats, setDebugAIStats] = useState({
    totalAnalyses: 0,
    totalErrors: 0,
    fixesApplied: 0
  });
  const [localSettings, setLocalSettings] = useState({
    // Sistema
    siteName: 'INDEXA',
    siteDescription: 'Plataforma de Painéis Digitais',
    maintenanceMode: false,
    debugMode: false,
    // Notificações
    emailNotifications: true,
    pushNotifications: true,
    adminAlerts: true,
    // Segurança
    forceHttps: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    // Email
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    // Backup
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: 30
  });
  useEffect(() => {
    if (config) {
      setLocalSettings(prev => ({
        ...prev,
        maintenanceMode: config.modo_emergencia
      }));
    }
  }, [config]);

  useEffect(() => {
    fetchDebugAIStats();
  }, []);

  const fetchDebugAIStats = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_debug_analysis_history')
        .select('error_count');

      if (!error && data) {
        setDebugAIStats({
          totalAnalyses: data.length,
          totalErrors: data.reduce((sum, item) => sum + (item.error_count || 0), 0),
          fixesApplied: 0 // TODO: implement fixes tracking
        });
      }
    } catch (error) {
      console.error('Error fetching debug AI stats:', error);
    }
  };

  const handleToggleDebugAI = () => {
    if (!userProfile?.email || userProfile.email !== 'jefersonstilver@gmail.com') {
      toast({
        title: 'Acesso Negado',
        description: 'Apenas o super admin jefersonstilver@gmail.com pode gerenciar o Debug com IA',
        variant: 'destructive'
      });
      return;
    }

    setDebugAIAction(config?.debug_ai_enabled ? 'deactivate' : 'activate');
    setReAuthModalOpen(true);
  };

  const handleReAuthSuccess = async () => {
    try {
      const newStatus = !config?.debug_ai_enabled;
      
      await updateConfiguration({
        debug_ai_enabled: newStatus,
        debug_ai_activated_at: newStatus ? new Date().toISOString() : config?.debug_ai_activated_at,
        debug_ai_activated_by: newStatus ? userProfile?.id : config?.debug_ai_activated_by,
        seed_hash: config?.seed_hash || 'default_' + Date.now()
      });

      // Log na tabela de auditoria
      await supabase.from('user_activity_logs').insert({
        user_id: userProfile?.id,
        action_type: newStatus ? 'debug_ai_activation' : 'debug_ai_deactivation',
        entity_type: 'system_configuration',
        metadata: {
          activated_by: userProfile?.email,
          timestamp: new Date().toISOString()
        }
      });

      toast({
        title: newStatus ? '✓ Debug AI Ativado' : '✗ Debug AI Desativado',
        description: newStatus ? 'Sistema de debug inteligente agora está ativo para todos os usuários.' : 'Sistema de debug inteligente foi desativado.',
      });

      refetch();
      fetchDebugAIStats();
    } catch (error: any) {
      console.error('Error toggling debug AI:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar configuração do Debug AI',
        variant: 'destructive'
      });
    }
  };
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const success = await updateConfiguration({
        modo_emergencia: localSettings.maintenanceMode,
        seed_hash: config?.seed_hash || 'default_' + Date.now()
      });
      if (success) {
        // Simular salvamento de outras configurações
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleInputChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  if (loading) {
    return <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
          <span className="ml-2 text-indexa-purple">Carregando configurações...</span>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-gray-600">Gerencie as configurações globais da plataforma EXA</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-indexa-purple hover:bg-indexa-purple-dark text-white">
            {isLoading ? <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </> : <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Todas
              </>}
          </Button>
        </div>
      </div>

      {/* Status da Conexão */}
      

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações Gerais */}
        <Card className="border-indexa-purple/20">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-indexa-purple" />
              Configurações Gerais
            </CardTitle>
            <CardDescription className="text-gray-600">
              Informações básicas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName" className="text-gray-700">Nome do Site</Label>
              <Input id="siteName" value={localSettings.siteName} onChange={e => handleInputChange('siteName', e.target.value)} className="border-gray-300" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="siteDescription" className="text-gray-700">Descrição</Label>
              <Input id="siteDescription" value={localSettings.siteDescription} onChange={e => handleInputChange('siteDescription', e.target.value)} className="border-gray-300" />
            </div>

            <Separator className="bg-gray-200" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-700">Modo Manutenção</Label>
                  <p className="text-xs text-gray-500">Desabilita acesso para usuários</p>
                </div>
                <Switch checked={localSettings.maintenanceMode} onCheckedChange={checked => handleInputChange('maintenanceMode', checked)} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-700">Modo Debug</Label>
                  <p className="text-xs text-gray-500">Exibe logs detalhados</p>
                </div>
                <Switch checked={localSettings.debugMode} onCheckedChange={checked => handleInputChange('debugMode', checked)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Segurança */}
        <Card className="border-indexa-purple/20">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-indexa-purple" />
              Segurança
            </CardTitle>
            <CardDescription className="text-gray-600">
              Configurações de segurança e autenticação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-700">Forçar HTTPS</Label>
                <p className="text-xs text-gray-500">Redireciona HTTP para HTTPS</p>
              </div>
              <Switch checked={localSettings.forceHttps} onCheckedChange={checked => handleInputChange('forceHttps', checked)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-700">Autenticação 2FA</Label>
                <p className="text-xs text-gray-500">Requer verificação em duas etapas</p>
              </div>
              <Switch checked={localSettings.twoFactorAuth} onCheckedChange={checked => handleInputChange('twoFactorAuth', checked)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="text-gray-700">Timeout de Sessão (minutos)</Label>
              <Input id="sessionTimeout" type="number" value={localSettings.sessionTimeout} onChange={e => handleInputChange('sessionTimeout', parseInt(e.target.value))} className="border-gray-300" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts" className="text-gray-700">Máximo de Tentativas de Login</Label>
              <Input id="maxLoginAttempts" type="number" value={localSettings.maxLoginAttempts} onChange={e => handleInputChange('maxLoginAttempts', parseInt(e.target.value))} className="border-gray-300" />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Notificações */}
        <Card className="border-indexa-purple/20">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-indexa-purple" />
              Notificações
            </CardTitle>
            <CardDescription className="text-gray-600">
              Configurações de alertas e notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-700">Notificações por Email</Label>
                <p className="text-xs text-gray-500">Envia alertas importantes por email</p>
              </div>
              <Switch checked={localSettings.emailNotifications} onCheckedChange={checked => handleInputChange('emailNotifications', checked)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-700">Notificações Push</Label>
                <p className="text-xs text-gray-500">Notificações no navegador</p>
              </div>
              <Switch checked={localSettings.pushNotifications} onCheckedChange={checked => handleInputChange('pushNotifications', checked)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-700">Alertas de Admin</Label>
                <p className="text-xs text-gray-500">Alertas para administradores</p>
              </div>
              <Switch checked={localSettings.adminAlerts} onCheckedChange={checked => handleInputChange('adminAlerts', checked)} />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Email */}
        <Card className="border-indexa-purple/20">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-indexa-purple" />
              Configurações de Email
            </CardTitle>
            <CardDescription className="text-gray-600">
              Configurações do servidor SMTP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost" className="text-gray-700">Servidor SMTP</Label>
              <Input id="smtpHost" value={localSettings.smtpHost} onChange={e => handleInputChange('smtpHost', e.target.value)} className="border-gray-300" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPort" className="text-gray-700">Porta SMTP</Label>
              <Input id="smtpPort" value={localSettings.smtpPort} onChange={e => handleInputChange('smtpPort', e.target.value)} className="border-gray-300" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpUser" className="text-gray-700">Usuário SMTP</Label>
              <Input id="smtpUser" value={localSettings.smtpUser} onChange={e => handleInputChange('smtpUser', e.target.value)} className="border-gray-300" placeholder="email@exemplo.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPassword" className="text-gray-700">Senha SMTP</Label>
              <Input id="smtpPassword" type="password" value={localSettings.smtpPassword} onChange={e => handleInputChange('smtpPassword', e.target.value)} className="border-gray-300" placeholder="••••••••" />
            </div>
          </CardContent>
        </Card>

        {/* Debug com Inteligência Artificial */}
        <Card className="border-red-500/30 bg-red-50/20 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center text-red-900">
              <Bug className="h-5 w-5 mr-2" />
              🤖 Debug com Inteligência Artificial
            </CardTitle>
            <CardDescription>
              Sistema avançado de detecção de erros com IA
              <span className="block text-xs text-red-600 mt-1">
                ⚠️ Requer autorização - Apenas jefersonstilver@gmail.com
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${config?.debug_ai_enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    <Label className="text-gray-900 font-semibold">
                      Status do Sistema
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {config?.debug_ai_enabled ? (
                      <>
                        ✅ Ativo desde {config.debug_ai_activated_at ? format(new Date(config.debug_ai_activated_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          Powered by Google Gemini 2.5 Flash
                        </span>
                      </>
                    ) : (
                      'Sistema desativado'
                    )}
                  </p>
                </div>
                
                <Button
                  variant={config?.debug_ai_enabled ? 'destructive' : 'default'}
                  onClick={handleToggleDebugAI}
                  disabled={!userProfile?.email || userProfile.email !== 'jefersonstilver@gmail.com'}
                >
                  {config?.debug_ai_enabled ? (
                    <>
                      <ShieldOff className="h-4 w-4 mr-2" />
                      Desativar Debug AI
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Ativar Debug AI
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {config?.debug_ai_enabled && (
              <div className="space-y-3 pt-4 border-t border-red-200">
                <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  Estatísticas do Sistema
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-600">Análises Realizadas</p>
                    <p className="text-2xl font-bold text-blue-900">{debugAIStats.totalAnalyses}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded border border-red-200">
                    <p className="text-xs text-red-600">Erros Detectados</p>
                    <p className="text-2xl font-bold text-red-900">{debugAIStats.totalErrors}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-xs text-green-600">Quick Fixes Aplicados</p>
                    <p className="text-2xl font-bold text-green-900">{debugAIStats.fixesApplied}</p>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setHistoryModalOpen(true)}
                >
                  📜 Ver Histórico Completo de Análises
                </Button>
              </div>
            )}

            {!config?.debug_ai_enabled && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900">
                  <strong>💡 Como funciona:</strong>
                </p>
                <ul className="list-disc list-inside text-xs text-amber-800 mt-2 space-y-1">
                  <li>Análise automática de código com IA (Google Gemini 2.5 Flash)</li>
                  <li>Detecção inteligente de erros, bugs e problemas de performance</li>
                  <li>Sugestões de correção com exemplos de código</li>
                  <li>Histórico completo de análises para auditoria</li>
                  <li>Quick fixes SQL para problemas de dados</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ReAuthModal
        open={reAuthModalOpen}
        onClose={() => setReAuthModalOpen(false)}
        onSuccess={handleReAuthSuccess}
        action={debugAIAction}
      />

      <AIDebugHistory
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />

      {/* Estatísticas do Sistema */}
      <Card className="border-indexa-purple/20">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <Database className="h-5 w-5 mr-2 text-indexa-purple" />
            Estatísticas do Sistema
          </CardTitle>
          <CardDescription className="text-gray-600">
            Informações sobre o estado atual do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Status do Servidor</p>
                  <p className="text-xs text-green-600">Online</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Banco de Dados</p>
                  <p className="text-xs text-blue-600">Conectado</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">API Status</p>
                  <p className="text-xs text-purple-600">Funcionando</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default ConfiguracoesPage;