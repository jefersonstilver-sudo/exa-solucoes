import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit3, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderNameEditProps {
  orderId: string;
  currentName?: string;
  onNameUpdate?: (newName: string) => void;
}

export const OrderNameEdit: React.FC<OrderNameEditProps> = ({
  orderId,
  currentName,
  onNameUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentName || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(currentName || '');
  }, [currentName]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const trimmed = name.trim();

      console.log('Salvando nome do pedido:', { orderId, trimmed });

      const { data, error } = await supabase.rpc('set_pedido_nome', {
        p_pedido_id: orderId,
        p_nome: trimmed,
      });

      if (error) {
        console.error('Erro da função set_pedido_nome:', error);
        throw error;
      }

      console.log('Resposta da função:', data);

      const updatedName = Array.isArray(data) && data.length > 0 ? (data[0]?.nome_pedido ?? null) : trimmed || null;
      toast.success('Nome do pedido atualizado com sucesso!');
      onNameUpdate?.(updatedName || '');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Erro ao atualizar nome do pedido:', error);
      
      let errorMessage = 'Erro ao salvar nome do pedido';
      if (error?.message) {
        if (error.message.includes('NOT_AUTHENTICATED')) {
          errorMessage = 'Usuário não autenticado';
        } else if (error.message.includes('ACCESS_DENIED')) {
          errorMessage = 'Acesso negado a este pedido';
        } else {
          errorMessage = `Erro: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(currentName || '');
    setIsEditing(false);
  };

  const displayName = currentName?.trim() || `Pedido #${orderId.substring(0, 8)}`;

  return (
    <div className="bg-background border border-border rounded-xl shadow-sm">
      <div className="p-3 sm:p-4">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Região Central, Campanha Shopping..."
              maxLength={100}
              className="h-11 text-base rounded-lg"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={loading}
                className="h-10 px-4 bg-[#C7141A] hover:bg-[#B40D1A] text-white rounded-lg text-sm"
              >
                <Check className="h-4 w-4 mr-1.5" />
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="h-10 px-4 rounded-lg text-sm"
              >
                <X className="h-4 w-4 mr-1.5" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">
                {displayName}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                #{orderId.substring(0, 8)}
              </p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full hover:bg-muted transition-colors touch-manipulation"
              aria-label={currentName ? 'Editar nome' : 'Adicionar nome'}
            >
              <Edit3 className="h-[18px] w-[18px] text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
