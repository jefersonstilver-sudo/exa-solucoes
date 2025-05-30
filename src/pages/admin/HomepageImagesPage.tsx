
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, RefreshCw } from 'lucide-react';
import { useHomepageImages } from '@/hooks/useHomepageImages';
import HomepageCardEditor from '@/components/admin/homepage/HomepageCardEditor';

const HomepageImagesPage = () => {
  const { configs, isLoading, isSaving, updateConfig, uploadImage, refetch } = useHomepageImages();

  const openHomepage = () => {
    window.open('/', '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indexa-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Imagens da Homepage</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as imagens, títulos e links dos cards da página inicial
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button
            onClick={openHomepage}
            className="flex items-center gap-2 bg-indexa-purple hover:bg-indexa-purple/90"
          >
            <Eye className="h-4 w-4" />
            Ver Homepage
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indexa-purple">
              {configs.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Última Atualização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-900">
              {configs.length > 0 
                ? new Date(Math.max(...configs.map(c => new Date(c.updated_at).getTime()))).toLocaleDateString('pt-BR')
                : 'N/A'
              }
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-900">Ativo</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Editores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {configs.map((config) => (
          <HomepageCardEditor
            key={config.id}
            config={config}
            onUpdate={updateConfig}
            onUploadImage={uploadImage}
            isSaving={isSaving}
          />
        ))}
      </div>

      {configs.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">
              Nenhuma configuração encontrada. As configurações padrão devem ser criadas automaticamente.
            </p>
            <Button onClick={refetch} className="mt-4">
              Recarregar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HomepageImagesPage;
