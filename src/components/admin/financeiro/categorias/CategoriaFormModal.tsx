import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CategoriaNode, CategoriaFormData } from '@/hooks/useCategoriaHierarchy';

interface CategoriaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoriaFormData) => void;
  categoria?: CategoriaNode | null;
  parentId?: string | null;
  parentNome?: string;
  isLoading?: boolean;
}

const CORES_DISPONIVEIS = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#F59E0B', label: 'Laranja' },
  { value: '#10B981', label: 'Verde' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#6B7280', label: 'Cinza' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#F97316', label: 'Laranja Escuro' },
  { value: '#84CC16', label: 'Lima' },
];

const ICONES_DISPONIVEIS = [
  { value: 'circle', label: '● Círculo' },
  { value: 'building', label: '🏢 Prédio' },
  { value: 'trending-up', label: '📈 Crescimento' },
  { value: 'target', label: '🎯 Alvo' },
  { value: 'briefcase', label: '💼 Trabalho' },
  { value: 'users', label: '👥 Pessoas' },
  { value: 'code', label: '💻 Tecnologia' },
  { value: 'truck', label: '🚚 Logística' },
  { value: 'megaphone', label: '📢 Marketing' },
  { value: 'wrench', label: '🔧 Manutenção' },
];

export function CategoriaFormModal({
  isOpen,
  onClose,
  onSubmit,
  categoria,
  parentId,
  parentNome,
  isLoading,
}: CategoriaFormModalProps) {
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#6B7280');
  const [icone, setIcone] = useState('circle');
  const [ativo, setAtivo] = useState(true);

  const isEditing = !!categoria;

  useEffect(() => {
    if (categoria) {
      setNome(categoria.nome);
      setCor(categoria.cor || '#6B7280');
      setIcone(categoria.icone || 'circle');
      setAtivo(categoria.ativo);
    } else {
      setNome('');
      setCor('#6B7280');
      setIcone('circle');
      setAtivo(true);
    }
  }, [categoria, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) return;

    onSubmit({
      nome: nome.trim(),
      cor,
      icone,
      ativo,
      parent_id: parentId ?? undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Indicador de categoria pai */}
          {parentNome && !isEditing && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <span className="text-muted-foreground">Subcategoria de: </span>
              <span className="font-medium">{parentNome}</span>
            </div>
          )}

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Categoria</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Software, Marketing, Equipamentos..."
              autoFocus
            />
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {CORES_DISPONIVEIS.map((corOption) => (
                <button
                  key={corOption.value}
                  type="button"
                  onClick={() => setCor(corOption.value)}
                  className={`
                    w-8 h-8 rounded-full transition-all
                    ${cor === corOption.value 
                      ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                      : 'hover:scale-105'}
                  `}
                  style={{ backgroundColor: corOption.value }}
                  title={corOption.label}
                />
              ))}
            </div>
          </div>

          {/* Ícone */}
          <div className="space-y-2">
            <Label htmlFor="icone">Ícone</Label>
            <Select value={icone} onValueChange={setIcone}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione um ícone" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {ICONES_DISPONIVEIS.map((iconeOption) => (
                  <SelectItem key={iconeOption.value} value={iconeOption.value}>
                    {iconeOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status ativo */}
          {isEditing && (
            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Categoria ativa</Label>
              <Switch
                id="ativo"
                checked={ativo}
                onCheckedChange={setAtivo}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!nome.trim() || isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
