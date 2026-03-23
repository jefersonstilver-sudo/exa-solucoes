import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, UserCheck, Eye, DollarSign, Phone, FileText, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
  nome?: string;
  telefone?: string;
  cpf?: string;
  documento_estrangeiro?: string;
  email_verified_at?: string;
}

interface EnhancedUserMobileCardProps {
  user: User;
  onViewDetails: (user: User) => void;
}

const EnhancedUserMobileCard: React.FC<EnhancedUserMobileCardProps> = ({
  user,
  onViewDetails,
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleCardClick = async () => {
    setLoading(true);
    try {
      // Buscar dados completos do usuário
      const { data: fullUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      // Passar dados completos para o dialog
      onViewDetails(fullUser || user);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      // Se falhar, passar dados básicos mesmo
      onViewDetails(user);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-[11px] h-6 px-2 font-semibold">
            <Crown className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[11px] h-6 px-2 font-semibold">
            <Shield className="h-3 w-3 mr-1" />
            Administrador
          </Badge>
        );
      case 'admin_marketing':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[11px] h-6 px-2 font-semibold">
            <UserCheck className="h-3 w-3 mr-1" />
            Marketing
          </Badge>
        );
      case 'admin_financeiro':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px] h-6 px-2 font-semibold">
            <DollarSign className="h-3 w-3 mr-1" />
            Financeiro
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[11px] h-6 px-2 font-semibold">
            <UserCheck className="h-3 w-3 mr-1" />
            Cliente
          </Badge>
        );
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrador';
      case 'admin':
        return 'Coordenação';
      case 'admin_marketing':
        return 'Administrador Marketing';
      case 'admin_financeiro':
        return 'Administrador Financeiro';
      default:
        return 'Cliente';
    }
  };

  const maskCPF = (cpf?: string) => {
    if (!cpf) return null;
    // Mascara: ***.***.XXX-XX
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.***.$3-$4');
  };

  return (
    <Card 
      className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-3.5 space-y-3">
        {/* Header com Email e Badge de Tipo */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Tipo de Conta
              </div>
              {getRoleBadge(user.role)}
            </div>
          </div>
          
          {/* Nome e Email */}
          <div className="space-y-0.5">
            {user.nome && (
              <p className="text-sm font-semibold text-foreground truncate">{user.nome}</p>
            )}
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        {/* Informações Detalhadas */}
        <div className="space-y-2 pt-2 border-t">
          {/* Status de Verificação */}
          <div className="flex items-center gap-1.5">
            {user.email_verified_at ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                <span className="text-xs text-green-700 font-medium">Email Verificado</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs text-amber-700 font-medium">Email Pendente</span>
              </>
            )}
          </div>

          {/* Data de Criação */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Criado em {format(new Date(user.data_criacao), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </span>
          </div>

          {/* Telefone */}
          {user.telefone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{user.telefone}</span>
            </div>
          )}

          {/* CPF/Documento */}
          {(user.cpf || user.documento_estrangeiro) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span>{maskCPF(user.cpf) || user.documento_estrangeiro}</span>
            </div>
          )}
        </div>

        {/* Indicador de Loading */}
        {loading && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              Carregando detalhes...
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EnhancedUserMobileCard;
