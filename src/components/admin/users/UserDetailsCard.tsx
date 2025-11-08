import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Shield, UserCheck, Activity, Clock, Eye, X } from 'lucide-react';
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
        };
      case 'admin':
        return {
          icon: <Shield className="h-4 w-4" />,
          label: 'Administrador',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case 'admin_marketing':
        return {
          icon: <UserCheck className="h-4 w-4" />,
          label: 'Admin Marketing',
          color: 'bg-purple-100 text-purple-800 border-purple-300',
        };
      default:
        return {
          icon: <UserCheck className="h-4 w-4" />,
          label: 'Cliente',
          color: 'bg-gray-100 text-gray-800 border-gray-300',
        };
    }
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
          {/* Informações Básicas */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Informações Básicas
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              {user.nome && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{user.nome}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Role:</span>
                <Badge className={roleInfo.color}>
                  {roleInfo.icon}
                  <span className="ml-1">{roleInfo.label}</span>
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em:</span>
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
