import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X, Eye, Plus, GripVertical } from 'lucide-react';
import { useHomepageBanners, HomepageBanner } from '@/hooks/useHomepageBanners';
import { toast } from 'sonner';

const HomepageBannerManager = () => {
  const { 
    banners, 
    isLoading, 
    isSaving, 
    fetchAllBanners, 
    updateBanner, 
    createBanner, 
    deleteBanner, 
    uploadImage 
  } = useHomepageBanners();
  
  const [allBanners, setAllBanners] = useState<HomepageBanner[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: '',
    subtitle: '',
    link_url: '',
    order_position: 1,
    is_active: true,
  });
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  useEffect(() => {
    loadAllBanners();
  }, []);

  const loadAllBanners = async () => {
    const data = await fetchAllBanners();
    setAllBanners(data);
  };

  const handleImageUpload = async (file: File, bannerId?: string) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB.');
      return;
    }

    const uploading = bannerId || 'new';
    setUploadingFile(uploading);

    try {
      const imageUrl = await uploadImage(file);
      if (!imageUrl) return;

      if (bannerId) {
        await updateBanner(bannerId, { image_url: imageUrl });
      } else {
        setNewBanner(prev => ({ ...prev, image_url: imageUrl }));
      }
      
      await loadAllBanners();
    } finally {
      setUploadingFile(null);
    }
  };

  const handleCreateBanner = async () => {
    if (!newBanner.image_url) {
      toast.error('Selecione uma imagem para o banner');
      return;
    }

    const success = await createBanner({
      image_url: newBanner.image_url,
      title: newBanner.title || undefined,
      subtitle: newBanner.subtitle || undefined,
      link_url: newBanner.link_url || undefined,
      order_position: newBanner.order_position,
      is_active: newBanner.is_active,
    });

    if (success) {
      setIsCreating(false);
      setNewBanner({
        title: '',
        subtitle: '',
        link_url: '',
        order_position: allBanners.length + 1,
        is_active: true,
      });
      await loadAllBanners();
    }
  };

  const handleUpdateBanner = async (id: string, updates: Partial<HomepageBanner>) => {
    await updateBanner(id, updates);
    await loadAllBanners();
  };

  const handleDeleteBanner = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este banner?')) {
      await deleteBanner(id);
      await loadAllBanners();
    }
  };

  const activeBannersCount = allBanners.filter(b => b.is_active).length;

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
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Banners</h2>
          <p className="text-gray-600 mt-1">
            Gerencie até 5 banners rotativos da homepage. <br />
            <span className="text-sm text-gray-500">
              Tamanho recomendado: 1920x600px (desktop) | Auto-adaptativo (mobile)
            </span>
          </p>
        </div>
        
        <Button
          onClick={() => setIsCreating(true)}
          disabled={activeBannersCount >= 5}
          className="bg-indexa-purple hover:bg-indexa-purple-dark"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Banner
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Banners Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indexa-purple">
              {activeBannersCount} / 5
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Banners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {allBanners.length}
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
              <span className="text-sm text-gray-900">Sistema Ativo</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Banner */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Criar Novo Banner
              <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-title">Título</Label>
                <Input
                  id="new-title"
                  value={newBanner.title}
                  onChange={(e) => setNewBanner(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título do banner (opcional)"
                />
              </div>
              <div>
                <Label htmlFor="new-link">Link de Destino</Label>
                <Input
                  id="new-link"
                  value={newBanner.link_url}
                  onChange={(e) => setNewBanner(prev => ({ ...prev, link_url: e.target.value }))}
                  placeholder="/caminho-da-pagina (opcional)"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="new-subtitle">Subtítulo</Label>
              <Textarea
                id="new-subtitle"
                value={newBanner.subtitle}
                onChange={(e) => setNewBanner(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Subtítulo ou descrição (opcional)"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-order">Posição</Label>
                <Input
                  id="new-order"
                  type="number"
                  min="1"
                  value={newBanner.order_position}
                  onChange={(e) => setNewBanner(prev => ({ ...prev, order_position: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="new-active"
                  checked={newBanner.is_active}
                  onCheckedChange={(checked) => setNewBanner(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="new-active">Banner Ativo</Label>
              </div>
            </div>

            <div>
              <Label>Imagem do Banner</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="hidden"
                  id="new-banner-upload"
                />
                <label
                  htmlFor="new-banner-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {uploadingFile === 'new' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Selecionar Imagem
                </label>
                {newBanner.image_url && (
                  <div className="mt-2">
                    <img 
                      src={newBanner.image_url} 
                      alt="Preview" 
                      className="w-32 h-20 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateBanner}
                disabled={isSaving || !newBanner.image_url}
                className="bg-indexa-purple hover:bg-indexa-purple-dark"
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Criar Banner
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Banners */}
      <div className="grid grid-cols-1 gap-4">
        {allBanners.map((banner) => (
          <Card key={banner.id} className={banner.is_active ? 'border-green-200' : 'border-gray-200'}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <img 
                    src={banner.image_url} 
                    alt={banner.title || 'Banner'} 
                    className="w-24 h-16 object-cover rounded"
                  />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      value={banner.title || ''}
                      onChange={(e) => handleUpdateBanner(banner.id, { title: e.target.value })}
                      placeholder="Título do banner"
                      className="text-sm"
                    />
                    <Input
                      value={banner.link_url || ''}
                      onChange={(e) => handleUpdateBanner(banner.id, { link_url: e.target.value })}
                      placeholder="Link de destino"
                      className="text-sm"
                    />
                  </div>
                  
                  <Textarea
                    value={banner.subtitle || ''}
                    onChange={(e) => handleUpdateBanner(banner.id, { subtitle: e.target.value })}
                    placeholder="Subtítulo"
                    rows={1}
                    className="text-sm"
                  />
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={(checked) => handleUpdateBanner(banner.id, { is_active: checked })}
                      />
                      <span className="text-sm text-gray-600">Ativo</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Posição:</span>
                      <Input
                        type="number"
                        min="1"
                        value={banner.order_position}
                        onChange={(e) => handleUpdateBanner(banner.id, { order_position: parseInt(e.target.value) || 1 })}
                        className="w-16 h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, banner.id);
                    }}
                    className="hidden"
                    id={`banner-upload-${banner.id}`}
                  />
                  <label
                    htmlFor={`banner-upload-${banner.id}`}
                    className="cursor-pointer inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {uploadingFile === banner.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                  </label>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {allBanners.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500 mb-4">
              Nenhum banner configurado ainda.
            </p>
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-indexa-purple hover:bg-indexa-purple-dark"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Banner
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HomepageBannerManager;
