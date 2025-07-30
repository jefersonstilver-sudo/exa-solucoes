import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Download, X, Edit2, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePortfolioProdutora } from '@/hooks/usePortfolioProdutora';
import PortfolioModal from '@/components/admin/portfolio/PortfolioModal';
import CategoryModal from '@/components/admin/portfolio/CategoryModal';
import VideoGrid from '@/components/admin/portfolio/VideoGrid';
import { CampanhaPortfolio } from '@/hooks/useCampanhasPortfolio';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const PortfolioProdutoraPage = () => {
  const {
    campanhas,
    loading,
    createCampanha,
    updateCampanha,
    deleteCampanha,
    refetch
  } = usePortfolioProdutora();

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCampanha, setEditingCampanha] = useState<CampanhaPortfolio | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Extrair categorias únicas
  const categories = Array.from(new Set(campanhas.map(c => c.categoria))).filter(Boolean);
  
  // Definir primeira categoria como selecionada se não houver seleção
  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // Filtrar campanhas por categoria selecionada
  const categoryVideos = campanhas.filter(campanha => campanha.categoria === selectedCategory);

  const handleCreateNew = () => {
    setEditingCampanha(null);
    setIsVideoModalOpen(true);
  };

  const handleEditVideo = (campanha: CampanhaPortfolio) => {
    setEditingCampanha(campanha);
    setIsVideoModalOpen(true);
  };

  const handleVideoModalSubmit = async (data: any) => {
    if (editingCampanha) {
      return await updateCampanha(editingCampanha.id, data);
    } else {
      // Se não há categoria selecionada, usar a primeira disponível ou forçar criação
      const finalData = {
        ...data,
        categoria: data.categoria || selectedCategory || 'Geral'
      };
      return await createCampanha(finalData);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    await deleteCampanha(id);
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (categoryName: string) => {
    setEditingCategory(categoryName);
    setIsCategoryModalOpen(true);
  };

  const handleCategoryModalSubmit = async (oldName: string | null, newName: string) => {
    if (oldName) {
      // Editar categoria existente - atualizar todas as campanhas
      const videosToUpdate = campanhas.filter(c => c.categoria === oldName);
      
      try {
        await Promise.all(
          videosToUpdate.map(video => 
            updateCampanha(video.id, { categoria: newName })
          )
        );
        toast.success('Categoria atualizada com sucesso!');
        return true;
      } catch (error) {
        toast.error('Erro ao atualizar categoria');
        return false;
      }
    } else {
      // Nova categoria - apenas criar, será usada quando adicionar vídeo
      toast.success('Categoria criada! Adicione vídeos a ela.');
      return true;
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    const videosInCategory = campanhas.filter(c => c.categoria === categoryName);
    
    if (videosInCategory.length > 0) {
      toast.error(`Esta categoria possui ${videosInCategory.length} vídeo(s). Exclua os vídeos primeiro.`);
      return;
    }

    // Se chegou aqui, a categoria está vazia - apenas remove da seleção
    if (selectedCategory === categoryName) {
      const remainingCategories = categories.filter(c => c !== categoryName);
      setSelectedCategory(remainingCategories[0] || '');
    }
    
    toast.success('Categoria removida com sucesso!');
  };

  const handleExport = () => {
    const csvContent = [
      ['Título', 'Cliente', 'Categoria', 'Descrição', 'URL do Vídeo', 'Criado em'],
      ...campanhas.map(campanha => [
        campanha.titulo,
        campanha.cliente,
        campanha.categoria,
        campanha.descricao || '',
        campanha.url_video,
        new Date(campanha.created_at).toLocaleDateString('pt-BR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_produtora_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Portfólio da Produtora</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os vídeos organizados por categorias exibidos na página da produtora.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-4 border">
          <div className="text-2xl font-bold text-primary">{campanhas.length}</div>
          <div className="text-sm text-muted-foreground">Total de vídeos</div>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <div className="text-2xl font-bold text-primary">{categories.length}</div>
          <div className="text-sm text-muted-foreground">Categorias</div>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <div className="text-2xl font-bold text-primary">{categoryVideos.length}</div>
          <div className="text-sm text-muted-foreground">Vídeos nesta categoria</div>
        </div>
      </div>

      {/* Interface por categorias */}
      {categories.length > 0 ? (
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <div className="flex items-center gap-4 mb-6">
            <TabsList className="flex-1">
              {categories.map((category) => (
                <div key={category} className="flex items-center group">
                  <TabsTrigger 
                    value={category} 
                    className="relative pr-8"
                  >
                    {category}
                    <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                      {campanhas.filter(c => c.categoria === category).length}
                    </span>
                  </TabsTrigger>
                  
                  {/* Botões de ação da categoria */}
                  <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditCategory(category)}
                      className="h-6 w-6 p-0 hover:bg-muted"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir categoria "{category}"</AlertDialogTitle>
                          <AlertDialogDescription>
                            {campanhas.filter(c => c.categoria === category).length > 0 
                              ? `Esta categoria possui ${campanhas.filter(c => c.categoria === category).length} vídeo(s). Exclua os vídeos primeiro para poder remover a categoria.`
                              : 'Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.'
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCategory(category)}
                            disabled={campanhas.filter(c => c.categoria === category).length > 0}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </TabsList>
            
            <Button 
              onClick={handleCreateCategory}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          </div>

          {/* Conteúdo da categoria selecionada */}
          {categories.map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {category} ({categoryVideos.length} vídeos)
                </h2>
                <Button 
                  onClick={handleCreateNew}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Vídeo
                </Button>
              </div>
              
              <VideoGrid
                videos={categoryVideos}
                loading={loading}
                onEdit={handleEditVideo}
                onDelete={handleDeleteVideo}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        /* Estado vazio */
        <div className="text-center py-12 bg-card rounded-lg border border-dashed">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
          <p className="text-muted-foreground mb-6">
            Comece criando uma categoria para organizar seus vídeos do portfólio.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleCreateCategory} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeira Categoria
            </Button>
          </div>
        </div>
      )}

      {/* Modais */}
      <PortfolioModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSubmit={handleVideoModalSubmit}
        editingCampanha={editingCampanha}
        existingCategories={categories}
        selectedCategory={selectedCategory}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCategoryModalSubmit}
        editingCategory={editingCategory}
        existingCategories={categories}
      />
    </div>
  );
};

export default PortfolioProdutoraPage;