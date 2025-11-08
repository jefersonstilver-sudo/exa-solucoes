import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LogIn, 
  LogOut, 
  UserCog, 
  Key, 
  Shield, 
  Clock,
  Activity,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  action_type: string;
  action_description: string;
  created_at: string;
  ip_address?: string;
  metadata?: any;
}

interface UserActivityTimelineProps {
  userId: string;
}

const getActivityIcon = (actionType: string) => {
  switch (actionType) {
    case 'login':
      return <LogIn className="h-4 w-4 text-green-500" />;
    case 'logout':
      return <LogOut className="h-4 w-4 text-gray-500" />;
    case 'permission_change':
      return <Shield className="h-4 w-4 text-blue-500" />;
    case 'role_change':
      return <UserCog className="h-4 w-4 text-purple-500" />;
    case 'password_reset':
      return <Key className="h-4 w-4 text-orange-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

const getActivityBadgeColor = (actionType: string) => {
  switch (actionType) {
    case 'login':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'logout':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'permission_change':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'role_change':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'password_reset':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatActionType = (actionType: string): string => {
  const map: Record<string, string> = {
    'login': 'Login',
    'logout': 'Logout',
    'permission_change': 'Mudança de Permissão',
    'role_change': 'Mudança de Função',
    'password_reset': 'Reset de Senha',
    'profile_update': 'Atualização de Perfil',
    'account_created': 'Conta Criada'
  };
  return map[actionType] || actionType;
};

export const UserActivityTimeline: React.FC<UserActivityTimelineProps> = ({ userId }) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Histórico de Atividades
            </CardTitle>
            <CardDescription className="mt-1">
              Últimas 20 ações realizadas pelo usuário
            </CardDescription>
          </div>
          <RefreshCw 
            className={`h-4 w-4 cursor-pointer text-muted-foreground hover:text-primary transition-colors ${loading ? 'animate-spin' : ''}`}
            onClick={fetchActivities}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando atividades...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma atividade registrada</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {activities.map((activity, idx) => (
                <div 
                  key={activity.id}
                  className="relative pl-8 pb-4 border-l-2 border-muted last:border-transparent"
                >
                  {/* Icon Badge */}
                  <div className="absolute left-[-13px] top-0 w-6 h-6 rounded-full bg-background border-2 border-muted flex items-center justify-center">
                    {getActivityIcon(activity.action_type)}
                  </div>

                  {/* Content */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getActivityBadgeColor(activity.action_type)}`}
                      >
                        {formatActionType(activity.action_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(activity.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-foreground">
                      {activity.action_description}
                    </p>

                    {activity.ip_address && (
                      <p className="text-xs text-muted-foreground">
                        IP: {activity.ip_address}
                      </p>
                    )}

                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <details className="text-xs text-muted-foreground mt-2">
                        <summary className="cursor-pointer hover:text-foreground">
                          Ver detalhes
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
