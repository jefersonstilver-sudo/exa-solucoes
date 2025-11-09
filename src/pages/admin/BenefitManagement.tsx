import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { BenefitOption } from '@/types/providerBenefits';

const BenefitManagement = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [benefits, setBenefits] = useState<BenefitOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<BenefitOption | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    icon: 'Gift',
    category: 'shopping' as 'shopping' | 'food' | 'transport' | 'entertainment',
    delivery_days: 3 as 1 | 3,
  });

  useEffect(() => {
    loadBenefits();
  }, []);

  const loadBenefits = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('available_benefits')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setBenefits((data || []) as BenefitOption[]);
    } catch (error: any) {
      console.error('Erro ao carregar benefícios:', error);
      toast.error('Erro ao carregar benefícios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (benefit?: BenefitOption) => {
    if (benefit) {
      setEditingBenefit(benefit);
      setFormData({
        name: benefit.name,
        subtitle: benefit.subtitle || '',
        icon: benefit.icon,
        category: benefit.category,
        delivery_days: benefit.delivery_days,
      });
    } else {
      setEditingBenefit(null);
      setFormData({
        name: '',
        subtitle: '',
        icon: 'Gift',
        category: 'shopping',
        delivery_days: 3,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      if (editingBenefit) {
        const { error } = await supabase
          .from('available_benefits')
          .update({
            name: formData.name,
            subtitle: formData.subtitle || null,
            icon: formData.icon,
            category: formData.category,
            delivery_days: formData.delivery_days,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingBenefit.id);

        if (error) throw error;
        toast.success('Benefício atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('available_benefits')
          .insert({
            name: formData.name,
            subtitle: formData.subtitle || null,
            icon: formData.icon,
            category: formData.category,
            delivery_days: formData.delivery_days,
            is_active: true,
            sort_order: benefits.length,
          });

        if (error) throw error;
        toast.success('Benefício criado com sucesso!');
      }

      setIsDialogOpen(false);
      loadBenefits();
    } catch (error: any) {
      console.error('Erro ao salvar benefício:', error);
      toast.error('Erro ao salvar benefício');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (benefit: BenefitOption) => {
    try {
      const { error } = await supabase
        .from('available_benefits')
        .update({ is_active: !benefit.is_active })
        .eq('id', benefit.id);

      if (error) throw error;
      toast.success(benefit.is_active ? 'Benefício desativado' : 'Benefício ativado');
      loadBenefits();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleDelete = async (benefit: BenefitOption) => {
    if (!confirm(`Tem certeza que deseja excluir "${benefit.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('available_benefits')
        .delete()
        .eq('id', benefit.id);

      if (error) throw error;
      toast.success('Benefício excluído com sucesso!');
      loadBenefits();
    } catch (error: any) {
      console.error('Erro ao excluir benefício:', error);
      toast.error('Erro ao excluir benefício');
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      shopping: '🛍️ Compras',
      food: '🍔 Alimentação',
      transport: '🚗 Transporte',
      entertainment: '🎬 Entretenimento',
    };
    return labels[category as keyof typeof labels] || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Benefícios</h1>
          <p className="text-muted-foreground">
            Configure os benefícios disponíveis para os prestadores
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(buildPath('beneficio-prestadores'))}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Benefício
          </Button>
        </div>
      </div>

      {/* Lista de Benefícios */}
      <Card>
        <CardHeader>
          <CardTitle>Benefícios Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Subtítulo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Prazo Entrega</TableHead>
                <TableHead>Ícone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {benefits.map((benefit) => (
                <TableRow key={benefit.id}>
                  <TableCell className="font-medium">{benefit.name}</TableCell>
                  <TableCell className="text-muted-foreground">{benefit.subtitle || '-'}</TableCell>
                  <TableCell>{getCategoryLabel(benefit.category)}</TableCell>
                  <TableCell>
                    {benefit.delivery_days} dia{benefit.delivery_days > 1 ? 's' : ''} útil{benefit.delivery_days > 1 ? 'eis' : ''}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{benefit.icon}</TableCell>
                  <TableCell>
                    <Switch
                      checked={benefit.is_active}
                      onCheckedChange={() => toggleActive(benefit)}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(benefit)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(benefit)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {benefits.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum benefício cadastrado ainda
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBenefit ? 'Editar Benefício' : 'Novo Benefício'}
            </DialogTitle>
            <DialogDescription>
              Configure os dados do benefício disponível para os prestadores.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Shopee"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Ex: Vale-compras online"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Ícone (Lucide)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Ex: ShoppingBag"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shopping">🛍️ Compras</SelectItem>
                  <SelectItem value="food">🍔 Alimentação</SelectItem>
                  <SelectItem value="transport">🚗 Transporte</SelectItem>
                  <SelectItem value="entertainment">🎬 Entretenimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_days">Prazo de Entrega</Label>
              <Select
                value={String(formData.delivery_days)}
                onValueChange={(value) => setFormData({ ...formData, delivery_days: Number(value) as 1 | 3 })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 dia útil</SelectItem>
                  <SelectItem value="3">3 dias úteis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BenefitManagement;
