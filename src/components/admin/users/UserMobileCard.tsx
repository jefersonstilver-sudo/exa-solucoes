import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, UserCheck, DollarSign, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import UserDetailsDialog from './UserDetailsDialog';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
}

interface UserMobileCardProps {
  user: User;
  onUserUpdated?: () => void;
}

const UserMobileCard: React.FC<UserMobileCardProps> = ({ user, onUserUpdated }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fullUser, setFullUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCardClick = async () => {
    setLoading(true);
    setDialogOpen(true);
    
    // Buscar dados completos do usuário
    try {
      const { data: authUser, error } = await supabase.auth.admin.getUserById(user.id);
      
      if (error) throw error;
      
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setFullUser({
        id: user.id,
        email: user.email,
        role: user.role,
        data_criacao: user.data_criacao,
        email_confirmed_at: authUser?.user?.email_confirmed_at,
        last_sign_in_at: authUser?.user?.last_sign_in_at,
        raw_user_meta_data: {
          ...authUser?.user?.user_metadata,
          ...userData
        }
      });
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <>
      <Card 
        className="overflow-hidden border shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
        onClick={handleCardClick}
      >
        <div className="p-3 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user.email}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {getRoleBadge(user.role)}
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
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

      {fullUser && (
        <UserDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          user={fullUser}
          onUserUpdated={() => {
            onUserUpdated?.();
            setDialogOpen(false);
          }}
        />
      )}
    </>
  );
};

export default UserMobileCard;
