/**
 * CategoriasFinanceirasPage - Gestão Hierárquica de Categorias
 * 
 * Estrutura oficial simplificada EXA:
 * - SAÍDAS: 3 categorias-mãe fixas (Custos Fixos, Custos Variáveis, Investimentos)
 * - ENTRADAS: 4 categorias-mãe fixas (Receita Operacional, Receita Recorrente, Receita Financeira, Aportes & Capital)
 * - Suporte a subcategorias multinível
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ChevronDown, ChevronUp, Lock, Info, TrendingDown, TrendingUp } from 'lucide-react';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { useCategoriaHierarchy, type FluxoType } from '@/hooks/useCategoriaHierarchy';
import { 
  CategoriaTree, 
  CategoriaFormModal, 
  DeleteCategoriaDialog 
} from '@/components/admin/financeiro/categorias';
import type { CategoriaNode } from '@/hooks/useCategoriaHierarchy';
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

// Descrições oficiais das subcategorias de SAÍDA
const SUBCATEGORIA_DESCRIPTIONS_SAIDA: Record<string, string> = {
  'Sistema / Infraestrutura': 'AWS, Supabase, Lovable, OpenAI, APIs, hospedagem, banco de dados',
  'Salários & Estrutura': 'CLT, pró-labore, estagiários, funcionários fixos, encargos',
  'Estrutura Administrativa': 'Aluguel, energia, internet, água, escritório, contabilidade',
  'Marketing & Aquisição': 'Meta Ads, Google Ads, Canva, ferramentas de design, campanhas',
  'Operação por Demanda': 'Eletricista, instaladores, técnicos, prestadores por projeto',
  'Taxas Variáveis': 'Gateway, Asaas, taxas de cartão, taxas por transação',
  'Desenvolvimento & Evolução': 'Features, refatorações, segurança avançada, performance',
  'Crescimento & Estratégia': 'Projetos novos, testes de mercado, parcerias, expansões',
};

// Descrições oficiais das subcategorias de ENTRADA
const SUBCATEGORIA_DESCRIPTIONS_ENTRADA: Record<string, string> = {
  'Vendas Avulsas': 'Vendas pontuais, serviços uma vez, projetos fechados sem recorrência',
  'Assinaturas': 'Planos mensais, cobranças recorrentes ASAAS, MRR, clientes ativos',
  'Rendimentos Financeiros': 'Juros, rendimentos de conta, cashback, ajustes positivos',
  'Aportes dos Sócios': 'Aporte pessoal, capitalização, reforço de caixa',
  'Empréstimos': 'Empréstimos bancários, empréstimos de sócios, crédito tomado',
};

const CategoriasFinanceirasPage: React.FC = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [activeTab, setActiveTab] = useState<FluxoType>('saida');
  
  const {
    isLoading,
    expandedIds,
    toggleExpanded,
    expandAll,
    collapseAll,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    isFixedCategory,
    getTreeByFluxo,
  } = useCategoriaHierarchy();

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaNode | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [categoriaToDelete, setCategoriaToDelete] = useState<CategoriaNode | null>(null);

  // Get filtered tree based on active tab
  const currentTree = getTreeByFluxo(activeTab);

  // Handlers
  const handleAddChild = (parentId: string) => {
    setEditingCategoria(null);
    setParentIdForNew(parentId);
    setShowFormModal(true);
  };

  const handleEdit = (categoria: CategoriaNode) => {
    if (isFixedCategory(categoria.id)) return;
    setEditingCategoria(categoria);
    setParentIdForNew(categoria.parent_id);
    setShowFormModal(true);
  };

  const handleDelete = (categoria: CategoriaNode) => {
    if (isFixedCategory(categoria.id)) return;
    setCategoriaToDelete(categoria);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoriaToDelete) return;
    await deleteCategoria.mutateAsync(categoriaToDelete.id);
    setShowDeleteDialog(false);
    setCategoriaToDelete(null);
  };

  const handleFormSubmit = async (data: { nome: string; cor: string; icone: string; ativo: boolean }) => {
    if (editingCategoria) {
      await updateCategoria.mutateAsync({
        id: editingCategoria.id,
        data: {
          nome: data.nome,
          cor: data.cor,
          icone: data.icone,
          ativo: data.ativo,
        },
      });
    } else {
      await createCategoria.mutateAsync({
        nome: data.nome,
        cor: data.cor,
        icone: data.icone,
        parent_id: parentIdForNew,
        ativo: data.ativo,
        fluxo: activeTab,
      });
    }
    setShowFormModal(false);
    setEditingCategoria(null);
    setParentIdForNew(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(buildPath('financeiro'))}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Categorias Financeiras</h1>
            <p className="text-sm text-muted-foreground">Estrutura oficial de classificação financeira</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={collapseAll}
            className="gap-1.5"
          >
            <ChevronUp className="h-4 w-4" />
            Colapsar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={expandAll}
            className="gap-1.5"
          >
            <ChevronDown className="h-4 w-4" />
            Expandir
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FluxoType)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger 
            value="saida" 
            className={cn(
              "gap-2 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive"
            )}
          >
            <TrendingDown className="h-4 w-4" />
            Saídas (Despesas)
          </TabsTrigger>
          <TabsTrigger 
            value="entrada" 
            className={cn(
              "gap-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-600"
            )}
          >
            <TrendingUp className="h-4 w-4" />
            Entradas (Receitas)
          </TabsTrigger>
        </TabsList>

        {/* Info Alert - Dynamic based on tab */}
        <Alert className="mb-6 bg-muted/50 border-muted">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <span className="font-medium">Estrutura oficial EXA:</span> As {activeTab === 'saida' ? '3' : '4'} categorias-mãe 
            <span className="inline-flex items-center gap-1 mx-1">
              <Lock className="h-3 w-3" />
            </span>
            são fixas e imutáveis. Você pode adicionar subcategorias dentro de qualquer nível.
          </AlertDescription>
        </Alert>

        {/* Saídas Content */}
        <TabsContent value="saida" className="mt-0">
          {/* Categories Tree */}
          <div className="bg-card rounded-xl border shadow-sm p-4">
            <CategoriaTree
              tree={currentTree}
              expandedIds={expandedIds}
              isLoading={isLoading}
              onToggleExpand={toggleExpanded}
              onAddChild={handleAddChild}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>

          {/* Legenda Saídas */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-3">Regras de Classificação - Saídas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="font-medium text-foreground">Custos Fixos</span>
                </div>
                <p className="text-muted-foreground text-xs pl-5">
                  Gastos mensais independentes de vendas
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="font-medium text-foreground">Custos Variáveis</span>
                </div>
                <p className="text-muted-foreground text-xs pl-5">
                  Dependem da operação ou volume
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="font-medium text-foreground">Investimentos</span>
                </div>
                <p className="text-muted-foreground text-xs pl-5">
                  Gastos para crescer ou estruturar
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Entradas Content */}
        <TabsContent value="entrada" className="mt-0">
          {/* Categories Tree */}
          <div className="bg-card rounded-xl border shadow-sm p-4">
            <CategoriaTree
              tree={currentTree}
              expandedIds={expandedIds}
              isLoading={isLoading}
              onToggleExpand={toggleExpanded}
              onAddChild={handleAddChild}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>

          {/* Legenda Entradas */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-3">Regras de Classificação - Entradas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="font-medium text-foreground">Receita Operacional</span>
                </div>
                <p className="text-muted-foreground text-xs pl-5">
                  Vendas diretas, pontuais
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="font-medium text-foreground">Receita Recorrente</span>
                </div>
                <p className="text-muted-foreground text-xs pl-5">
                  MRR, assinaturas, planos mensais
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span className="font-medium text-foreground">Receita Financeira</span>
                </div>
                <p className="text-muted-foreground text-xs pl-5">
                  Juros, rendimentos, cashback
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="font-medium text-foreground">Aportes & Capital</span>
                </div>
                <p className="text-muted-foreground text-xs pl-5">
                  Aportes, empréstimos (não é receita)
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Form Modal */}
      <CategoriaFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingCategoria(null);
          setParentIdForNew(null);
        }}
        onSubmit={handleFormSubmit}
        categoria={editingCategoria}
        isLoading={createCategoria.isPending || updateCategoria.isPending}
      />

      {/* Delete Dialog */}
      <DeleteCategoriaDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setCategoriaToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        categoria={categoriaToDelete}
        isLoading={deleteCategoria.isPending}
      />
    </div>
  );
};

export default CategoriasFinanceirasPage;
