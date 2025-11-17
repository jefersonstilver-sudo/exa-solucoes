import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Mail, Phone, Building2, Lock, ArrowLeft, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { CompanyInfoSection } from '@/components/auth/registration/CompanyInfoSection';

// Validation schemas
const profileSchema = z.object({
  full_name: z.string().trim().max(100, 'Nome muito longo').optional(),
  phone: z.string().trim().max(20, 'Telefone inválido').optional(),
  company_name: z.string().trim().max(100, 'Nome da empresa muito longo').optional(),
  company_country: z.string().optional(),
  company_document: z.string().trim().max(20, 'Documento inválido').optional(),
});

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile();

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    company_name: profile?.company_name || '',
  });

  const [saving, setSaving] = useState(false);
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);


  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        company_name: profile.company_name || '',
      }));
    }
  }, [profile]);

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
      // Atualizar apenas profiles (full_name, phone, company_name)
      await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone,
        company_name: formData.company_name,
      });

      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
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
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Nome Completo
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <Separator className="my-6" />

                <CompanyInfoSection
                  companyName={formData.company_name}
                  companyCountry={formData.company_country}
                  companyDocument={formData.company_document}
                  onCompanyNameChange={(value) =>
                    setFormData({ ...formData, company_name: value })
                  }
                  onCompanyCountryChange={(value) =>
                    setFormData({ ...formData, company_country: value })
                  }
                  onCompanyDocumentChange={(value) =>
                    setFormData({ ...formData, company_document: value })
                  }
                />

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
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('pt-BR')
                    : '-'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Última atualização</span>
                <span className="text-sm">
                  {profile?.updated_at
                    ? new Date(profile.updated_at).toLocaleDateString('pt-BR')
                    : '-'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
