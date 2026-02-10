import React, { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Package, Pencil, Check, X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { ItemPermuta } from '@/types/permuta';
import { v4 as uuidv4 } from 'uuid';

interface ItensPermutaEditorProps {
  itens: ItemPermuta[];
  onChange: (itens: ItemPermuta[]) => void;
  ocultarValoresPublico: boolean;
  onOcultarValoresChange: (value: boolean) => void;
  descricaoContrapartida: string;
  onDescricaoChange: (value: string) => void;
}

export const ItensPermutaEditor: React.FC<ItensPermutaEditorProps> = ({
  itens,
  onChange,
  ocultarValoresPublico,
  onOcultarValoresChange,
  descricaoContrapartida,
  onDescricaoChange,
}) => {
  const [novoItem, setNovoItem] = useState({
    nome: '',
    quantidade: 1,
    preco_unitario: 0,
  });

  const handleQuickAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // UX: muita gente "preenche" o item e espera que ele conte na proposta.
    // Permitir Enter para adicionar (sem depender do clique no +).
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const addItem = () => {
    if (!novoItem.nome.trim()) return;
    
    const item: ItemPermuta = {
      id: uuidv4(),
      nome: novoItem.nome.trim(),
      quantidade: novoItem.quantidade,
      preco_unitario: novoItem.preco_unitario,
      preco_total: novoItem.quantidade * novoItem.preco_unitario,
      ocultar_preco: false,
    };
    
    onChange([...itens, item]);
    setNovoItem({ nome: '', quantidade: 1, preco_unitario: 0 });
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ nome: '', quantidade: 1, preco_unitario: 0 });

  const removeItem = (id: string) => {
    onChange(itens.filter(item => item.id !== id));
  };

  const toggleItemVisibility = (id: string) => {
    onChange(itens.map(item => 
      item.id === id 
        ? { ...item, ocultar_preco: !item.ocultar_preco }
        : item
    ));
  };

  const startEditing = (item: ItemPermuta) => {
    setEditingId(item.id);
    setEditValues({ nome: item.nome, quantidade: item.quantidade, preco_unitario: item.preco_unitario });
  };

  const saveEdit = (id: string) => {
    if (!editValues.nome.trim()) return;
    onChange(itens.map(item =>
      item.id === id
        ? { ...item, nome: editValues.nome.trim(), quantidade: editValues.quantidade, preco_unitario: editValues.preco_unitario, preco_total: editValues.quantidade * editValues.preco_unitario }
        : item
    ));
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const copyItemText = (item: ItemPermuta) => {
    const text = `${item.nome} — Qtd: ${item.quantidade} × ${formatCurrency(item.preco_unitario)} = ${formatCurrency(item.preco_total)}`;
    navigator.clipboard.writeText(text).then(() => toast.success('Texto copiado!')).catch(() => toast.error('Erro ao copiar'));
  };

  const valorTotal = itens.reduce((sum, item) => sum + item.preco_total, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Equipamentos Ofertados</h3>
          <p className="text-xs text-muted-foreground">Lista de itens que o cliente oferece em troca</p>
        </div>
      </div>

      {/* Lista de itens */}
      {itens.length > 0 && (
        <div className="space-y-2">
          {itens.map((item) => (
            <Card key={item.id} className="p-3 bg-white border-slate-200">
              {editingId === item.id ? (
                <div className="space-y-2">
                  <Input
                    value={editValues.nome}
                    onChange={(e) => setEditValues({ ...editValues, nome: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Qtd</Label>
                      <Input
                        type="number" min={1}
                        value={editValues.quantidade}
                        onChange={(e) => setEditValues({ ...editValues, quantidade: parseInt(e.target.value) || 1 })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Preço Unit.</Label>
                      <Input
                        type="number" min={0} step={0.01}
                        value={editValues.preco_unitario || ''}
                        onChange={(e) => setEditValues({ ...editValues, preco_unitario: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-1.5 justify-end">
                    <button type="button" onClick={cancelEdit} className="p-1.5 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => saveEdit(item.id)} className="p-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 select-text" onDoubleClick={() => startEditing(item)}>
                    <div className="font-medium text-sm">{item.nome}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <span>Qtd: {item.quantidade}</span>
                      <span>×</span>
                      <span>{formatCurrency(item.preco_unitario)}</span>
                      <span>=</span>
                      <span className="font-semibold text-foreground">{formatCurrency(item.preco_total)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => copyItemText(item)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Copiar texto">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => startEditing(item)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Editar item">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItemVisibility(item.id)}
                      className={`p-1.5 rounded-md transition-colors ${
                        item.ocultar_preco 
                          ? 'bg-slate-200 text-slate-600' 
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                      }`}
                      title={item.ocultar_preco ? 'Preço oculto' : 'Preço visível'}
                    >
                      {item.ocultar_preco ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button type="button" onClick={() => removeItem(item.id)} className="p-1.5 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Adicionar novo item */}
      <Card className="p-3 bg-slate-50/50 border-dashed border-slate-300">
        <div className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-5">
            <Label className="text-xs text-slate-600">Nome do Equipamento</Label>
            <Input
              value={novoItem.nome}
              onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })}
              onKeyDown={handleQuickAddKeyDown}
              placeholder="Ex: Tablet Samsung Galaxy Tab A8"
              className="h-9 mt-1 bg-white"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-slate-600">Qtd</Label>
            <Input
              type="number"
              min={1}
              value={novoItem.quantidade}
              onChange={(e) => setNovoItem({ ...novoItem, quantidade: parseInt(e.target.value) || 1 })}
              onKeyDown={handleQuickAddKeyDown}
              className="h-9 mt-1 bg-white"
            />
          </div>
          <div className="col-span-3">
            <Label className="text-xs text-slate-600">Preço Unit.</Label>
            <div className="relative mt-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={novoItem.preco_unitario || ''}
                onChange={(e) => setNovoItem({ ...novoItem, preco_unitario: parseFloat(e.target.value) || 0 })}
                onKeyDown={handleQuickAddKeyDown}
                className="h-9 pl-7 bg-white"
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="col-span-2">
            <Button
              type="button"
              onClick={addItem}
              disabled={!novoItem.nome.trim()}
              className="h-9 w-full bg-amber-500 hover:bg-amber-600"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="mt-2 text-[10px] text-muted-foreground">
          Dica: pressione <span className="font-medium">Enter</span> para adicionar o item.
        </p>
      </Card>

      {/* Valor Total e Opção de Ocultar */}
      {itens.length > 0 && (
        <div className="space-y-3">
          {/* Valor Total */}
          <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-amber-800">VALOR TOTAL ESTIMADO:</span>
              <span className="text-lg font-bold text-amber-900">{formatCurrency(valorTotal)}</span>
            </div>
            <p className="text-[10px] text-amber-600 mt-1">
              Este valor é apenas para controle interno
            </p>
          </div>

          {/* Checkbox para ocultar valores */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <Checkbox
              checked={ocultarValoresPublico}
              onCheckedChange={(checked) => onOcultarValoresChange(!!checked)}
              id="ocultar-valores"
            />
            <div>
              <label htmlFor="ocultar-valores" className="text-sm font-medium cursor-pointer">
                Ocultar valores na proposta pública
              </label>
              <p className="text-xs text-muted-foreground">
                O cliente verá apenas a lista de itens, sem os preços
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Descrição da Contrapartida */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-600">Descrição da Contrapartida (opcional)</Label>
        <Textarea
          value={descricaoContrapartida}
          onChange={(e) => onDescricaoChange(e.target.value)}
          placeholder="Ex: Fornecimento de 50 tablets Samsung Galaxy Tab A8 com suportes de parede para instalação nas portarias dos prédios..."
          className="min-h-[80px] bg-white"
        />
        <p className="text-[10px] text-muted-foreground">
          Este texto será exibido na proposta pública como descrição do acordo
        </p>
      </div>
    </div>
  );
};
