
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdvertiserAccessButtonProps {
  className?: string;
  variant?: 'default' | 'subtle' | 'icon';
}

const AdvertiserAccessButton: React.FC<AdvertiserAccessButtonProps> = ({ 
  className = '',
  variant = 'default'
}) => {
  const navigate = useNavigate();
  const { isLoggedIn, user, hasRole } = useUserSession();

  // Check if user has client role or higher
  const isAdvertiser = isLoggedIn && hasRole('client');
  
  const handleAdvertiserAccess = () => {
    if (!isLoggedIn) {
      toast.error('Você precisa estar logado para acessar a área do anunciante');
      navigate('/login?redirect=/anunciante');
      return;
    }
    
    navigate('/anunciante');
  };

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleAdvertiserAccess}
              className={`relative ${className}`}
            >
              {isAdvertiser ? (
                <UserCheck className="h-5 w-5 text-indexa-mint" />
              ) : (
                <Users className="h-5 w-5 text-gray-400" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isAdvertiser ? 'Acessar área do anunciante' : 'Faça login para acessar a área do anunciante'}
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
        onClick={handleAdvertiserAccess}
        className={`flex items-center gap-2 text-sm ${className}`}
      >
        {isAdvertiser ? (
          <UserCheck className="h-4 w-4 text-indexa-mint" />
        ) : (
          <Users className="h-4 w-4 text-gray-400" />
        )}
        <span>Área Anunciante</span>
        <ArrowRight className="h-3 w-3" />
      </Button>
    );
  }

  return (
    <Button
      variant={isAdvertiser ? "default" : "outline"}
      onClick={handleAdvertiserAccess}
      className={`flex items-center gap-2 ${className}`}
    >
      {isAdvertiser ? (
        <UserCheck className="h-5 w-5" />
      ) : (
        <Users className="h-5 w-5" />
      )}
      <span>Área do Anunciante</span>
      <ArrowRight className="h-4 w-4 ml-1" />
    </Button>
  );
};

export default AdvertiserAccessButton;
