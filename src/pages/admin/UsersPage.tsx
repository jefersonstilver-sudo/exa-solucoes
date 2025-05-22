
import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';

const UsersPage = () => {
  return (
    <AdminLayout title="Usuários" requireSuperAdmin={true}>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground">
          Esta página permite gerenciar usuários e suas permissões. 
          Apenas super administradores podem acessar esta página.
        </p>
        
        <div className="p-8 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center">
          <p className="text-muted-foreground">
            Funcionalidade em desenvolvimento. Em breve você poderá gerenciar todos os usuários do sistema aqui.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UsersPage;
