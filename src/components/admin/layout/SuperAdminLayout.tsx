
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import { toast } from 'sonner';
import { Shield, Lock, Crown, AlertTriangle } from 'lucide-react';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const { userProfile, isLoading } = useAuth();
  const navigate = useNavigate();
  
  console.log('🏗️ SuperAdminLayout - Renderizando layout:', {
    userEmail: userProfile?.email,
    userRole: userProfile?.role,
    isLoading
  });

  // Verificação rigorosa: APENAS jefersonstilver@gmail.com
  React.useEffect(() => {
    if (!isLoading && userProfile) {
      console.log('🔐 SuperAdminLayout - Verificação rigorosa FINAL:', {
        email: userProfile.email,
        role: userProfile.role,
        isExpectedSuperAdmin: userProfile.email === 'jefersonstilver@gmail.com',
        hasCorrectRole: userProfile.role === 'super_admin'
      });
      
      if (userProfile.email !== 'jefersonstilver@gmail.com' || userProfile.role !== 'super_admin') {
        console.log('🚨 SuperAdminLayout - ACESSO NEGADO FINAL');
        toast.error('Acesso negado. Área restrita ao Super Administrador.', {
          duration: 5000
        });
        navigate('/login');
      } else {
        console.log('✅ SuperAdminLayout - ACESSO AUTORIZADO FINAL - Renderizando layout completo');
      }
    }
  }, [userProfile, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
            <Crown className="absolute inset-0 m-auto h-6 w-6 text-amber-400" />
          </div>
          <p className="text-slate-300 font-medium">Inicializando painel administrativo...</p>
        </div>
      </div>
    );
  }

  if (userProfile?.email !== 'jefersonstilver@gmail.com' || userProfile?.role !== 'super_admin') {
    console.log('🚫 SuperAdminLayout - Não autorizado, retornando tela de erro');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 to-slate-900">
        <div className="flex flex-col items-center space-y-4 text-center">
          <AlertTriangle className="h-16 w-16 text-red-400" />
          <h1 className="text-2xl font-bold text-red-400">Erro de Acesso</h1>
          <p className="text-slate-300">Layout administrativo não pode ser carregado</p>
        </div>
      </div>
    );
  }

  console.log('🎨 SuperAdminLayout - Renderizando layout COMPLETO do super admin');
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex w-full">
      {/* Indicador de segurança - Barra superior dourada */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 z-50 opacity-90 shadow-lg"></div>
      
      {/* Sidebar administrativo completo */}
      <div className="relative">
        <AdminSidebar />
        {/* Efeito de brilho lateral */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-500/30 to-transparent"></div>
      </div>
      
      <div className="flex-1 flex flex-col">
        {/* Header administrativo completo */}
        <div className="relative">
          <AdminHeader />
          {/* Badge de segurança */}
          <div className="absolute top-2 right-4 flex items-center space-x-1 text-xs text-amber-400 bg-slate-800/70 px-3 py-1 rounded-full backdrop-blur-sm border border-amber-500/20">
            <Crown className="h-3 w-3" />
            <span className="font-bold">SUPER ADMIN</span>
          </div>
        </div>
        
        {/* Conteúdo principal do painel administrativo */}
        <main className="flex-1 p-6 relative overflow-auto">
          {/* Padrão de fundo sutil */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(255,255,255)_1px,_transparent_0)] bg-[length:20px_20px]"></div>
          </div>
          
          {/* Container do conteúdo com efeito de vidro */}
          <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-2xl min-h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-transparent rounded-xl"></div>
            <div className="relative">
              {children}
            </div>
          </div>
        </main>
        
        {/* Footer administrativo */}
        <footer className="bg-slate-800/50 border-t border-slate-700/50 p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3 text-slate-400">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Sistema Seguro</span>
              <span className="text-slate-600">•</span>
              <span>INDEXA Master Control</span>
            </div>
            <div className="text-slate-500">
              © 2024 INDEXA Admin Panel v2.0 - Super Admin Edition
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
