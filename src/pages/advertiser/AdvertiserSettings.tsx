
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, User, Bell, Shield, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';
import AvatarUpload from '@/components/ui/avatar-upload';
import DocumentUpload from '@/components/ui/document-upload';

interface UserSettings {
  email: string;
  name: string;
  phone: string;
  cpf: string;
  documento_estrangeiro: string;
  documento_frente_url: string;
  documento_verso_url: string;
  avatar_url: string;
  tipo_documento: 'cpf' | 'documento_estrangeiro';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

const AdvertiserSettings = () => {
  const { userProfile } = useAuth();
  const { formatDocument, validateDocument } = useDocumentValidation();
  const [settings, setSettings] = useState<UserSettings>({
    email: '',
    name: '',
    phone: '',
    cpf: '',
    documento_estrangeiro: '',
    documento_frente_url: '',
    documento_verso_url: '',
    avatar_url: '',
    tipo_documento: 'cpf',
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

      // Buscar dados do usuário do auth e da tabela users
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.user?.id)
        .single();

      if (userError && userError.code !== 'PGRST116') throw userError;

      if (authUser.user) {
        setSettings({
          email: authUser.user.email || '',
          name: authUser.user.user_metadata?.name || authUser.user.user_metadata?.full_name || '',
          phone: authUser.user.user_metadata?.phone || '',
          cpf: userData?.cpf || '',
          documento_estrangeiro: userData?.documento_estrangeiro || '',
          documento_frente_url: userData?.documento_frente_url || '',
          documento_verso_url: userData?.documento_verso_url || '',
          avatar_url: userData?.avatar_url || '',
          tipo_documento: (userData?.tipo_documento as 'cpf' | 'documento_estrangeiro') || 'cpf',
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

      // Validações
      if (settings.tipo_documento === 'cpf' && !validateDocument(settings.cpf, 'cpf')) {
        toast.error('Por favor, informe um CPF válido');
        return;
      }

      if (settings.tipo_documento === 'documento_estrangeiro') {
        if (!settings.documento_estrangeiro.trim()) {
          toast.error('Por favor, informe o número do documento estrangeiro');
          return;
        }
        if (!settings.documento_frente_url || !settings.documento_verso_url) {
          toast.error('Por favor, faça upload da frente e verso do documento');
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Atualizar metadados do usuário no auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: settings.name,
          phone: settings.phone,
          notifications: settings.notifications
        }
      });

      if (authError) throw authError;

      // Buscar role atual do usuário
      const { data: existingUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      // Atualizar dados na tabela users
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email!,
          role: existingUser?.role || 'client',
          cpf: settings.tipo_documento === 'cpf' ? settings.cpf : null,
          documento_estrangeiro: settings.tipo_documento === 'documento_estrangeiro' ? settings.documento_estrangeiro : null,
          documento_frente_url: settings.tipo_documento === 'documento_estrangeiro' ? settings.documento_frente_url : null,
          documento_verso_url: settings.tipo_documento === 'documento_estrangeiro' ? settings.documento_verso_url : null,
          avatar_url: settings.avatar_url,
          tipo_documento: settings.tipo_documento
        });

      if (userError) throw userError;

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserSettings, value: string) => {
    if (field === 'cpf') {
      value = formatDocument(value, 'cpf');
    }
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (type: keyof UserSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [type]: value }
    }));
  };

  const handleDocumentTypeChange = (type: 'cpf' | 'documento_estrangeiro') => {
    setSettings(prev => ({
      ...prev,
      tipo_documento: type,
      // Limpar campos do tipo anterior
      cpf: type === 'cpf' ? prev.cpf : '',
      documento_estrangeiro: type === 'documento_estrangeiro' ? prev.documento_estrangeiro : '',
      documento_frente_url: type === 'documento_estrangeiro' ? prev.documento_frente_url : '',
      documento_verso_url: type === 'documento_estrangeiro' ? prev.documento_verso_url : ''
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
        <h1 className="text-3xl font-bold text-gray-900">Perfil</h1>
        <p className="text-gray-600 mt-1">Gerencie suas informações pessoais e documentação</p>
      </div>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Foto de Perfil */}
          <AvatarUpload
            value={settings.avatar_url}
            onChange={(url) => setSettings(prev => ({ ...prev, avatar_url: url || '' }))}
            userName={settings.name}
          />

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

      {/* Documentação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Documentação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo de Documento */}
          <div className="space-y-3">
            <Label>Tipo de Documento</Label>
            <RadioGroup
              value={settings.tipo_documento}
              onValueChange={handleDocumentTypeChange}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cpf" id="cpf" />
                <Label htmlFor="cpf">CPF (Brasileiro)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="documento_estrangeiro" id="documento_estrangeiro" />
                <Label htmlFor="documento_estrangeiro">Documento de Identificação Estrangeiro</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Campo CPF */}
          {settings.tipo_documento === 'cpf' && (
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={settings.cpf}
                onChange={(e) => handleInputChange('cpf', e.target.value)}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              {settings.cpf && !validateDocument(settings.cpf, 'cpf') && (
                <p className="text-xs text-red-500">CPF inválido</p>
              )}
            </div>
          )}

          {/* Documento Estrangeiro */}
          {settings.tipo_documento === 'documento_estrangeiro' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documento_estrangeiro">Número do Documento *</Label>
                <Input
                  id="documento_estrangeiro"
                  value={settings.documento_estrangeiro}
                  onChange={(e) => handleInputChange('documento_estrangeiro', e.target.value)}
                  placeholder="Número do documento de identificação"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DocumentUpload
                  label="Frente do Documento *"
                  value={settings.documento_frente_url}
                  onChange={(url) => setSettings(prev => ({ ...prev, documento_frente_url: url || '' }))}
                />
                
                <DocumentUpload
                  label="Verso do Documento *"
                  value={settings.documento_verso_url}
                  onChange={(url) => setSettings(prev => ({ ...prev, documento_verso_url: url || '' }))}
                />
              </div>
            </div>
          )}
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
