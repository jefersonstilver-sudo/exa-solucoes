
import React from 'react';
import { Bell, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ModernAdminHeader = () => {
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log('🚪 ADMIN HEADER: Iniciando logout...');
    const { success } = await logout();
    
    if (success) {
      toast.success('Logout realizado com sucesso');
      navigate('/login', { replace: true });
    } else {
      toast.error('Erro ao fazer logout');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Painel Administrativo INDEXA
          </h1>
          <p className="text-sm text-gray-600">
            Sistema de Gestão Super Administrativo
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>

            <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {userProfile?.email}
                </p>
                <p className="text-xs text-indexa-purple font-medium">
                  Super Administrador
                </p>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ModernAdminHeader;
