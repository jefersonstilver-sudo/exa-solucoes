/**
 * TabCategorizacao - Metadados editáveis do lançamento
 * Permite categorização, centro de custo, responsáveis e tags
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Save, Repeat } from 'lucide-react';
import { LancamentoDossie, Categoria, CentroCusto, Funcionario } from '../types';
import { CategoriaTreeSelect } from '../../categorias/CategoriaTreeSelect';
import type { FluxoType } from '@/hooks/useCategoriaHierarchy';

interface TabCategorizacaoProps {
  lancamento: LancamentoDossie;
  categorias: Categoria[];
  centrosCusto: CentroCusto[];
  funcionarios: Funcionario[];
  onSave: (updates: Partial<LancamentoDossie>) => Promise<boolean>;
  saving?: boolean;
}

const TabCategorizacao: React.FC<TabCategorizacaoProps> = ({
  lancamento,
  categorias,
  centrosCusto,
  funcionarios,
  onSave,
  saving
}) => {
  const [categoriaId, setCategoriaId] = useState(lancamento.categoria_id || '');
  const [centroCustoId, setCentroCustoId] = useState(lancamento.centro_custo_id || '');
  const [tipoReceita, setTipoReceita] = useState<'fixa' | 'variavel' | ''>(lancamento.tipo_receita || '');
  const [recorrente, setRecorrente] = useState(lancamento.recorrente || false);
  const [tags, setTags] = useState<string[]>(lancamento.tags || []);
  const [newTag, setNewTag] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const isAsaas = lancamento.origem === 'asaas';
  const isEntrada = lancamento.tipo === 'entrada';
  
  // Determinar o fluxo baseado no tipo do lançamento
  const fluxo: FluxoType = isEntrada ? 'entrada' : 'saida';

  useEffect(() => {
    const changed = 
      categoriaId !== (lancamento.categoria_id || '') ||
      centroCustoId !== (lancamento.centro_custo_id || '') ||
      tipoReceita !== (lancamento.tipo_receita || '') ||
      recorrente !== (lancamento.recorrente || false) ||
      JSON.stringify(tags) !== JSON.stringify(lancamento.tags || []);
    
    setHasChanges(changed);
  }, [categoriaId, centroCustoId, tipoReceita, recorrente, tags, lancamento]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = async () => {
    const updates: Partial<LancamentoDossie> = {
      categoria_id: categoriaId || undefined,
      centro_custo_id: centroCustoId || undefined,
      tags: tags.length > 0 ? tags : undefined
    };

    if (isAsaas) {
      updates.tipo_receita = tipoReceita as 'fixa' | 'variavel' | undefined;
      updates.recorrente = recorrente;
    }

    const success = await onSave(updates);
    if (success) {
      setHasChanges(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Categoria - Usando TreeSelect hierárquico */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Categoria</Label>
        <CategoriaTreeSelect
          value={categoriaId}
          onChange={setCategoriaId}
          fluxo={fluxo}
          placeholder="Selecione uma categoria"
          allowCreate={true}
        />
        <p className="text-xs text-muted-foreground">
          {isEntrada ? 'Categorias de receita' : 'Categorias de despesa'}
        </p>
      </div>

      {/* Centro de Custo */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Centro de Custo</Label>
        <Select value={centroCustoId} onValueChange={setCentroCustoId}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Selecione um centro de custo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sem centro de custo</SelectItem>
            {centrosCusto.map(cc => (
              <SelectItem key={cc.id} value={cc.id}>
                {cc.codigo} - {cc.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tipo de Receita (apenas ASAAS entradas) */}
      {isAsaas && isEntrada && (
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-sm font-medium text-gray-700">Classificação da Receita</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={tipoReceita === 'fixa' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipoReceita('fixa')}
              className={tipoReceita === 'fixa' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              Receita Fixa
            </Button>
            <Button
              type="button"
              variant={tipoReceita === 'variavel' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipoReceita('variavel')}
              className={tipoReceita === 'variavel' ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              Receita Variável
            </Button>
            {tipoReceita && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTipoReceita('')}
              >
                Limpar
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Fixa = assinaturas/mensalidades • Variável = vendas avulsas
          </p>
        </div>
      )}

      {/* Recorrente (apenas ASAAS) */}
      {isAsaas && (
        <div className="flex items-center justify-between py-4 border-t">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Repeat className="h-4 w-4" />
              Lançamento Recorrente
            </Label>
            <p className="text-xs text-gray-500">
              Este lançamento se repete mensalmente
            </p>
          </div>
          <Switch
            checked={recorrente}
            onCheckedChange={setRecorrente}
          />
        </div>
      )}

      {/* Tags */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-sm font-medium text-gray-700">Tags</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Adicionar tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            className="flex-1 bg-white"
          />
          <Button type="button" size="icon" variant="outline" onClick={handleAddTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:bg-gray-300 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Save button */}
      {hasChanges && (
        <div className="pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TabCategorizacao;
