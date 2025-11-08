import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Shield, UserCheck, Activity, Clock, Eye, X, DollarSign, Phone, FileText, Mail, CheckCircle2, XCircle, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  avatar_url?: string;
  tipo_documento?: string;
  documento_frente_url?: string;
  documento_verso_url?: string;
}

interface UserDetailsCardProps {
  user: User;
  onClose: () => void;
}

interface ActivitySummary {
  total_actions: number;
  last_action_at: string | null;
  recent_actions: Array<{
    action_type: string;
    action_description: string;
    created_at: string;
  }>;
}

const UserDetailsCard: React.FC<UserDetailsCardProps> = ({ user, onClose }) => {
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, [user.id]);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_activity_summary', {
        p_user_id: user.id,
      });

      if (error) throw error;

      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      setActivity(parsedData);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'super_admin':
        return {
          icon: <Crown className="h-4 w-4" />,
          label: 'Super Administrador',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          description: 'Acesso total ao sistema'
        };
      case 'admin':
        return {
          icon: <Shield className="h-4 w-4" />,
          label: 'Administrador Geral',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          description: 'Gestão completa de prédios, painéis e pedidos'
        };
      case 'admin_marketing':
        return {
          icon: <UserCheck className="h-4 w-4" />,
          label: 'Administrador Marketing',
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          description: 'Gestão de leads, campanhas e conteúdo'
        };
      case 'admin_financeiro':
        return {
          icon: <DollarSign className="h-4 w-4" />,
          label: 'Administrador Financeiro',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          description: 'Acesso a pedidos, benefícios e relatórios financeiros'
        };
      default:
        return {
          icon: <UserCheck className="h-4 w-4" />,
          label: 'Cliente',
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          description: 'Acesso às funcionalidades de cliente'
        };
    }
  };

  const maskCPF = (cpf?: string) => {
    if (!cpf) return null;
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.***.$3-$4');
  };

  const roleInfo = getRoleInfo(user.role);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Usuário</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de Conta - DESTAQUE PRINCIPAL */}
          <Card className="p-5 bg-gradient-to-r from-slate-50 to-blue-50 border-2">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  {roleInfo.icon}
                  <h3 className="text-lg font-bold text-slate-900">Tipo de Conta</h3>
                </div>
                <Badge className={`${roleInfo.color} text-base py-1 px-3`}>
                  {roleInfo.label}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">{roleInfo.description}</p>
              </div>
            </div>
          </Card>

          {/* Informações Pessoais */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações Pessoais
            </h3>
            <div className="space-y-3 text-sm">
              {user.nome && (
                <div className="flex items-start justify-between gap-4 py-2 border-b">
                  <span className="text-muted-foreground font-medium">Nome Completo:</span>
                  <span className="font-semibold text-right">{user.nome}</span>
                </div>
              )}
              <div className="flex items-start justify-between gap-4 py-2 border-b">
                <span className="text-muted-foreground font-medium flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  Email:
                </span>
                <span className="font-medium text-right">{user.email}</span>
              </div>
              {user.telefone && (
                <div className="flex items-start justify-between gap-4 py-2 border-b">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    Telefone:
                  </span>
                  <span className="font-medium">{user.telefone}</span>
                </div>
              )}
              {(user.cpf || user.documento_estrangeiro) && (
                <div className="flex items-start justify-between gap-4 py-2 border-b">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    Documento:
                  </span>
                  <span className="font-mono text-xs font-medium">
                    {maskCPF(user.cpf) || user.documento_estrangeiro}
                  </span>
                </div>
              )}
              {user.tipo_documento && (
                <div className="flex items-start justify-between gap-4 py-2 border-b">
                  <span className="text-muted-foreground font-medium">Tipo de Documento:</span>
                  <span className="font-medium uppercase">{user.tipo_documento}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Status e Verificações */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Status e Verificações
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Status do Email:</span>
                {user.email_verified_at ? (
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                    <XCircle className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                )}
              </div>
              {user.email_verified_at && (
                <div className="flex items-center justify-between py-2 border-b text-sm">
                  <span className="text-muted-foreground">Verificado em:</span>
                  <span className="font-medium">
                    {format(new Date(user.email_verified_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Cadastro:
                </span>
                <span className="font-medium">
                  {format(new Date(user.data_criacao), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          </Card>

          {/* Atividades Recentes */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Atividades Recentes (últimos 7 dias)
            </h3>

            {loading ? (
              <div className="text-sm text-muted-foreground">Carregando atividades...</div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total de ações:</span>
                    <p className="text-lg font-bold">{activity?.total_actions || 0}</p>
                  </div>
                  {activity?.last_action_at && (
                    <div>
                      <span className="text-muted-foreground">Última atividade:</span>
                      <p className="text-xs font-medium">
                        {format(new Date(activity.last_action_at), "dd/MM 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {activity?.recent_actions && activity.recent_actions.length > 0 ? (
                  <div className="space-y-2 border-t pt-3">
                    {activity.recent_actions.slice(0, 5).map((action, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{action.action_type}</p>
                          {action.action_description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {action.action_description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(action.created_at), "dd/MM 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma atividade registrada nos últimos 7 dias
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsCard;
