
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, User, Bell, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';

interface UserSettings {
  email: string;
  name: string;
  phone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

const AdvertiserSettings = () => {
  const { userProfile } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    email: '',
    name: '',
    phone: '',
    notifications: {
      email: true,
      sms: false,
      push: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserSettings();
  }, [userProfile]);

  const loadUserSettings = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);

      // Buscar dados do usuário do auth
      const { data: authUser, error } = await supabase.auth.getUser();
      
      if (error) throw error;

      if (authUser.user) {
        setSettings({
          email: authUser.user.email || '',
          name: authUser.user.user_metadata?.name || authUser.user.user_metadata?.full_name || '',
          phone: authUser.user.user_metadata?.phone || '',
          notifications: {
            email: authUser.user.user_metadata?.notifications?.email ?? true,
            sms: authUser.user.user_metadata?.notifications?.sms ?? false,
            push: authUser.user.user_metadata?.notifications?.push ?? true
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Atualizar metadados do usuário
      const { error } = await supabase.auth.updateUser({
        data: {
          name: settings.name,
          phone: settings.phone,
          notifications: settings.notifications
        }
      });

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (type: keyof UserSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [type]: value }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-indexa-purple" />
        <p className="ml-2 text-lg">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">Gerencie suas informações pessoais e preferências</p>
      </div>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">O email não pode ser alterado</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={settings.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Preferências de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por Email</Label>
              <p className="text-sm text-gray-500">Receba atualizações sobre suas campanhas por email</p>
            </div>
            <Switch
              checked={settings.notifications.email}
              onCheckedChange={(checked) => handleNotificationChange('email', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações SMS</Label>
              <p className="text-sm text-gray-500">Receba alertas importantes via SMS</p>
            </div>
            <Switch
              checked={settings.notifications.sms}
              onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações Push</Label>
              <p className="text-sm text-gray-500">Receba notificações no navegador</p>
            </div>
            <Switch
              checked={settings.notifications.push}
              onCheckedChange={(checked) => handleNotificationChange('push', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alterar Senha</Label>
              <p className="text-sm text-gray-500">Altere sua senha de acesso</p>
            </div>
            <Button variant="outline" onClick={() => toast.info('Funcionalidade em desenvolvimento')}>
              Alterar Senha
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cancelamento de Conta</Label>
              <p className="text-sm text-gray-500">Para cancelar sua conta, entre em contato por email: suporte@indexa.com.br</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-indexa-purple hover:bg-indexa-purple/90"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AdvertiserSettings;
