
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
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
  const { isLoggedIn, user, session } = useUserSession();

  // Get user role from session metadata if available, or from user object
  const userRole = session?.user?.user_metadata?.role || 
                  (user && 'role' in user ? (user as any).role : null);
  
  const hasAdminAccess = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';
  
  const handleAdminAccess = () => {
    if (!isLoggedIn) {
      toast.error('Você precisa estar logado para acessar a área administrativa');
      navigate('/login?redirect=/admin');
      return;
    }
    
    if (!hasAdminAccess) {
      toast.error('Você não tem permissão para acessar a área administrativa');
      return;
    }
    
    navigate('/admin');
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
                <ShieldCheck className="h-5 w-5 text-amber-500" />
              ) : (
                <LockKeyhole className={`h-5 w-5 ${hasAdminAccess ? 'text-green-500' : 'text-gray-400'}`} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasAdminAccess ? 'Acessar área administrativa' : 'Acesso restrito'}
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
        disabled={!hasAdminAccess}
      >
        {isSuperAdmin ? (
          <ShieldCheck className="h-4 w-4 text-amber-500" />
        ) : (
          <LockKeyhole className={`h-4 w-4 ${hasAdminAccess ? 'text-green-500' : 'text-gray-400'}`} />
        )}
        <span>Área Admin</span>
        <ArrowRight className="h-3 w-3" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleAdminAccess}
      className={`flex items-center gap-2 ${className}`}
      disabled={!hasAdminAccess}
    >
      {isSuperAdmin ? (
        <ShieldCheck className="h-5 w-5 text-amber-500" />
      ) : (
        <LockKeyhole className={`h-5 w-5 ${hasAdminAccess ? 'text-green-500' : 'text-gray-400'}`} />
      )}
      <span>Área Administrativa</span>
      {hasAdminAccess && <ArrowRight className="h-4 w-4 ml-1" />}
    </Button>
  );
};

export default AdminAccessButton;
