
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminAccessButtonProps {
  className?: string;
  variant?: 'default' | 'subtle' | 'icon';
}

const AdminAccessButton: React.FC<AdminAccessButtonProps> = ({ 
  className = '',
  variant = 'default'
}) => {
  const navigate = useNavigate();
  const { isLoggedIn, userProfile, hasRole } = useAuth();

  // PHOENIX: Verificação super admin baseada APENAS em JWT claims
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const isRegularAdmin = hasRole('admin') && !isSuperAdmin;
  
  console.log('🔧 PHOENIX AdminAccessButton - Estado baseado em JWT:', {
    userEmail: userProfile?.email,
    userRole: userProfile?.role,
    isSuperAdmin,
    isRegularAdmin,
    isLoggedIn
  });
  
  const handleAdminAccess = () => {
    if (!isLoggedIn) {
      toast.error('Você precisa estar logado para acessar a área administrativa');
      navigate('/login?redirect=/super_admin');
      return;
    }
    
    // REDIRECIONAMENTO CRÍTICO BASEADO EM JWT
    if (isSuperAdmin) {
      console.log('🚀 PHOENIX: SUPER ADMIN CONFIRMADO via JWT - Redirecionando para /super_admin');
      toast.success('Acessando Painel Super Administrativo');
      navigate('/super_admin');
    } else if (isRegularAdmin) {
      console.log('👤 PHOENIX: Admin regular via JWT - Redirecionando para /anunciante');
      toast.success('Acessando Área Administrativa');
      navigate('/anunciante');
    } else {
      toast.error('Você não tem permissão para acessar a área administrativa');
      return;
    }
  };

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleAdminAccess}
              className={`relative ${className}`}
            >
              {isSuperAdmin ? (
                <Crown className="h-5 w-5 text-amber-500" />
              ) : isRegularAdmin ? (
                <ShieldCheck className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-gray-400" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSuperAdmin ? 'Acessar Super Admin' : isRegularAdmin ? 'Acessar área administrativa' : 'Acesso restrito'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'subtle') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAdminAccess}
        className={`flex items-center gap-2 text-sm ${className}`}
        disabled={!isLoggedIn || (!isSuperAdmin && !isRegularAdmin)}
      >
        {isSuperAdmin ? (
          <Crown className="h-4 w-4 text-amber-500" />
        ) : isRegularAdmin ? (
          <ShieldCheck className="h-4 w-4 text-green-500" />
        ) : (
          <Lock className="h-4 w-4 text-gray-400" />
        )}
        <span>{isSuperAdmin ? 'Super Admin' : 'Área Admin'}</span>
        <ArrowRight className="h-3 w-3" />
      </Button>
    );
  }

  return (
    <Button
      variant={isSuperAdmin ? "default" : "outline"}
      onClick={handleAdminAccess}
      className={`flex items-center gap-2 ${isSuperAdmin ? 'bg-amber-500 hover:bg-amber-600 text-slate-900' : ''} ${className}`}
      disabled={!isLoggedIn || (!isSuperAdmin && !isRegularAdmin)}
    >
      {isSuperAdmin ? (
        <Crown className="h-5 w-5" />
      ) : isRegularAdmin ? (
        <ShieldCheck className="h-5 w-5" />
      ) : (
        <Lock className="h-5 w-5" />
      )}
      <span>{isSuperAdmin ? 'Super Administrativo' : 'Área Administrativa'}</span>
      {(isSuperAdmin || isRegularAdmin) && <ArrowRight className="h-4 w-4 ml-1" />}
    </Button>
  );
};

export default AdminAccessButton;
