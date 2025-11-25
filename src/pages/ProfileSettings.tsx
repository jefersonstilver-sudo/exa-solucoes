import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Mail, Phone, Building2, Lock, ArrowLeft, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { CompanyBrandSection } from '@/components/settings/CompanyBrandSection';
import { cn } from '@/lib/utils';
import { NotificationSettings } from '@/components/admin/notifications/NotificationSettings';

// Validation schemas
const profileSchema = z.object({
  nome: z.string().trim().max(100, 'Nome muito longo').optional(),
  telefone: z.string().trim().max(20, 'Telefone inválido').optional(),
  company_name: z.string().trim().max(100, 'Nome da empresa muito longo').optional(),
});

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const { settings, loading, updateSettings } = useUserSettings();

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    company_name: '',
  });

  const [saving, setSaving] = useState(false);
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);


  useEffect(() => {
    if (settings) {
      setFormData({
        nome: settings.nome || '',
        telefone: settings.telefone || '',
        company_name: settings.company_name || '',
      });
    }
  }, [settings]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    try {
      profileSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setSaving(true);

    try {
      // Atualizar users (nome, telefone) e profiles (company_name)
      await updateSettings({
        nome: formData.nome,
        telefone: formData.telefone,
        company_name: formData.company_name,
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordResetRequest = async () => {
    if (!user?.email) {
      toast.error('Email não encontrado');
      return;
    }

    setSendingPasswordReset(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('Link de redefinição enviado para seu email!');
    } catch (error) {
      console.error('Erro ao solicitar redefinição:', error);
      toast.error('Erro ao enviar email de redefinição');
    } finally {
      setSendingPasswordReset(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 hover:bg-muted"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas informações pessoais e configurações de segurança
          </p>
        </div>

        <div className="space-y-6">
          {/* Informações do Perfil */}
          <Card className="shadow-lg border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Atualize suas informações de perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    O e-mail não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Nome Completo
                  </Label>
                  <Input
                    id="nome"
                    type="text"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Seu nome completo"
                    className={cn(
                      formData.nome && "bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-800"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({ ...formData, telefone: e.target.value })
                    }
                    placeholder="(00) 00000-0000"
                    className={cn(
                      formData.telefone && "bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-800"
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Informações da Empresa - Seção Completa */}
          <CompanyBrandSection />

          {/* Alteração de Senha */}
          <Card className="shadow-lg border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Segurança da Conta
              </CardTitle>
              <CardDescription>
                Redefina sua senha através de um link seguro enviado por email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">
                    Por questões de segurança, você receberá um link por email para redefinir sua senha.
                    Este link é válido por 1 hora.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="font-medium">{user?.email}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePasswordResetRequest}
                  className="w-full"
                  disabled={sendingPasswordReset}
                  variant="secondary"
                >
                  {sendingPasswordReset ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Link de Redefinição
                    </>
                  )}
                </Button>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Dica de segurança:</strong> Escolha uma senha forte com pelo menos 8 caracteres,
                    incluindo letras maiúsculas, minúsculas, números e símbolos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Conta */}
          <Card className="shadow-lg border-muted">
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">ID da Conta</span>
                <span className="text-sm font-mono bg-muted/50 px-3 py-1 rounded">
                  {user?.id.substring(0, 5)}***
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Criado em</span>
                <span className="text-sm">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('pt-BR')
                    : '-'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Email verificado</span>
                <span className="text-sm">
                  {user?.email_confirmed_at ? 'Sim' : 'Não'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Notificações - Apenas Super Admins */}
          {isSuperAdmin && (
            <NotificationSettings variant="full" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
