
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PendingUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
}

export default function PendingEmailConfirmations() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingEmails, setResendingEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar usuários sem confirmação de email
      const { data, error } = await supabase
        .from('users')
        .select('id, email, data_criacao')
        .order('data_criacao', { ascending: false });
      
      if (error) throw error;
      
      // Verificar status de confirmação via auth.users
      const userIds = data?.map(u => u.id) || [];
      
      if (userIds.length > 0) {
        // Para cada usuário, verificar se o email foi confirmado
        const pendingList: PendingUser[] = [];
        
        // Call edge function to get extended user data
        const { data: extendedData, error: extendedError } = await supabase.functions.invoke('get-users-extended', {
          body: { userIds: data.map(u => u.id) }
        });
        
        if (extendedError) {
          console.error('Error fetching extended user data:', extendedError);
          throw extendedError;
        }
        
        const userDataMap = new Map(extendedData.users.map((u: any) => [u.id, u]));
        
        for (const user of data || []) {
          const extendedUser = userDataMap.get(user.id) as any;
          
          if (extendedUser && !extendedUser.email_confirmed_at) {
            pendingList.push({
              id: user.id,
              email: user.email,
              created_at: user.data_criacao,
              email_confirmed_at: null
            });
          }
        }
        
        setPendingUsers(pendingList);
      }
      
    } catch (error: any) {
      console.error('Erro ao carregar usuários pendentes:', error);
      toast.error('Erro ao carregar usuários pendentes');
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationEmail = async (email: string, userId: string) => {
    try {
      setResendingEmails(prev => new Set([...prev, userId]));
      
      if (import.meta.env.DEV) {
        console.log('🔄 Reenviando email de confirmação para:', email);
      }
      
      // Chamar a edge function unificada de reenvio
      const { data, error } = await supabase.functions.invoke('unified-email-service', {
        body: { action: 'resend', email }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Email de confirmação reenviado para ${email}`);
        
        // Recarregar lista após alguns segundos
        setTimeout(() => {
          loadPendingUsers();
        }, 2000);
      } else {
        throw new Error(data?.message || 'Erro desconhecido');
      }
      
    } catch (error: any) {
      console.error('Erro ao reenviar email:', error);
      toast.error(`Erro ao reenviar email: ${error.message}`);
    } finally {
      setResendingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Confirmações de Email Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Confirmações de Email Pendentes
          {pendingUsers.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingUsers.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Usuários que ainda não confirmaram seus emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">Todos os usuários confirmaram seus emails! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-gray-500">
                      Cadastrado em: {formatDate(user.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resendConfirmationEmail(user.email, user.id)}
                  disabled={resendingEmails.has(user.id)}
                  className="flex items-center gap-2"
                >
                  {resendingEmails.has(user.id) ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {resendingEmails.has(user.id) ? 'Enviando...' : 'Reenviar'}
                </Button>
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 Próximos Passos:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Verifique se o domínio indexamidia.com está verificado no Resend</li>
                <li>• Confirme se a RESEND_API_KEY está configurada corretamente</li>
                <li>• Teste fazendo um novo cadastro para verificar se funciona</li>
              </ul>
            </div>
          </div>
        )}
        
        <div className="mt-4 flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPendingUsers}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Lista
          </Button>
          
          {pendingUsers.length > 0 && (
            <p className="text-sm text-gray-500">
              {pendingUsers.length} usuário(s) aguardando confirmação
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
