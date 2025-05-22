
import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { useParams } from 'react-router-dom';

const UserForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  
  return (
    <AdminLayout title={isEditing ? "Editar Usuário" : "Novo Usuário"} requireSuperAdmin={true}>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">
          {isEditing ? "Editar Usuário" : "Adicionar Novo Usuário"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing 
            ? "Edite as informações e permissões do usuário" 
            : "Preencha as informações para adicionar um novo usuário ao sistema"}
        </p>
        
        <div className="p-8 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center">
          <p className="text-muted-foreground">
            Formulário em desenvolvimento. Em breve você poderá {isEditing ? "editar" : "adicionar"} usuários aqui.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserForm;
