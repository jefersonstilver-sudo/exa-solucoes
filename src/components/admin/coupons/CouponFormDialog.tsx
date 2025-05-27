
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Wand2, Copy } from 'lucide-react';
import { Coupon, CreateCouponData } from '@/types/coupon';

interface CouponFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCouponData) => Promise<boolean>;
  onGenerateCode: (prefix?: string) => Promise<string>;
  editingCoupon?: Coupon | null;
}

const CouponFormDialog: React.FC<CouponFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onGenerateCode,
  editingCoupon
}) => {
  const [formData, setFormData] = useState<CreateCouponData>({
    codigo: '',
    desconto_percentual: 10,
    max_usos: 100,
    min_meses: 1,
    descricao: '',
    tipo_desconto: 'percentual',
    valor_minimo_pedido: 0,
    uso_por_usuario: undefined,
    categoria: 'geral',
    ativo: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCoupon) {
      setFormData({
        codigo: editingCoupon.codigo,
        desconto_percentual: editingCoupon.desconto_percentual,
        max_usos: editingCoupon.max_usos,
        min_meses: editingCoupon.min_meses,
        expira_em: editingCoupon.expira_em || '',
        descricao: editingCoupon.descricao || '',
        tipo_desconto: editingCoupon.tipo_desconto,
        valor_minimo_pedido: editingCoupon.valor_minimo_pedido || 0,
        uso_por_usuario: editingCoupon.uso_por_usuario || undefined,
        categoria: editingCoupon.categoria,
        ativo: editingCoupon.ativo
      });
    } else {
      setFormData({
        codigo: '',
        desconto_percentual: 10,
        max_usos: 100,
        min_meses: 1,
        descricao: '',
        tipo_desconto: 'percentual',
        valor_minimo_pedido: 0,
        uso_por_usuario: undefined,
        categoria: 'geral',
        ativo: true
      });
    }
  }, [editingCoupon, isOpen]);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const prefix = formData.categoria === 'primeira_compra' ? 'WELCOME' :
                     formData.categoria === 'vip' ? 'VIP' :
                     formData.categoria === 'evento' ? 'EVENT' : 'INDEXA';
      
      const newCode = await onGenerateCode(prefix);
      setFormData(prev => ({ ...prev, codigo: newCode }));
    } catch (error) {
      console.error('Erro ao gerar código:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se o código está preenchido
    if (!formData.codigo) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await onSubmit(formData);
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(formData.codigo);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCoupon ? 'Editar Cupom' : 'Criar Novo Cupom'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Código do Cupom */}
          <div className="space-y-2">
            <Label htmlFor="codigo">Código do Cupom</Label>
            <div className="flex gap-2">
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                placeholder="Ex: INDEXA2024"
                className="uppercase"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGenerateCode}
                disabled={isGenerating}
                title="Gerar código automático"
              >
                <Wand2 className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </Button>
              {formData.codigo && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyCode}
                  title="Copiar código"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select 
              value={formData.categoria} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral</SelectItem>
                <SelectItem value="primeira_compra">Primeira Compra</SelectItem>
                <SelectItem value="reativacao">Reativação</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="evento">Evento</SelectItem>
                <SelectItem value="promocional">Promocional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desconto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Desconto</Label>
              <Select 
                value={formData.tipo_desconto} 
                onValueChange={(value: 'percentual' | 'valor_fixo') => setFormData(prev => ({ ...prev, tipo_desconto: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                  <SelectItem value="valor_fixo">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desconto">
                Desconto {formData.tipo_desconto === 'percentual' ? '(%)' : '(R$)'}
              </Label>
              <Input
                id="desconto"
                type="number"
                value={formData.desconto_percentual}
                onChange={(e) => setFormData(prev => ({ ...prev, desconto_percentual: parseInt(e.target.value) || 0 }))}
                min="1"
                max={formData.tipo_desconto === 'percentual' ? '100' : undefined}
                required
              />
            </div>
          </div>

          <Separator />

          {/* Limitações de Uso */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxUsos">Máximo de Usos</Label>
              <Input
                id="maxUsos"
                type="number"
                value={formData.max_usos}
                onChange={(e) => setFormData(prev => ({ ...prev, max_usos: parseInt(e.target.value) || 1 }))}
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usoUsuario">Uso por Usuário</Label>
              <Input
                id="usoUsuario"
                type="number"
                value={formData.uso_por_usuario || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  uso_por_usuario: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                placeholder="Ilimitado"
                min="1"
              />
            </div>
          </div>

          {/* Restrições */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minMeses">Plano Mínimo (meses)</Label>
              <Select 
                value={formData.min_meses.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, min_meses: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 mês</SelectItem>
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorMinimo">Valor Mínimo do Pedido (R$)</Label>
              <Input
                id="valorMinimo"
                type="number"
                step="0.01"
                value={formData.valor_minimo_pedido}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_minimo_pedido: parseFloat(e.target.value) || 0 }))}
                min="0"
              />
            </div>
          </div>

          {/* Data de Expiração */}
          <div className="space-y-2">
            <Label htmlFor="expiraEm">Data de Expiração (opcional)</Label>
            <Input
              id="expiraEm"
              type="datetime-local"
              value={formData.expira_em}
              onChange={(e) => setFormData(prev => ({ ...prev, expira_em: e.target.value }))}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descrição do cupom..."
              rows={3}
            />
          </div>

          {/* Status Ativo */}
          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
            />
            <Label htmlFor="ativo">Cupom ativo</Label>
          </div>

          <Separator />

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.codigo}>
              {isSubmitting ? 'Salvando...' : editingCoupon ? 'Atualizar' : 'Criar Cupom'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CouponFormDialog;
