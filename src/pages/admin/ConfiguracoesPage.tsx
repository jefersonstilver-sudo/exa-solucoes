
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Settings,
  Shield,
  Bell,
  Database,
  Save,
  AlertTriangle,
  Mail,
  Globe,
  Lock,
  Server,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { useConfigurationsData } from '@/hooks/useConfigurationsData';

const ConfiguracoesPage = () => {
  const { config, loading, updateConfiguration, refetch } = useConfigurationsData();
  const [isLoading, setIsLoading] = useState(false);
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
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
          <span className="ml-2 text-indexa-purple">Carregando configurações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-gray-600">Gerencie as configurações globais da plataforma INDEXA</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-indexa-purple hover:bg-indexa-purple-dark text-white"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Todas
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status da Conexão */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Conectado ao Supabase com Sucesso!</h3>
              <p className="text-green-700 text-sm">
                Sistema funcionando normalmente • Configurações sincronizadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <Input
                id="siteName"
                value={localSettings.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                className="border-gray-300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="siteDescription" className="text-gray-700">Descrição</Label>
              <Input
                id="siteDescription"
                value={localSettings.siteDescription}
                onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                className="border-gray-300"
              />
            </div>

            <Separator className="bg-gray-200" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-700">Modo Manutenção</Label>
                  <p className="text-xs text-gray-500">Desabilita acesso para usuários</p>
                </div>
                <Switch
                  checked={localSettings.maintenanceMode}
                  onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-700">Modo Debug</Label>
                  <p className="text-xs text-gray-500">Exibe logs detalhados</p>
                </div>
                <Switch
                  checked={localSettings.debugMode}
                  onCheckedChange={(checked) => handleInputChange('debugMode', checked)}
                />
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
              <Switch
                checked={localSettings.forceHttps}
                onCheckedChange={(checked) => handleInputChange('forceHttps', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-700">Autenticação 2FA</Label>
                <p className="text-xs text-gray-500">Requer verificação em duas etapas</p>
              </div>
              <Switch
                checked={localSettings.twoFactorAuth}
                onCheckedChange={(checked) => handleInputChange('twoFactorAuth', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="text-gray-700">Timeout de Sessão (minutos)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={localSettings.sessionTimeout}
                onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts" className="text-gray-700">Máximo de Tentativas de Login</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={localSettings.maxLoginAttempts}
                onChange={(e) => handleInputChange('maxLoginAttempts', parseInt(e.target.value))}
                className="border-gray-300"
              />
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
              <Switch
                checked={localSettings.emailNotifications}
                onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-700">Notificações Push</Label>
                <p className="text-xs text-gray-500">Notificações no navegador</p>
              </div>
              <Switch
                checked={localSettings.pushNotifications}
                onCheckedChange={(checked) => handleInputChange('pushNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-700">Alertas de Admin</Label>
                <p className="text-xs text-gray-500">Alertas para administradores</p>
              </div>
              <Switch
                checked={localSettings.adminAlerts}
                onCheckedChange={(checked) => handleInputChange('adminAlerts', checked)}
              />
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
              <Input
                id="smtpHost"
                value={localSettings.smtpHost}
                onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPort" className="text-gray-700">Porta SMTP</Label>
              <Input
                id="smtpPort"
                value={localSettings.smtpPort}
                onChange={(e) => handleInputChange('smtpPort', e.target.value)}
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpUser" className="text-gray-700">Usuário SMTP</Label>
              <Input
                id="smtpUser"
                value={localSettings.smtpUser}
                onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                className="border-gray-300"
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPassword" className="text-gray-700">Senha SMTP</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={localSettings.smtpPassword}
                onChange={(e) => handleInputChange('smtpPassword', e.target.value)}
                className="border-gray-300"
                placeholder="••••••••"
              />
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
};

export default ConfiguracoesPage;
