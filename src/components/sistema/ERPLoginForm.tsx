import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

// Roles permitidos para acesso ao ERP
const ALLOWED_ERP_ROLES = ['super_admin', 'admin', 'admin_marketing', 'admin_financeiro'];

const ERPLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 [ERP_LOGIN] Tentando autenticar:', email);
      
      // Autenticar com Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (signInError) {
        console.error('❌ [ERP_LOGIN] Erro de autenticação:', signInError);
        throw signInError;
      }

      if (!data.user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se email foi confirmado
      if (!data.user.email_confirmed_at) {
        console.warn('⚠️ [ERP_LOGIN] Email não confirmado');
        await supabase.auth.signOut();
        setError('Por favor, confirme seu email antes de fazer login');
        setIsLoading(false);
        return;
      }

      console.log('✅ [ERP_LOGIN] Autenticado com sucesso, verificando role...');

      // Buscar role do usuário via RPC
      let userRole: string | null = null;
      
      try {
        const { data: highestRole, error: roleError } = await supabase
          .rpc('get_user_highest_role', { p_user_id: data.user.id });
        
        if (roleError) {
          console.warn('⚠️ [ERP_LOGIN] Erro ao buscar role via RPC:', roleError);
          // Fallback: buscar da tabela users
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single();
          userRole = userData?.role || null;
        } else {
          userRole = highestRole || null;
        }
      } catch (roleError) {
        console.error('⚠️ [ERP_LOGIN] Exceção ao buscar role:', roleError);
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();
        userRole = userData?.role || null;
      }

      console.log('🔍 [ERP_LOGIN] Role do usuário:', userRole);

      // Verificar se usuário tem permissão para acessar o ERP
      if (!userRole || !ALLOWED_ERP_ROLES.includes(userRole)) {
        console.warn('🚫 [ERP_LOGIN] Acesso negado - role não autorizada:', userRole);
        
        // Fazer logout
        await supabase.auth.signOut();
        
        setError('Acesso restrito a administradores do sistema');
        toast.error('Acesso negado', {
          description: 'Esta área é exclusiva para administradores.'
        });
        
        setIsLoading(false);
        return;
      }

      // Verificar se usuário está bloqueado
      const { data: userData } = await supabase
        .from('users')
        .select('is_blocked, two_factor_enabled, telefone')
        .eq('id', data.user.id)
        .single();

      if (userData?.is_blocked) {
        console.warn('🚫 [ERP_LOGIN] Usuário bloqueado');
        await supabase.auth.signOut();
        setError('Sua conta foi bloqueada. Entre em contato com o administrador.');
        setIsLoading(false);
        return;
      }

      // Se 2FA estiver ativado
      if (userData?.two_factor_enabled && userData?.telefone) {
        console.log('🔐 [ERP_LOGIN] 2FA detectado, ativando auth gate');
        
        // 🔐 AUTH GATE: Definir flag ANTES de qualquer navegação
        sessionStorage.setItem('pending_2fa', data.user.id);
        
        try {
          await supabase.functions.invoke('send-user-whatsapp-code', {
            body: { 
              userId: data.user.id, 
              telefone: userData.telefone,
              tipo: '2fa_login' 
            }
          });

          toast.info('Código de verificação enviado para seu WhatsApp');
          navigate(`/verificacao-2fa?userId=${data.user.id}&redirect=/super_admin`);
          return;
        } catch (error) {
          console.error('❌ [ERP_LOGIN] Erro ao enviar código 2FA:', error);
          toast.error('Erro ao enviar código de verificação');
        }
      }

      console.log('✅ [ERP_LOGIN] Login bem-sucedido, redirecionando para dashboard...');
      
      toast.success('Login realizado com sucesso!', {
        description: 'Bem-vindo ao ERP'
      });

      // Redirecionar para o dashboard apropriado
      // Nota: o dashboard do super_admin é a rota index (/super_admin).
      const targetPath = userRole === 'super_admin' ? '/super_admin' : '/admin';
      navigate(targetPath, { replace: true });
      
    } catch (error: any) {
      console.error('❌ [ERP_LOGIN] Erro geral:', error);
      
      let errorMessage = 'Erro ao fazer login';
      
      if (error.message === 'Invalid login credentials') {
        errorMessage = 'Email ou senha incorretos';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Digite seu email para redefinir a senha');
      return;
    }

    try {
      const { isRateLimitError, extractWaitSeconds, setCooldown, getRemainingCooldown } = await import('@/utils/resetPasswordCooldown');
      
      const remaining = getRemainingCooldown(email);
      if (remaining > 0) {
        toast.error(`Aguarde ${remaining} segundos antes de tentar novamente`);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        if (isRateLimitError(error)) {
          const wait = extractWaitSeconds(error.message) || 60;
          setCooldown(email, wait);
          toast.error(`Aguarde ${wait} segundos antes de tentar novamente`);
          return;
        }
        throw error;
      }

      setCooldown(email, 60);
      toast.success('Email de redefinição enviado!', {
        description: 'Verifique sua caixa de entrada'
      });
    } catch (error: any) {
      toast.error('Erro ao enviar email de redefinição');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensagem de erro */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
        >
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </motion.div>
      )}

      {/* Campo Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground font-medium">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          disabled={isLoading}
          className="h-12 bg-muted/30 border-border/50 focus:border-primary focus:ring-primary/20"
          autoComplete="email"
        />
      </div>

      {/* Campo Senha */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-foreground font-medium">
            Senha
          </Label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Esqueceu a senha?
          </button>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
            className="h-12 bg-muted/30 border-border/50 focus:border-primary focus:ring-primary/20 pr-10"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Botão de Login */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 text-base font-semibold"
        style={{ 
          background: 'linear-gradient(135deg, hsl(355 68% 37%) 0%, hsl(355 68% 30%) 100%)',
          boxShadow: '0 4px 14px 0 hsl(355 68% 37% / 0.25)'
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </Button>
    </form>
  );
};

export default ERPLoginForm;
