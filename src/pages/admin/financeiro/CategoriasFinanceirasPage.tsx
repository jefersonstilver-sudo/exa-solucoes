/**
 * CategoriasFinanceirasPage - Gestão de Categorias e Subcategorias
 * 
 * CRUD completo para categorias e subcategorias de despesas
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  Plus,
  FolderOpen,
  Tag,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
  cor: string | null;
  icone: string | null;
  ativo: boolean;
}

interface Subcategoria {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

const CategoriasFinanceirasPage: React.FC = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [showSubcategoriaModal, setShowSubcategoriaModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [editingSubcategoria, setEditingSubcategoria] = useState<Subcategoria | null>(null);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string | null>(null);
  
  // Form states
  const [categoriaForm, setCategoriaForm] = useState({ nome: '', tipo: 'despesa' });
  const [subcategoriaForm, setSubcategoriaForm] = useState({ nome: '', descricao: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, subsRes] = await Promise.all([
        supabase.from('categorias_despesas').select('*').order('nome'),
        supabase.from('subcategorias_despesas').select('*').order('nome')
      ]);

      if (catsRes.error) throw catsRes.error;
      if (subsRes.error) throw subsRes.error;

      setCategorias(catsRes.data || []);
      setSubcategorias(subsRes.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const getSubcategoriasByCategoria = (categoriaId: string) => {
    return subcategorias.filter(s => s.categoria_id === categoriaId);
  };

  // ==================== CATEGORIA CRUD ====================
  
  const openCategoriaModal = (categoria?: Categoria) => {
    if (categoria) {
      setEditingCategoria(categoria);
      setCategoriaForm({ nome: categoria.nome, tipo: categoria.tipo });
    } else {
      setEditingCategoria(null);
      setCategoriaForm({ nome: '', tipo: 'despesa' });
    }
    setShowCategoriaModal(true);
  };

  const handleSaveCategoria = async () => {
    if (!categoriaForm.nome.trim()) {
      toast.error('Informe o nome da categoria');
      return;
    }

    setSaving(true);
    try {
      if (editingCategoria) {
        const { error } = await supabase
          .from('categorias_despesas')
          .update({ nome: categoriaForm.nome.trim(), tipo: categoriaForm.tipo })
          .eq('id', editingCategoria.id);
        
        if (error) throw error;
        toast.success('Categoria atualizada!');
      } else {
        const { error } = await supabase
          .from('categorias_despesas')
          .insert({ nome: categoriaForm.nome.trim(), tipo: categoriaForm.tipo, ativo: true });
        
        if (error) throw error;
        toast.success('Categoria criada!');
      }

      setShowCategoriaModal(false);
      fetchData();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      toast.error(error.message || 'Erro ao salvar categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategoriaAtivo = async (categoria: Categoria) => {
    try {
      const { error } = await supabase
        .from('categorias_despesas')
        .update({ ativo: !categoria.ativo })
        .eq('id', categoria.id);
      
      if (error) throw error;
      toast.success(categoria.ativo ? 'Categoria desativada' : 'Categoria ativada');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao atualizar categoria');
    }
  };

  // ==================== SUBCATEGORIA CRUD ====================

  const openSubcategoriaModal = (categoriaId: string, subcategoria?: Subcategoria) => {
    setSelectedCategoriaId(categoriaId);
    if (subcategoria) {
      setEditingSubcategoria(subcategoria);
      setSubcategoriaForm({ nome: subcategoria.nome, descricao: subcategoria.descricao || '' });
    } else {
      setEditingSubcategoria(null);
      setSubcategoriaForm({ nome: '', descricao: '' });
    }
    setShowSubcategoriaModal(true);
  };

  const handleSaveSubcategoria = async () => {
    if (!subcategoriaForm.nome.trim()) {
      toast.error('Informe o nome da subcategoria');
      return;
    }

    setSaving(true);
    try {
      if (editingSubcategoria) {
        const { error } = await supabase
          .from('subcategorias_despesas')
          .update({ 
            nome: subcategoriaForm.nome.trim(), 
            descricao: subcategoriaForm.descricao.trim() || null 
          })
          .eq('id', editingSubcategoria.id);
        
        if (error) throw error;
        toast.success('Subcategoria atualizada!');
      } else {
        const { error } = await supabase
          .from('subcategorias_despesas')
          .insert({ 
            categoria_id: selectedCategoriaId,
            nome: subcategoriaForm.nome.trim(), 
            descricao: subcategoriaForm.descricao.trim() || null,
            ativo: true 
          });
        
        if (error) throw error;
        toast.success('Subcategoria criada!');
      }

      setShowSubcategoriaModal(false);
      fetchData();
    } catch (error: any) {
      console.error('Erro ao salvar subcategoria:', error);
      toast.error(error.message || 'Erro ao salvar subcategoria');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSubcategoriaAtivo = async (subcategoria: Subcategoria) => {
    try {
      const { error } = await supabase
        .from('subcategorias_despesas')
        .update({ ativo: !subcategoria.ativo })
        .eq('id', subcategoria.id);
      
      if (error) throw error;
      toast.success(subcategoria.ativo ? 'Subcategoria desativada' : 'Subcategoria ativada');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao atualizar subcategoria');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(buildPath('financeiro'))}
            className="h-9 w-9 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Categorias Financeiras</h1>
            <p className="text-sm text-gray-500">Gerencie categorias e subcategorias de despesas</p>
          </div>
        </div>
        <Button onClick={() => openCategoriaModal()} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Lista de Categorias */}
      <div className="space-y-3">
        {categorias.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Nenhuma categoria cadastrada</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => openCategoriaModal()}
              >
                Criar primeira categoria
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {categorias.map((categoria) => {
              const subs = getSubcategoriasByCategoria(categoria.id);
              const subsAtivas = subs.filter(s => s.ativo).length;
              
              return (
                <AccordionItem 
                  key={categoria.id} 
                  value={categoria.id}
                  className="bg-white/80 backdrop-blur-sm rounded-lg border shadow-sm"
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <FolderOpen className="h-5 w-5 text-gray-500" />
                      <span className="font-medium text-gray-900">{categoria.nome}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {subsAtivas} subcategoria{subsAtivas !== 1 ? 's' : ''}
                      </Badge>
                      {!categoria.ativo && (
                        <Badge variant="secondary" className="text-xs bg-gray-100">
                          Inativa
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {/* Actions da Categoria */}
                    <div className="flex gap-2 mb-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openCategoriaModal(categoria)}
                        className="gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleCategoriaAtivo(categoria)}
                        className="gap-1"
                      >
                        {categoria.ativo ? (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3.5 w-3.5" />
                            Ativar
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Subcategorias */}
                    <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                      {subs.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Nenhuma subcategoria</p>
                      ) : (
                        subs.map((sub) => (
                          <div 
                            key={sub.id}
                            className={`flex items-center justify-between p-2 rounded-lg ${
                              sub.ativo ? 'bg-gray-50' : 'bg-gray-100 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{sub.nome}</span>
                              {sub.descricao && (
                                <span className="text-xs text-gray-400">({sub.descricao})</span>
                              )}
                              {!sub.ativo && (
                                <Badge variant="secondary" className="text-xs">Inativa</Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openSubcategoriaModal(categoria.id, sub)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleToggleSubcategoriaAtivo(sub)}
                              >
                                {sub.ativo ? (
                                  <XCircle className="h-3.5 w-3.5 text-gray-400" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                      
                      {/* Botão adicionar subcategoria */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openSubcategoriaModal(categoria.id)}
                        className="w-full justify-start gap-2 text-gray-500 hover:text-gray-700"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar subcategoria
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      {/* Modal Categoria */}
      <Dialog open={showCategoriaModal} onOpenChange={setShowCategoriaModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Categoria</Label>
              <Input
                placeholder="Ex: Marketing"
                value={categoriaForm.nome}
                onChange={(e) => setCategoriaForm(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoriaModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategoria} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Subcategoria */}
      <Dialog open={showSubcategoriaModal} onOpenChange={setShowSubcategoriaModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSubcategoria ? 'Editar Subcategoria' : 'Nova Subcategoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Subcategoria</Label>
              <Input
                placeholder="Ex: Tráfego Pago"
                value={subcategoriaForm.nome}
                onChange={(e) => setSubcategoriaForm(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                placeholder="Breve descrição..."
                value={subcategoriaForm.descricao}
                onChange={(e) => setSubcategoriaForm(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubcategoriaModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSubcategoria} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriasFinanceirasPage;
