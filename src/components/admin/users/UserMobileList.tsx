import React from 'react';
import UserMobileCard from './UserMobileCard';
import { Users } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
}

interface UserMobileListProps {
  users: User[];
  isLoading: boolean;
}

const UserMobileList: React.FC<UserMobileListProps> = ({ users, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-card rounded-lg border shadow-sm overflow-hidden animate-pulse"
          >
            <div className="p-3 space-y-2.5">
              <div className="h-6 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Nenhum usuário encontrado
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Crie o primeiro usuário ou aguarde o cadastro de novos clientes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-20">
      {users.map((user) => (
        <UserMobileCard key={user.id} user={user} />
      ))}
    </div>
  );
};

export default UserMobileList;
