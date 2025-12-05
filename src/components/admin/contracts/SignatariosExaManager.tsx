import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Star,
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface SignatarioExa {
  id: string;
  nome: string;
  email: string;
  cpf: string | null;
  rg: string | null;
  data_nascimento: string | null;
  cargo: string;
  nacionalidade: string | null;
  estado_civil: string | null;
  profissao: string | null;
  cidade: string | null;
  estado: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const initialFormData = {
  nome: '',
  email: '',
  cpf: '',
  rg: '',
  data_nascimento: '',
  cargo: 'Representante Legal',
  nacionalidade: 'brasileiro',
  estado_civil: 'casado',
  profissao: 'empresário',
  cidade: 'Foz do Iguaçu',
  estado: 'PR',
  is_active: true,
  is_default: false,
};

export const SignatariosExaManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSignatario, setEditingSignatario] = useState<SignatarioExa | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  const { data: signatarios, isLoading, refetch } = useQuery({
    queryKey: ['signatarios-exa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signatarios_exa')
        .select('*')
        .order('is_default', { ascending: false })
        .order('nome');
      
      if (error) throw error;
      return data as SignatarioExa[];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        // Update
        const { error } = await supabase
          .from('signatarios_exa')
          .update({
            nome: data.nome,
            email: data.email,
            cpf: data.cpf || null,
            rg: data.rg || null,
            data_nascimento: data.data_nascimento || null,
            cargo: data.cargo,
            nacionalidade: data.nacionalidade,
            estado_civil: data.estado_civil,
            profissao: data.profissao,
            cidade: data.cidade,
            estado: data.estado,
            is_active: data.is_active,
            is_default: data.is_default,
          })
          .eq('id', data.id);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('signatarios_exa')
          .insert({
            nome: data.nome,
            email: data.email,
            cpf: data.cpf || null,
            rg: data.rg || null,
            data_nascimento: data.data_nascimento || null,
            cargo: data.cargo,
            nacionalidade: data.nacionalidade,
            estado_civil: data.estado_civil,
            profissao: data.profissao,
            cidade: data.cidade,
            estado: data.estado,
            is_active: data.is_active,
            is_default: data.is_default,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingSignatario ? 'Signatário atualizado!' : 'Signatário cadastrado!');
      queryClient.invalidateQueries({ queryKey: ['signatarios-exa'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar: ' + error.message);
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      // Remove default from all
      await supabase
        .from('signatarios_exa')
        .update({ is_default: false })
        .neq('id', id);
      
      // Set new default
      const { error } = await supabase
        .from('signatarios_exa')
        .update({ is_default: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Signatário padrão atualizado!');
      queryClient.invalidateQueries({ queryKey: ['signatarios-exa'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('signatarios_exa')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Signatário removido!');
      queryClient.invalidateQueries({ queryKey: ['signatarios-exa'] });
    }
  });

  const handleOpenDialog = (signatario?: SignatarioExa) => {
    if (signatario) {
      setEditingSignatario(signatario);
      setFormData({
        nome: signatario.nome,
        email: signatario.email,
        cpf: signatario.cpf || '',
        rg: signatario.rg || '',
        data_nascimento: signatario.data_nascimento || '',
        cargo: signatario.cargo,
        nacionalidade: signatario.nacionalidade || 'brasileiro',
        estado_civil: signatario.estado_civil || 'casado',
        profissao: signatario.profissao || 'empresário',
        cidade: signatario.cidade || 'Foz do Iguaçu',
        estado: signatario.estado || 'PR',
        is_active: signatario.is_active,
        is_default: signatario.is_default,
      });
    } else {
      setEditingSignatario(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSignatario(null);
    setFormData(initialFormData);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.email) {
      toast.error('Nome e email são obrigatórios');
      return;
    }
    saveMutation.mutate({
      ...formData,
      id: editingSignatario?.id
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Signatários EXA Mídia</h2>
            <p className="text-sm text-muted-foreground">
              Representantes legais que assinam contratos pela EXA
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Signatário
          </Button>
        </div>
      </div>

      {/* Lista de Signatários */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : signatarios?.length === 0 ? (
        <Card className="p-8 text-center bg-white/80">
          <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Nenhum signatário cadastrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Cadastre um representante legal da EXA para assinar contratos.
          </p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Signatário
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {signatarios?.map((signatario) => (
            <Card 
              key={signatario.id} 
              className={`p-4 bg-white/80 backdrop-blur-sm border transition-all ${
                signatario.is_default ? 'border-primary/50 shadow-md' : 'border-white/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{signatario.nome}</h3>
                  {signatario.is_default && (
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Padrão
                    </Badge>
                  )}
                  {!signatario.is_active && (
                    <Badge variant="secondary" className="text-xs">
                      Inativo
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  {!signatario.is_default && signatario.is_active && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setDefaultMutation.mutate(signatario.id)}
                      title="Definir como padrão"
                    >
                      <Star className="h-4 w-4 text-amber-500" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleOpenDialog(signatario)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {!signatario.is_default && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        if (confirm('Deseja remover este signatário?')) {
                          deleteMutation.mutate(signatario.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">{signatario.cargo}</p>
                <p>{signatario.email}</p>
                {signatario.cpf && <p className="font-mono">{signatario.cpf}</p>}
                <p className="text-muted-foreground text-xs">
                  {signatario.nacionalidade}, {signatario.estado_civil}, {signatario.profissao}
                </p>
                <p className="text-muted-foreground text-xs">
                  {signatario.cidade} - {signatario.estado}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSignatario ? 'Editar Signatário' : 'Novo Signatário EXA'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome Completo *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo do signatário"
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@examidia.com.br"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>CPF</Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label>RG</Label>
                <Input
                  value={formData.rg}
                  onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                  placeholder="0.000.000-0"
                />
              </div>
            </div>

            <div>
              <Label>Data de Nascimento *</Label>
              <Input
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
              />
            </div>

            <div>
              <Label>Cargo</Label>
              <Input
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                placeholder="Representante Legal"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nacionalidade</Label>
                <Input
                  value={formData.nacionalidade}
                  onChange={(e) => setFormData({ ...formData, nacionalidade: e.target.value })}
                />
              </div>
              <div>
                <Label>Estado Civil</Label>
                <Input
                  value={formData.estado_civil}
                  onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Profissão</Label>
              <Input
                value={formData.profissao}
                onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cidade</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  maxLength={2}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingSignatario ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
