import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  User, Shield, Save, Pencil, ShieldCheck, AlertTriangle, 
  Smartphone, Lock, Loader2, X, Building2, Mail, Calendar,
  Key, ArrowLeft
} from 'lucide-react';
import { WhatsAppVerificationModal } from '@/components/settings/WhatsAppVerificationModal';
import { usePasswordReset } from '@/hooks/usePasswordReset';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getRoleDisplayInfo } from '@/services/userRoleService';
import type { UserRole } from '@/types/userTypes';

const AdminProfileSettings = () => {
  const { userProfile, refreshUserProfile } = useAuth();
  const userEmail = userProfile?.email;
  const { sendReset, isLoading: resetHookLoading, cooldown } = usePasswordReset(userEmail);

  const [name, setName] = useState('');
  const [displayEmail, setDisplayEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [createdAt, setCreatedAt] = useState('');
  const [userId, setUserId] = useState('');
  const [departamento, setDepartamento] = useState('');

  const loadProfile = useCallback(async () => {
    if (!userProfile) return;
    try {
      setLoading(true);
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.user.id)
        .single();

      const userName = authUser.user.user_metadata?.name || 
                       authUser.user.user_metadata?.full_name || '';
      setName(userName);
      setOriginalName(userName);
      setEmail(authUser.user.email || '');
      setPhone(authUser.user.user_metadata?.phone || userData?.telefone || '');
      setTwoFactorEnabled(userData?.two_factor_enabled || false);
      setPhoneVerified(userData?.telefone_verificado === true || !!userData?.telefone_verificado_at);
      setCreatedAt(authUser.user.created_at || '');
      setUserId(authUser.user.id);
      setDepartamento(
        typeof userProfile?.departamento === 'object' && userProfile?.departamento?.name 
          ? userProfile.departamento.name 
          : ''
      );
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({
        data: { name }
      });
      if (error) throw error;

      setOriginalName(name);
      setIsEditing(false);
      toast.success('Nome atualizado com sucesso!');
      await refreshUserProfile();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    await sendReset();
  };

  const handleToggle2FA = async (checked: boolean) => {
    if (!phoneVerified) {
      toast.error('Verifique seu WhatsApp antes de ativar o 2FA');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('users')
        .update({ two_factor_enabled: checked })
        .eq('id', user.id);
      if (error) throw error;
      setTwoFactorEnabled(checked);
      toast.success(checked ? '2FA ativado com sucesso!' : '2FA desativado');
    } catch (error) {
      console.error('Erro ao atualizar 2FA:', error);
      toast.error('Erro ao atualizar configuração de 2FA');
    }
  };

  const roleInfo = userProfile?.role 
    ? getRoleDisplayInfo(userProfile.role as UserRole) 
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-[#9C1E1E]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title="Meu Perfil" />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Meu Perfil</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie suas informações pessoais e configurações de segurança
            </p>
          </div>
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)} className="min-h-[44px]">
              <Pencil className="h-4 w-4 mr-2" />
              Editar Nome
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setName(originalName); setIsEditing(false); }} className="min-h-[44px]">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="!bg-[#9C1E1E] hover:!bg-[#7a1818] !text-white min-h-[44px]">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
            </div>
          )}
        </div>

        {/* 1. Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="h-5 w-5 mr-2 text-[#9C1E1E]" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-sm">Email</Label>
                <Input value={email} disabled className="bg-muted border-transparent shadow-none cursor-not-allowed min-h-[44px]" />
                <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Nome Completo</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  disabled={!isEditing}
                  className={cn("min-h-[44px]", !isEditing && "bg-muted border-transparent shadow-none cursor-not-allowed")}
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="space-y-3">
              <Label className="text-sm">WhatsApp</Label>
              <div className="flex gap-2 items-end">
                <Input
                  value={phone ? phone.replace(/(\d{2})(\d{5})(\d{4})/, '(**) *****-$3') : 'Não informado'}
                  disabled
                  className="flex-1 min-h-[44px] bg-muted border-transparent shadow-none cursor-not-allowed"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWhatsAppModal(true)}
                  className="min-h-[44px]"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  {phoneVerified ? 'Alterar' : 'Verificar'}
                </Button>
              </div>

              {phoneVerified ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-green-800">WhatsApp Conectado</p>
                    <p className="text-sm text-green-600">Disponível para EXA Alerts e notificações</p>
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
                    <p className="text-sm text-amber-600">Verifique para receber notificações EXA Alerts e ativar 2FA</p>
                  </div>
                  <Button size="sm" onClick={() => setShowWhatsAppModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0 min-h-[36px]">
                    Verificar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Segurança - 2FA + Reset */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Shield className="h-5 w-5 mr-2 text-[#9C1E1E]" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 2FA */}
            <div className="rounded-xl border p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-[#9C1E1E]/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-[#9C1E1E]" />
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
                    Protege sua conta com verificação via WhatsApp a cada login
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
                  <Toggle
                    checked={twoFactorEnabled}
                    disabled={!phoneVerified}
                    color="red"
                    size="large"
                    onChange={(e) => handleToggle2FA(e.target.checked)}
                  />
                </div>
              </div>
            </div>

            {/* Reset Password */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="space-y-0.5">
                <Label className="text-[15px] font-medium">Alterar Senha</Label>
                <p className="text-sm text-muted-foreground">Receba um email para redefinir sua senha</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleResetPassword} 
                disabled={resetHookLoading || cooldown > 0}
                className="min-h-[44px]"
              >
                {resetHookLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                {cooldown > 0 ? `Aguarde ${cooldown}s` : 'Enviar Link'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 3. Informações da Conta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Building2 className="h-5 w-5 mr-2 text-[#9C1E1E]" />
              Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">ID do Usuário</p>
                <p className="text-sm font-mono text-foreground truncate">{userId}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Cargo</p>
                <div className="flex items-center gap-2">
                  {roleInfo && (
                    <Badge className={cn("text-xs", roleInfo.color)}>
                      {roleInfo.label}
                    </Badge>
                  )}
                </div>
              </div>
              {departamento && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Departamento</p>
                  <p className="text-sm font-medium text-foreground">{departamento}</p>
                </div>
              )}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Conta criada em</p>
                <p className="text-sm text-foreground">
                  {createdAt ? new Date(createdAt).toLocaleDateString('pt-BR', { 
                    day: '2-digit', month: 'long', year: 'numeric' 
                  }) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Modal */}
        <WhatsAppVerificationModal
          open={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          currentPhone={phone}
          userId={userId}
          mode={phoneVerified ? 'change' : 'verify'}
          onSuccess={async (newPhone) => {
            setPhone(newPhone);
            setPhoneVerified(true);
            await loadProfile();
            toast.success('WhatsApp verificado com sucesso!');
          }}
        />
      </div>
    </div>
  );
};

export default AdminProfileSettings;
