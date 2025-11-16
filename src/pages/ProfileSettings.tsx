import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Mail, Phone, Building2, Lock, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, updateProfile, updatePassword } = useProfile();

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    company_name: profile?.company_name || '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        company_name: profile.company_name || '',
      });
    }
  }, [profile]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProfile(formData);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setChangingPassword(true);

    try {
      await updatePassword(passwordData.newPassword);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } finally {
      setChangingPassword(false);
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

                <div className="space-y-2">
                  <Label htmlFor="company_name" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Empresa
                  </Label>
                  <Input
                    id="company_name"
                    type="text"
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                    placeholder="Nome da sua empresa"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
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
                Segurança
              </CardTitle>
              <CardDescription>
                Altere sua senha para manter sua conta segura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Digite sua nova senha"
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirme sua nova senha"
                    minLength={6}
                  />
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Requisitos da senha:</strong>
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• Mínimo de 6 caracteres</li>
                    <li>• Combine letras, números e símbolos para maior segurança</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={changingPassword}
                  variant="secondary"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Alterando Senha...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Alterar Senha
                    </>
                  )}
                </Button>
              </form>
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
                <span className="text-sm font-mono">{user?.id.substring(0, 8)}...</span>
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
