
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import { Shield, Crown, Zap } from 'lucide-react';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const { userProfile } = useAuth();
  
  console.log('🏗️ SuperAdminLayout - RENDERIZANDO:', {
    userEmail: userProfile?.email,
    userRole: userProfile?.role
  });

  return (
    <div className="min-h-screen bg-white flex w-full">
      {/* Barra superior premium com gradiente */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-indexa-mint via-indexa-mint-light to-indexa-mint z-50 shadow-xl"></div>
      
      {/* Sidebar INDEXA premium */}
      <div className="relative">
        <AdminSidebar />
        {/* Divider com glow effect */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-indexa-mint/50 to-transparent shadow-lg shadow-indexa-mint/20"></div>
      </div>
      
      <div className="flex-1 flex flex-col">
        {/* Header executivo INDEXA */}
        <div className="relative">
          <AdminHeader />
          {/* Badge de segurança premium */}
          <div className="absolute top-4 right-6 flex items-center space-x-2 text-xs text-indexa-mint bg-indexa-purple-dark/80 px-4 py-2 rounded-full backdrop-blur-sm border border-indexa-mint/30 shadow-lg shadow-indexa-mint/20">
            <Crown className="h-4 w-4 animate-pulse" />
            <span className="font-bold tracking-wide">SUPER ADMIN</span>
            <Zap className="h-3 w-3" />
          </div>
        </div>
        
        {/* Conteúdo principal com fundo branco */}
        <main className="flex-1 p-8 relative overflow-auto bg-white">
          {/* Background pattern sutil */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,_rgba(88,227,171,0.15)_1px,_transparent_0)] bg-[length:24px_24px]"></div>
          </div>
          
          {/* Container premium com glassmorphism */}
          <div className="relative bg-gray-50/50 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-2xl shadow-gray-500/10 min-h-full">
            {/* Glow interno */}
            <div className="absolute inset-0 bg-gradient-to-br from-indexa-mint/5 via-transparent to-indexa-purple/5 rounded-2xl"></div>
            
            {/* Conteúdo */}
            <div className="relative p-8">
              {children}
            </div>
          </div>
        </main>
        
        {/* Footer premium INDEXA */}
        <footer className="bg-gray-100 border-t border-gray-200 p-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-indexa-purple">
              <Shield className="h-5 w-5 text-indexa-purple" />
              <span className="font-medium">Sistema Ultra Seguro</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">INDEXA Master Control Panel</span>
            </div>
            <div className="text-gray-500 flex items-center space-x-2">
              <span>© 2024 INDEXA</span>
              <span className="text-indexa-mint">•</span>
              <span className="text-indexa-mint font-medium">Super Admin Edition v3.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
