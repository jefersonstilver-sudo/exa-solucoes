/**
 * Aba 1: Identidade
 * Exibe informações básicas do usuário com campos editáveis de baixo risco
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CCEmailsInput } from '@/components/ui/cc-emails-input';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Save,
  Loader2,
  Send,
  ShieldCheck,
  Upload,
  ImageIcon,
  X
} from 'lucide-react';
import { IdentityTabProps } from '@/types/userConsoleTypes';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

export const IdentityTab: React.FC<IdentityTabProps> = ({
  user,
  onSave,
  onResendEmail,
  onConfirmEmail,
  onUploadLogo,
  isSaving,
  isUploadingLogo = false
}) => {
  const [editData, setEditData] = useState({
    nome: user.nome || '',
    telefone: user.telefone || '',
    ccEmails: user.cc_emails || []
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar preview da logo atual
  useEffect(() => {
    const loadLogoPreview = async () => {
      const avatarUrl = (user.raw_user_meta_data as Record<string, unknown>)?.avatar_url as string | undefined;
      // Também checar se tem avatar_url direto (pode vir do users table)
      const storageKey = avatarUrl;
      
      if (storageKey && !storageKey.startsWith('http')) {
        const { data } = await supabase.storage
          .from('arquivos')
          .createSignedUrl(storageKey, 3600);
        if (data?.signedUrl) setLogoPreview(data.signedUrl);
      } else if (storageKey) {
        setLogoPreview(storageKey);
      }
    };
    loadLogoPreview();
  }, [user]);

  useEffect(() => {
    setEditData({
      nome: user.nome || '',
      telefone: user.telefone || '',
      ccEmails: user.cc_emails || []
    });
    setHasChanges(false);
  }, [user]);

  useEffect(() => {
    const changed = 
      editData.nome !== (user.nome || '') ||
      editData.telefone !== (user.telefone || '') ||
      JSON.stringify(editData.ccEmails) !== JSON.stringify(user.cc_emails || []);
    setHasChanges(changed);
  }, [editData, user]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateString));
    } catch {
      return 'Data inválida';
    }
  };

  const formatRelativeDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      });
    } catch {
      return '';
    }
  };

  const handleSave = async () => {
    await onSave(editData);
    setHasChanges(false);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const success = await onUploadLogo(file);
    if (success) {
      // Criar preview local imediato
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
    // Limpar input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isEmailConfirmed = !!user.email_confirmed_at;
  const isBlocked = user.is_blocked;

  return (
    <div className="space-y-6">
      {/* Alerta de Email não confirmado */}
      {!isEmailConfirmed && !isBlocked && (
        <Card className="border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                  Email não confirmado
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  O usuário precisa confirmar o email para acessar o sistema.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onResendEmail}
                    disabled={isSaving}
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Reenviar Email
                  </Button>
                  <Button
                    size="sm"
                    onClick={onConfirmEmail}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 mr-2" />
                    )}
                    Ativar Conta
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status do Usuário - Read Only */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Status da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Email */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={isEmailConfirmed 
                ? "bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300" 
                : "bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300"
              }
            >
              {isEmailConfirmed ? '✓ Confirmado' : '✗ Pendente'}
            </Badge>
          </div>

          {/* Data de Cadastro */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Cadastro</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(user.data_criacao)}
              </p>
            </div>
          </div>

          {/* Último Acesso */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Clock className="h-5 w-5 text-purple-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Último Acesso</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(user.last_access_at || user.last_sign_in_at)}
                {user.last_access_at && (
                  <span className="ml-2 text-primary">
                    ({formatRelativeDate(user.last_access_at)})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Status de Bloqueio */}
          {isBlocked && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Conta Bloqueada
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  {user.blocked_at ? `Bloqueado em ${formatDate(user.blocked_at)}` : 'Acesso bloqueado'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logo da Empresa do Cliente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Logo da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {logoPreview ? (
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 flex-shrink-0 bg-gradient-to-br from-[#4a0f0f] via-[#6B1515] to-[#7D1818] rounded-lg flex items-center justify-center overflow-hidden border">
                <img 
                  src={logoPreview} 
                  alt="Logo da empresa" 
                  className="h-full w-full object-contain p-2"
                />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground">Logo atual da empresa</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Trocar Logo
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground text-center">
                Nenhuma logo definida para este cliente
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLogo}
              >
                {isUploadingLogo ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Adicionar Logo da Empresa
              </Button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleLogoUpload}
          />
          <p className="text-xs text-muted-foreground">
            PNG, JPG, SVG ou WebP • Máx. 5MB • Aparecerá no dashboard do anunciante
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Dados Editáveis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-sm font-medium">
              Nome Completo
            </Label>
            <Input
              id="nome"
              value={editData.nome}
              onChange={(e) => setEditData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Nome completo do usuário"
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone Comercial
            </Label>
            <Input
              id="telefone"
              value={editData.telefone}
              onChange={(e) => setEditData(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="(45) 99999-9999"
            />
            <p className="text-xs text-muted-foreground">
              Este telefone aparecerá nas propostas comerciais
            </p>
          </div>

          {/* CC Emails */}
          <div className="space-y-2">
            <CCEmailsInput
              value={editData.ccEmails}
              onChange={(emails) => setEditData(prev => ({ ...prev, ccEmails: emails }))}
              label="E-mails de Cópia (CC)"
              placeholder="email@empresa.com"
              maxEmails={5}
            />
          </div>

          {/* Botão Salvar */}
          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
            {hasChanges && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ Você tem alterações não salvas
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};