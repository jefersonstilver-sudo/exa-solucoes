
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const { userProfile } = useAuth();
  
  if (import.meta.env.DEV) {
    console.log('🏗️ SuperAdminLayout - RENDERIZANDO:', {
      userEmail: userProfile?.email,
      userRole: userProfile?.role
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Sidebar fixa corporativa */}
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header corporativo com cor escura diferente */}
        <AdminHeader />
        
        {/* Conteúdo principal com fundo branco */}
        <main className="flex-1 p-6 bg-white overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Footer corporativo */}
        <footer className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>© 2025 EXA Soluções Digitais LTDA</span>
              <span>•</span>
              <span>Super Admin Panel</span>
            </div>
            <div className="text-gray-500">
              Sistema Administrativo v3.0
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
