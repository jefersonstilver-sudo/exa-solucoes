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
  const type = actionType.toLowerCase();
  if (type.includes('login') || type.includes('signin')) return <LogIn className="h-4 w-4 text-green-500" />;
  if (type.includes('logout') || type.includes('signout')) return <LogOut className="h-4 w-4 text-gray-500" />;
  if (type.includes('permission')) return <Shield className="h-4 w-4 text-blue-500" />;
  if (type.includes('role') || type.includes('admin')) return <UserCog className="h-4 w-4 text-purple-500" />;
  if (type.includes('password') || type.includes('reset')) return <Key className="h-4 w-4 text-orange-500" />;
  return <Activity className="h-4 w-4 text-gray-500" />;
};

const getActivityBadgeColor = (actionType: string) => {
  const type = actionType.toLowerCase();
  if (type.includes('login') || type.includes('signin')) return 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300';
  if (type.includes('logout') || type.includes('signout')) return 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-900 dark:text-gray-300';
  if (type.includes('permission')) return 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300';
  if (type.includes('role') || type.includes('admin')) return 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300';
  if (type.includes('password') || type.includes('reset')) return 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300';
  if (type.includes('delete') || type.includes('remove')) return 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300';
  if (type.includes('create') || type.includes('add')) return 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
  if (type.includes('update') || type.includes('edit')) return 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
  return 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-900 dark:text-gray-300';
};

const formatActionType = (actionType: string): string => {
  const map: Record<string, string> = {
    'login': '🟢 Login',
    'logout': '⚪ Logout',
    'permission_change': '🔵 Mudança de Permissão',
    'role_change': '🟣 Mudança de Função',
    'password_reset': '🟠 Reset de Senha',
    'profile_update': '🟡 Atualização de Perfil',
    'account_created': '🟢 Conta Criada',
    'ADMIN_ACCOUNT_DELETED': '🔴 Conta Deletada',
    'view': '👁️ Visualização',
    'create': '➕ Criação',
    'update': '✏️ Atualização',
    'delete': '🗑️ Exclusão',
    'export': '📤 Exportação'
  };
  
  // Se encontrar exato, retorna
  if (map[actionType]) return map[actionType];
  
  // Senão, tenta por palavras-chave
  const type = actionType.toLowerCase();
  if (type.includes('login')) return '🟢 Login';
  if (type.includes('logout')) return '⚪ Logout';
  if (type.includes('permission')) return '🔵 Permissão';
  if (type.includes('role') || type.includes('admin')) return '🟣 Função/Cargo';
  if (type.includes('password')) return '🟠 Senha';
  if (type.includes('delete') || type.includes('remove')) return '🔴 Exclusão';
  if (type.includes('create') || type.includes('add')) return '➕ Criação';
  if (type.includes('update') || type.includes('edit')) return '✏️ Atualização';
  
  // Formata o nome para título
  return actionType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-medium ${getActivityBadgeColor(activity.action_type)}`}
                      >
                        {formatActionType(activity.action_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatDate(activity.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-foreground font-medium leading-relaxed">
                      {activity.action_description}
                    </p>

                    {/* Info adicional em grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {activity.ip_address && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="font-semibold">IP:</span>
                          <span className="font-mono">{activity.ip_address}</span>
                        </div>
                      )}
                      {activity.metadata?.user_agent && (
                        <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                          <span className="font-semibold">Navegador:</span>
                          <span className="truncate text-xs">{activity.metadata.user_agent}</span>
                        </div>
                      )}
                      {activity.metadata?.timestamp && (
                        <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                          <span className="font-semibold">Timestamp:</span>
                          <span className="font-mono text-xs">
                            {new Date(activity.metadata.timestamp).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metadados importantes */}
                    {activity.metadata && (
                      <div className="space-y-1">
                        {activity.metadata.performed_by && (
                          <p className="text-xs text-muted-foreground">
                            👤 <span className="font-semibold">Executado por:</span> {activity.metadata.performed_by}
                          </p>
                        )}
                        {activity.metadata.deleted_account && (
                          <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-800 text-xs space-y-1">
                            <p className="font-semibold text-red-700 dark:text-red-300">🗑️ Conta Deletada:</p>
                            <p className="text-red-600 dark:text-red-400">
                              Email: {activity.metadata.deleted_account.email}
                            </p>
                            <p className="text-red-600 dark:text-red-400">
                              Role: {activity.metadata.deleted_account.role}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer hover:text-foreground font-medium flex items-center gap-1">
                          <span>📋</span> Ver metadados completos
                        </summary>
                        <pre className="mt-2 p-3 bg-muted/50 rounded-md text-xs overflow-x-auto border border-border font-mono">
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
