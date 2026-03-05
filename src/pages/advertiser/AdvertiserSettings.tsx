import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, User, Shield, Save, FileText, Pencil, ShieldCheck, AlertTriangle, Smartphone, Lock, ArrowLeft, X } from 'lucide-react';
import { AppleSwitch } from '@/components/ui/apple-switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';
import AvatarUpload from '@/components/ui/avatar-upload';
import DocumentUpload from '@/components/ui/document-upload';
import { CompanyBrandSection } from '@/components/settings/CompanyBrandSection';
import { WhatsAppVerificationModal } from '@/components/settings/WhatsAppVerificationModal';
import { cn } from '@/lib/utils';

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
    notifications: { email: true, sms: false, push: true },
  });
  const [originalSettings, setOriginalSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Protection against unsaved changes
  const hasChanges = isEditing && originalSettings && JSON.stringify(settings) !== JSON.stringify(originalSettings);

  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  useEffect(() => {
    loadUserSettings();
  }, [userProfile]);

  const loadUserSettings = async () => {
    if (!userProfile) return;
    try {
      setLoading(true);
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', authUser.user?.id).single();
      if (userError && userError.code !== 'PGRST116') throw userError;

      if (authUser.user) {
        const loaded: UserSettings = {
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
            push: authUser.user.user_metadata?.notifications?.push ?? true,
          },
        };
        setSettings(loaded);
        setOriginalSettings(loaded);
        setTwoFactorEnabled(userData?.two_factor_enabled || false);
        setPhoneVerified(userData?.telefone_verificado || false);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterEditMode = () => {
    setOriginalSettings({ ...settings });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (originalSettings) setSettings(originalSettings);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
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

      const { error: authError } = await supabase.auth.updateUser({
        data: { name: settings.name, phone: settings.phone, notifications: settings.notifications },
      });
      if (authError) throw authError;

      const { data: existingUser } = await supabase.from('users').select('role').eq('id', user.id).single();
      const { error: userError } = await supabase.from('users').upsert({
        id: user.id,
        email: user.email!,
        role: existingUser?.role || 'client',
        cpf: settings.tipo_documento === 'cpf' ? settings.cpf : null,
        documento_estrangeiro: settings.tipo_documento === 'documento_estrangeiro' ? settings.documento_estrangeiro : null,
        documento_frente_url: settings.tipo_documento === 'documento_estrangeiro' ? settings.documento_frente_url : null,
        documento_verso_url: settings.tipo_documento === 'documento_estrangeiro' ? settings.documento_verso_url : null,
        avatar_url: settings.avatar_url,
        tipo_documento: settings.tipo_documento,
      });
      if (userError) throw userError;

      setOriginalSettings({ ...settings });
      setIsEditing(false);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserSettings, value: string) => {
    if (field === 'cpf') value = formatDocument(value, 'cpf');
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleDocumentTypeChange = (type: 'cpf' | 'documento_estrangeiro') => {
    setSettings((prev) => ({
      ...prev,
      tipo_documento: type,
      cpf: type === 'cpf' ? prev.cpf : '',
      documento_estrangeiro: type === 'documento_estrangeiro' ? prev.documento_estrangeiro : '',
      documento_frente_url: type === 'documento_estrangeiro' ? prev.documento_frente_url : '',
      documento_verso_url: type === 'documento_estrangeiro' ? prev.documento_verso_url : '',
    }));
  };

  const disabledFieldClass = "bg-gray-50 border-transparent shadow-none cursor-not-allowed";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-exa-red" />
        <p className="ml-2 text-lg">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] -ml-1"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Voltar</span>
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Configurações da Conta</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as informações da sua empresa e integrações
          </p>
        </div>
        {!isEditing ? (
          <Button variant="outline" onClick={handleEnterEditMode} className="min-h-[44px]">
            <Pencil className="h-4 w-4 mr-2" />
            Editar Configurações
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancelEdit} className="min-h-[44px]">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-exa-red hover:bg-exa-red/90 text-white min-h-[44px]">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        )}
      </div>

      {/* 1. Account Summary (read-only) */}
      <Card>
        <CardContent className="flex items-center gap-4 py-5">
          <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {settings.avatar_url ? (
              <img src={settings.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <User className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground truncate">{settings.name || 'Sem nome'}</p>
            <p className="text-sm text-muted-foreground truncate">{settings.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Personal Data + WhatsApp + Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <User className="h-5 w-5 mr-2 text-exa-red" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input id="email" type="email" value={settings.email} disabled className={disabledFieldClass} />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm">Nome Completo</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Seu nome completo"
                disabled={!isEditing}
                className={cn("min-h-[44px]", !isEditing && disabledFieldClass)}
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="space-y-3">
            <Label className="text-sm">WhatsApp</Label>
            <div className="flex gap-2 items-end">
              <Input
                value={settings.phone ? settings.phone.replace(/(\d{2})(\d{5})(\d{4})/, '(**) *****-$3') : ''}
                disabled
                className={cn("flex-1 min-h-[44px]", disabledFieldClass)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowWhatsAppModal(true)}
                className="min-h-[44px]"
              >
                <Pencil className="h-4 w-4 mr-2" />
                {phoneVerified ? 'Alterar Número' : 'Editar'}
              </Button>
            </div>

            {/* WhatsApp Status Alert */}
            {phoneVerified ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-green-800">WhatsApp Conectado</p>
                  <p className="text-sm text-green-600">Número verificado com sucesso</p>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100 text-xs">
                  Verificado
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-amber-800">WhatsApp não verificado</p>
                  <p className="text-sm text-amber-600">Verifique seu número para ativar recursos de segurança</p>
                </div>
                <Button size="sm" onClick={() => setShowWhatsAppModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0 min-h-[36px]">
                  Verificar
                </Button>
              </div>
            )}
          </div>

          {/* Documentation */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-exa-red" />
              <Label className="text-sm font-semibold">Documentação</Label>
            </div>

            <div className="space-y-3">
              <Label className="text-sm">Tipo de Documento</Label>
              <RadioGroup
                value={settings.tipo_documento}
                onValueChange={handleDocumentTypeChange}
                disabled={!isEditing}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cpf" id="cpf" disabled={!isEditing} />
                  <Label htmlFor="cpf" className={cn(!isEditing && "text-muted-foreground")}>CPF (Brasileiro)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="documento_estrangeiro" id="documento_estrangeiro" disabled={!isEditing} />
                  <Label htmlFor="documento_estrangeiro" className={cn(!isEditing && "text-muted-foreground")}>Documento de Identificação Estrangeiro</Label>
                </div>
              </RadioGroup>
            </div>

            {settings.tipo_documento === 'cpf' && (
              <div className="space-y-1.5">
                <Label htmlFor="cpf-field" className="text-sm">CPF *</Label>
                <Input
                  id="cpf-field"
                  value={settings.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  disabled={!isEditing}
                  className={cn("min-h-[44px]", !isEditing && disabledFieldClass)}
                />
                {settings.cpf && !validateDocument(settings.cpf, 'cpf') && (
                  <p className="text-xs text-destructive">CPF inválido</p>
                )}
              </div>
            )}

            {settings.tipo_documento === 'documento_estrangeiro' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="doc_estrangeiro" className="text-sm">Número do Documento *</Label>
                  <Input
                    id="doc_estrangeiro"
                    value={settings.documento_estrangeiro}
                    onChange={(e) => handleInputChange('documento_estrangeiro', e.target.value)}
                    placeholder="Número do documento de identificação"
                    disabled={!isEditing}
                    className={cn("min-h-[44px]", !isEditing && disabledFieldClass)}
                  />
                </div>
                {isEditing && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentUpload
                      label="Frente do Documento *"
                      value={settings.documento_frente_url}
                      onChange={(url) => setSettings((prev) => ({ ...prev, documento_frente_url: url || '' }))}
                    />
                    <DocumentUpload
                      label="Verso do Documento *"
                      value={settings.documento_verso_url}
                      onChange={(url) => setSettings((prev) => ({ ...prev, documento_verso_url: url || '' }))}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Company/Brand */}
      <CompanyBrandSection isEditing={isEditing} />

      {/* 4. Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Shield className="h-5 w-5 mr-2 text-exa-red" />
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 2FA */}
          <div className="rounded-xl border p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-exa-red/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-exa-red" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[15px] font-semibold text-foreground">Autenticação de Dois Fatores</h3>
                  <Badge className={cn(
                    "text-[11px]",
                    twoFactorEnabled
                      ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-100"
                      : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100"
                  )}>
                    {twoFactorEnabled ? 'Ativo' : 'Desativado'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Protege sua conta com uma camada adicional de segurança
                </p>
                {!phoneVerified && (
                  <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                    <Smartphone className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <p className="text-[13px] text-amber-700">Verifique seu WhatsApp primeiro para ativar o 2FA</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowWhatsAppModal(true)}
                      className="ml-auto text-amber-700 hover:text-amber-800 hover:bg-amber-100 h-8 text-[13px] flex-shrink-0"
                    >
                      Verificar agora
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 pt-1">
                <AppleSwitch
                  checked={twoFactorEnabled}
                  disabled={!phoneVerified}
                  size="lg"
                  onCheckedChange={async (checked) => {
                    if (!phoneVerified) {
                      toast.error('Verifique seu WhatsApp antes de ativar o 2FA');
                      return;
                    }
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) throw new Error('Usuário não autenticado');
                      const { error } = await supabase.from('users').update({ two_factor_enabled: checked }).eq('id', user.id);
                      if (error) throw error;
                      setTwoFactorEnabled(checked);
                      toast.success(checked ? '2FA ativado com sucesso!' : '2FA desativado');
                    } catch (error) {
                      console.error('Erro ao atualizar 2FA:', error);
                      toast.error('Erro ao atualizar configuração de 2FA');
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="text-[15px] font-medium">Alterar Senha</Label>
              <p className="text-sm text-muted-foreground">Altere sua senha de acesso</p>
            </div>
            <Button variant="outline" onClick={() => toast.info('Funcionalidade em desenvolvimento')} className="min-h-[44px]">
              Alterar Senha
            </Button>
          </div>

          {/* Account Cancellation */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="space-y-0.5">
              <Label className="text-[15px] font-medium text-amber-900">Cancelamento de Conta</Label>
              <p className="text-sm text-amber-700">Para cancelar sua conta, entre em contato por email: suporte@examidia.com.br</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editing Footer */}
      {isEditing && (
        <div className="flex justify-center gap-3 pt-2 pb-8">
          <Button variant="outline" onClick={handleCancelEdit} className="min-h-[48px] px-8">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-exa-red hover:bg-exa-red/90 text-white min-h-[48px] px-8">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>}
          </Button>
        </div>
      )}

      {/* WhatsApp Modal */}
      <WhatsAppVerificationModal
        open={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        currentPhone={settings.phone}
        userId={userProfile?.id || ''}
        mode={phoneVerified ? 'change' : 'verify'}
        onSuccess={async (newPhone) => {
          setSettings((prev) => ({ ...prev, phone: newPhone }));
          setPhoneVerified(true);
          await loadUserSettings();
          toast.success('WhatsApp verificado com sucesso!');
        }}
      />
    </div>
  );
};

export default AdvertiserSettings;
