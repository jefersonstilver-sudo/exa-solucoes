import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Edit3, Save, X } from 'lucide-react';
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

      // Usar função segura no banco para atualizar apenas o nome do pedido
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
      
      // Mostrar erro mais específico
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

  const displayName = name.trim() || `Pedido #${orderId.substring(0, 8)}`;

  return (
    <Card className="border-l-4 border-l-indexa-purple">
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Região Central, Campanha Shopping, etc."
              maxLength={100}
              className="font-medium"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={loading}
                className="bg-indexa-purple hover:bg-indexa-purple/90"
              >
                <Save className="h-4 w-4 mr-1" />
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {displayName}
              </h3>
              <p className="text-sm text-gray-500">
                {currentName ? 'Nome personalizado' : 'Clique para personalizar o nome deste pedido'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1"
            >
              <Edit3 className="h-4 w-4" />
              {currentName ? 'Editar' : 'Adicionar Nome'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};