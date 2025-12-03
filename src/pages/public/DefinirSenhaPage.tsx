import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import UnifiedLogo from '@/components/layout/UnifiedLogo';

const DefinirSenhaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  // Validate token on mount
  useEffect(() => {
    const validateSession = async () => {
      try {
        // Check if we have a valid session from the recovery link
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          toast.error('Link inválido ou expirado. Solicite um novo link.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (!session) {
          // Try to exchange the token from URL
          const hash = window.location.hash;
          if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            if (accessToken && refreshToken) {
              const { error: setError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (setError) {
                console.error('Set session error:', setError);
                toast.error('Link inválido ou expirado');
                setTimeout(() => navigate('/login'), 2000);
                return;
              }
            }
          }
        }
        
        setIsValidating(false);
      } catch (err) {
        console.error('Validation error:', err);
        setIsValidating(false);
      }
    };

    validateSession();
  }, [navigate]);

  const passwordStrength = () => {
    if (password.length === 0) return { score: 0, label: '', color: '' };
    if (password.length < 6) return { score: 1, label: 'Muito fraca', color: 'bg-red-500' };
    if (password.length < 8) return { score: 2, label: 'Fraca', color: 'bg-orange-500' };
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strength = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (strength <= 1) return { score: 2, label: 'Fraca', color: 'bg-orange-500' };
    if (strength === 2) return { score: 3, label: 'Média', color: 'bg-yellow-500' };
    if (strength === 3) return { score: 4, label: 'Forte', color: 'bg-emerald-500' };
    return { score: 5, label: 'Muito forte', color: 'bg-emerald-600' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      toast.success('Senha definida com sucesso!');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/anunciante');
      }, 2000);

    } catch (err: any) {
      console.error('Password update error:', err);
      toast.error(err.message || 'Erro ao definir senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const strength = passwordStrength();

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#9C1E1E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Validando link...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/95 backdrop-blur-sm shadow-xl">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Senha Definida!</h1>
          <p className="text-muted-foreground mb-6">
            Sua senha foi configurada com sucesso. Redirecionando para a plataforma...
          </p>
          <div className="w-8 h-8 border-4 border-[#9C1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 bg-white/95 backdrop-blur-sm shadow-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <UnifiedLogo variant="light" size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Defina sua senha</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Crie uma senha segura para acessar sua conta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nova senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 pr-10 h-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            {/* Password strength */}
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= strength.score ? strength.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${strength.score >= 3 ? 'text-emerald-600' : 'text-orange-600'}`}>
                  Força: {strength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Confirmar senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`pl-10 pr-10 h-12 ${
                  confirmPassword && password !== confirmPassword 
                    ? 'border-red-500 focus-visible:ring-red-500' 
                    : ''
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500">As senhas não coincidem</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || password.length < 6 || password !== confirmPassword}
            className="w-full h-12 bg-[#9C1E1E] hover:bg-[#7D1818] text-white font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Definir Senha
              </>
            )}
          </Button>
        </form>

        {/* Tips */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs font-medium text-muted-foreground mb-2">💡 Dicas para uma senha forte:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Mínimo de 8 caracteres</li>
            <li>• Letras maiúsculas e minúsculas</li>
            <li>• Números e caracteres especiais</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default DefinirSenhaPage;
