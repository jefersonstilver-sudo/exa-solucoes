/**
 * Zona de Perigo - Ações críticas
 * Bloqueio, reset de senha, exclusão de conta
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  Key,
  Ban,
  Unlock,
  Trash2,
  Loader2,
  Crown
} from 'lucide-react';
import { ConsoleUser } from '@/types/userConsoleTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DangerZoneProps {
  user: ConsoleUser;
  canBlock: boolean;
  canDelete: boolean;
  isTargetCEO: boolean;
  onToggleBlock: () => Promise<void>;
  onUserUpdated: () => void;
  onClose: () => void;
}

export const DangerZone: React.FC<DangerZoneProps> = ({
  user,
  canBlock,
  canDelete,
  isTargetCEO,
  onToggleBlock,
  onUserUpdated,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  
  const isBlocked = user.is_blocked;

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
      toast.success('Email de reset enviado!', {
        description: `Link enviado para ${user.email}`
      });
    } catch (error: unknown) {
      toast.error('Erro ao enviar email', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async () => {
    setBlockLoading(true);
    try {
      await onToggleBlock();
    } finally {
      setBlockLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Confirmação tripla
    const confirmFirst = window.confirm(
      `⚠️ ATENÇÃO: Você está prestes a DELETAR permanentemente a conta de:\n\n` +
      `Email: ${user.email}\n` +
      `Nome: ${user.nome || 'N/A'}\n\n` +
      `Esta ação é IRREVERSÍVEL!\n\n` +
      `Deseja continuar?`
    );
    if (!confirmFirst) return;

    const confirmSecond = window.confirm(
      `🚨 CONFIRMAÇÃO FINAL:\n\n` +
      `Tem CERTEZA ABSOLUTA que deseja deletar esta conta?\n\n` +
      `Todos os dados serão PERMANENTEMENTE removidos.`
    );
    if (!confirmSecond) return;

    const finalConfirm = window.prompt(
      `Digite exatamente "DELETAR" (em maiúsculas) para confirmar:`
    );
    if (finalConfirm !== 'DELETAR') {
      toast.error('Deleção cancelada', {
        description: 'Texto de confirmação incorreto'
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/delete-user-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ userId: user.id })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao deletar conta');
      }

      toast.success('Conta deletada com sucesso', {
        description: `${user.email} foi permanentemente removido`
      });

      onClose();
      onUserUpdated();
    } catch (error: unknown) {
      toast.error('Erro ao deletar conta', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-red-500/50 bg-red-50/50 dark:bg-red-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          Zona de Perigo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reset de Senha */}
        <div className="space-y-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <Key className="h-4 w-4" />
            Resetar Senha
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Envia um email com link para redefinir a senha.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Key className="h-4 w-4 mr-2" />
            )}
            Enviar Email de Reset
          </Button>
        </div>

        {/* Bloquear/Desbloquear */}
        {canBlock && !isTargetCEO && (
          <div className={`space-y-2 p-3 rounded-lg border ${
            isBlocked 
              ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
              : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
          }`}>
            <p className={`text-xs font-semibold flex items-center gap-2 ${
              isBlocked 
                ? 'text-green-900 dark:text-green-100'
                : 'text-orange-900 dark:text-orange-100'
            }`}>
              {isBlocked ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
              {isBlocked ? 'Desbloquear Acesso' : 'Bloquear Acesso'}
            </p>
            <p className={`text-xs ${
              isBlocked 
                ? 'text-green-700 dark:text-green-300'
                : 'text-orange-700 dark:text-orange-300'
            }`}>
              {isBlocked
                ? 'Restaura o acesso do usuário ao sistema.'
                : 'Bloqueia completamente o acesso. O usuário não conseguirá fazer login.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleBlock}
              disabled={blockLoading}
              className={`w-full ${
                isBlocked
                  ? 'border-green-300 text-green-700 hover:bg-green-100'
                  : 'border-orange-300 text-orange-700 hover:bg-orange-100'
              }`}
            >
              {blockLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isBlocked ? (
                <Unlock className="h-4 w-4 mr-2" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              {isBlocked ? 'Desbloquear Usuário' : 'Bloquear Usuário'}
            </Button>
          </div>
        )}

        {/* CEO Protection */}
        {isTargetCEO && (
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              Esta conta é do CEO e não pode ser bloqueada ou deletada.
            </p>
          </div>
        )}

        {/* Deletar Conta */}
        {canDelete && !isTargetCEO && (
          <>
            <Separator className="bg-red-200 dark:bg-red-800" />
            
            <div className="space-y-2">
              <p className="text-xs font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Eliminar Conta Permanentemente
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                Remove TODOS os dados do usuário de forma irreversível.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Eliminar Conta
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
