import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Director {
  id: string;
  nome: string;
  telefone: string;
  departamento: string | null;
  nivel_acesso: 'basico' | 'gerente' | 'admin';
  ativo: boolean;
  pode_usar_ia: boolean;
}

interface AddDirectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  director?: Director | null;
}

export const AddDirectorDialog = ({ isOpen, onClose, onSuccess, director }: AddDirectorDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    departamento: '',
    nivel_acesso: 'basico' as 'basico' | 'gerente' | 'admin',
    ativo: true,
    pode_usar_ia: false
  });

  useEffect(() => {
    if (director) {
      setFormData({
        nome: director.nome,
        telefone: director.telefone,
        departamento: director.departamento || '',
        nivel_acesso: director.nivel_acesso,
        ativo: director.ativo,
        pode_usar_ia: director.pode_usar_ia
      });
    } else {
      setFormData({
        nome: '',
        telefone: '',
        departamento: '',
        nivel_acesso: 'basico',
        ativo: true,
        pode_usar_ia: false
      });
    }
  }, [director, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (director) {
        // Update
        const { error } = await supabase
          .from('exa_alerts_directors')
          .update({
            nome: formData.nome,
            telefone: formData.telefone,
            departamento: formData.departamento || null,
            nivel_acesso: formData.nivel_acesso,
            ativo: formData.ativo,
            pode_usar_ia: formData.pode_usar_ia
          })
          .eq('id', director.id);

        if (error) throw error;
        toast.success('Diretor atualizado com sucesso!');
      } else {
        // Create
        const { error } = await supabase
          .from('exa_alerts_directors')
          .insert([{
            nome: formData.nome,
            telefone: formData.telefone,
            departamento: formData.departamento || null,
            nivel_acesso: formData.nivel_acesso,
            ativo: formData.ativo,
            pode_usar_ia: formData.pode_usar_ia
          }]);

        if (error) throw error;
        toast.success('Diretor adicionado com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving director:', error);
      toast.error(error.message || 'Erro ao salvar diretor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {director ? 'Editar Diretor' : 'Adicionar Diretor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="João Silva"
              required
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone WhatsApp *</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="11987654321"
              required
            />
          </div>

          {/* Departamento */}
          <div className="space-y-2">
            <Label htmlFor="departamento">Departamento</Label>
            <Input
              id="departamento"
              value={formData.departamento}
              onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
              placeholder="Operações"
            />
          </div>

          {/* Nível de Acesso */}
          <div className="space-y-2">
            <Label htmlFor="nivel">Nível de Acesso *</Label>
            <Select
              value={formData.nivel_acesso}
              onValueChange={(value: 'basico' | 'gerente' | 'admin') => 
                setFormData({ ...formData, nivel_acesso: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basico">Básico</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Switches */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Diretor Ativo</Label>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ia">Modo Gerente (IA)</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Permite responder perguntas ao agente
                </p>
              </div>
              <Switch
                id="ia"
                checked={formData.pode_usar_ia}
                onCheckedChange={(checked) => setFormData({ ...formData, pode_usar_ia: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-[#9C1E1E] to-[#D72638] hover:from-[#7A1717] hover:to-[#B01F2E]"
            >
              {loading ? 'Salvando...' : director ? 'Salvar Alterações' : 'Adicionar Diretor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
