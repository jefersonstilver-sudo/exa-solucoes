
import React, { useState } from 'react';
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
  Server
} from 'lucide-react';
import { toast } from 'sonner';

const ConfiguracoesPage = () => {
  const [settings, setSettings] = useState({
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

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações do Sistema</h1>
          <p className="text-slate-400">Gerencie as configurações globais da plataforma</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900"
        >
          {isLoading ? (
            <>Salvando...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Todas
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações Gerais */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="h-5 w-5 mr-2 text-amber-400" />
              Configurações Gerais
            </CardTitle>
            <CardDescription className="text-slate-400">
              Informações básicas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName" className="text-slate-300">Nome do Site</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="siteDescription" className="text-slate-300">Descrição</Label>
              <Input
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <Separator className="bg-slate-600" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Modo Manutenção</Label>
                  <p className="text-xs text-slate-400">Desabilita acesso para usuários</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Modo Debug</Label>
                  <p className="text-xs text-slate-400">Exibe logs detalhados</p>
                </div>
                <Switch
                  checked={settings.debugMode}
                  onCheckedChange={(checked) => handleInputChange('debugMode', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Segurança */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="h-5 w-5 mr-2 text-amber-400" />
              Segurança
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configurações de segurança e autenticação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Forçar HTTPS</Label>
                <p className="text-xs text-slate-400">Redireciona HTTP para HTTPS</p>
              </div>
              <Switch
                checked={settings.forceHttps}
                onCheckedChange={(checked) => handleInputChange('forceHttps', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Autenticação 2FA</Label>
                <p className="text-xs text-slate-400">Requer verificação em duas etapas</p>
              </div>
              <Switch
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => handleInputChange('twoFactorAuth', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="text-slate-300">Timeout de Sessão (minutos)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts" className="text-slate-300">Máx. Tentativas de Login</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleInputChange('maxLoginAttempts', parseInt(e.target.value))}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Notificação */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Bell className="h-5 w-5 mr-2 text-amber-400" />
              Notificações
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure como e quando receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Notificações por Email</Label>
                <p className="text-xs text-slate-400">Receber alertas via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Push Notifications</Label>
                <p className="text-xs text-slate-400">Notificações no navegador</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleInputChange('pushNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Alertas Administrativos</Label>
                <p className="text-xs text-slate-400">Alertas críticos do sistema</p>
              </div>
              <Switch
                checked={settings.adminAlerts}
                onCheckedChange={(checked) => handleInputChange('adminAlerts', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Email */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Mail className="h-5 w-5 mr-2 text-amber-400" />
              Configurações de Email
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure o servidor SMTP para envio de emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpHost" className="text-slate-300">Servidor SMTP</Label>
                <Input
                  id="smtpHost"
                  value={settings.smtpHost}
                  onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort" className="text-slate-300">Porta</Label>
                <Input
                  id="smtpPort"
                  value={settings.smtpPort}
                  onChange={(e) => handleInputChange('smtpPort', e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpUser" className="text-slate-300">Usuário SMTP</Label>
              <Input
                id="smtpUser"
                type="email"
                value={settings.smtpUser}
                onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="seu-email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPassword" className="text-slate-300">Senha SMTP</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => handleInputChange('smtpPassword', e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="••••••••"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Perigosas */}
      <Card className="bg-slate-800/50 border-slate-700/50 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
            Zona de Perigo
          </CardTitle>
          <CardDescription className="text-slate-400">
            Ações irreversíveis que podem afetar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="border-orange-600 text-orange-400 hover:bg-orange-600/10">
              <Database className="h-4 w-4 mr-2" />
              Backup Manual
            </Button>
            <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-600/10">
              <Server className="h-4 w-4 mr-2" />
              Limpar Cache
            </Button>
            <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-600/10">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Reset Sistema
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracoesPage;
