
import React from 'react';
import { LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUserSession } from '@/hooks/useUserSession';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import OnlineStoreButton from '@/components/layout/header/OnlineStoreButton';

const ModernAdvertiserHeader = () => {
  const { user } = useUserSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso');
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao realizar logout');
    }
  };

  return (
    <header className="bg-gradient-to-r from-[#9C1E1E] via-[#D72638] to-[#9C1E1E] border-b border-white/20 px-6 py-3 shadow-lg hidden lg:block">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-4">
          {/* Botão Loja Online */}
          <OnlineStoreButton />

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/20">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-white text-[#9C1E1E] font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-xl rounded-xl" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none text-gray-900">
                  {user?.email || 'Anunciante'}
                </p>
                <p className="text-xs leading-none text-gray-600">
                  Portal do Anunciante
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate('/anunciante/configuracoes')}
                className="text-gray-700 hover:bg-gray-100"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default ModernAdvertiserHeader;
