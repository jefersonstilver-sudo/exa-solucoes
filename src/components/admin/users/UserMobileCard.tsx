import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, UserCheck, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
}

interface UserMobileCardProps {
  user: User;
}

const UserMobileCard: React.FC<UserMobileCardProps> = ({ user }) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-[10px] h-5 px-1.5">
            <Crown className="h-2.5 w-2.5 mr-0.5" />
            Super Admin
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px] h-5 px-1.5">
            <Shield className="h-2.5 w-2.5 mr-0.5" />
            Admin
          </Badge>
        );
      case 'admin_marketing':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[10px] h-5 px-1.5">
            <UserCheck className="h-2.5 w-2.5 mr-0.5" />
            Marketing
          </Badge>
        );
      case 'admin_financeiro':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] h-5 px-1.5">
            <DollarSign className="h-2.5 w-2.5 mr-0.5" />
            Financeiro
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            <UserCheck className="h-2.5 w-2.5 mr-0.5" />
            Cliente
          </Badge>
        );
    }
  };

  return (
    <Card className="overflow-hidden border shadow-sm">
      <div className="p-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {user.email}
            </p>
          </div>
          {getRoleBadge(user.role)}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <span>
            {format(new Date(user.data_criacao), "dd MMM yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default UserMobileCard;
