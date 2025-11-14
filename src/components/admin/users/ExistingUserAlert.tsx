import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Crown, Shield, UserCheck, DollarSign, User, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExistingUserAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  role?: string;
  nome?: string;
  onDeleted?: () => void;
}

const getRoleInfo = (role: string) => {
  const roleMap: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    super_admin: {
      label: 'Super Administrador',
      icon: Crown,
      color: 'text-yellow-700',
      bg: 'bg-yellow-100 border-yellow-300',
    },
    admin: {
      label: 'Administrador Geral',
      icon: Shield,
      color: 'text-blue-700',
      bg: 'bg-blue-100 border-blue-300',
    },
    admin_marketing: {
      label: 'Administrador Marketing',
      icon: UserCheck,
      color: 'text-purple-700',
      bg: 'bg-purple-100 border-purple-300',
    },
    admin_financeiro: {
      label: 'Administrador Financeiro',
      icon: DollarSign,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100 border-emerald-300',
    },
    client: {
      label: 'Cliente',
      icon: User,
      color: 'text-gray-700',
      bg: 'bg-gray-100 border-gray-300',
    },
  };

  return roleMap[role] || {
    label: role || 'Desconhecido',
    icon: User,
    color: 'text-gray-700',
    bg: 'bg-gray-100 border-gray-300',
  };
};

const ExistingUserAlert: React.FC<ExistingUserAlertProps> = ({
  open,
  onOpenChange,
  email,
  role,
  nome,
  onDeleted,
}) => {
  const roleInfo = getRoleInfo(role || '');
  const Icon = roleInfo.icon;
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      console.log('🗑️ Deletando conta:', email);

      // Buscar ID do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      // Se usuário não existe na tabela users, é um email órfão no auth.users
      if (!userData) {
        console.log('🧹 Email órfão detectado, limpando do auth.users...');
        
        const { data: cleanupResult, error: cleanupError } = await supabase.functions.invoke(
          'cleanup-orphaned-auth-user',
          { body: { email } }
        );

        if (cleanupError) throw cleanupError;
        
        if (cleanupResult?.success) {
          toast.success('✅ Email órfão removido! Agora você pode criar a conta.', { duration: 5000 });
        } else {
          toast.info('Email não encontrado no sistema de autenticação.');
        }
        
        onOpenChange(false);
        if (onDeleted) onDeleted();
        return;
      }

      // Usuário existe na tabela users, usar deleção normal
      const { error: deleteError } = await supabase.functions.invoke('delete-user-account', {
        body: { userId: userData.id }
      });

      if (deleteError) throw deleteError;

      toast.success('✅ Conta deletada! Agora você pode criar novamente.', { duration: 5000 });
      onOpenChange(false);
      
      if (onDeleted) {
        onDeleted();
      }
    } catch (error: any) {
      console.error('❌ Erro ao deletar:', error);
      toast.error(`Erro: ${error.message || 'Falha ao deletar conta'}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md bg-white">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-xl text-gray-900 mb-0">
              Email Já Cadastrado
            </AlertDialogTitle>
          </div>
          
          <AlertDialogDescription className="text-gray-600 text-left">
            Este email já possui uma conta cadastrada no sistema com as seguintes informações:
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Informações da conta existente */}
        <div className="space-y-3 my-4">
          {/* Email */}
          <div className={`p-4 rounded-lg border-2 ${roleInfo.bg}`}>
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Email
                  </p>
                  <p className="text-sm font-mono font-semibold text-gray-900 break-all">
                    {email}
                  </p>
                </div>
              </div>

              {/* Nome */}
              {nome && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Nome
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{nome}</p>
                </div>
              )}

              {/* Tipo de Conta */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Tipo de Conta
                </p>
                <Badge variant="secondary" className={`${roleInfo.bg} ${roleInfo.color} border`}>
                  <Icon className="w-3.5 h-3.5 mr-1.5" />
                  {roleInfo.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Mensagem de orientação */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>💡 O que fazer:</strong>
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
              <li>Use um email diferente para criar a nova conta</li>
              <li>Ou edite a conta existente para alterar o tipo</li>
              {role === 'client' && (
                <li className="text-red-700 font-semibold">
                  Ou delete esta conta e recrie com o tipo correto
                </li>
              )}
            </ul>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {role === 'client' && (
            <Button
              onClick={handleDelete}
              disabled={deleting}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 w-full sm:w-auto"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar e Recriar
                </>
              )}
            </Button>
          )}
          <Button
            onClick={() => onOpenChange(false)}
            disabled={deleting}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            Entendi
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ExistingUserAlert;
