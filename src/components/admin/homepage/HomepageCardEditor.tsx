
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Eye, Save, RotateCcw, Trash2 } from 'lucide-react';
import { HomepageConfig } from '@/hooks/useHomepageImages';
import { toast } from 'sonner';

interface HomepageCardEditorProps {
  config: HomepageConfig;
  onUpdate: (serviceType: string, updates: Partial<HomepageConfig>) => Promise<boolean>;
  onUploadImage: (file: File, serviceType: string) => Promise<string | null>;
  onDeleteImage?: (imageUrl: string) => Promise<boolean>;
  isSaving: boolean;
}

const iconOptions = [
  { value: 'calendar', label: 'Calendário' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'info', label: 'Informação' }
];

const HomepageCardEditor: React.FC<HomepageCardEditorProps> = ({
  config,
  onUpdate,
  onUploadImage,
  onDeleteImage,
  isSaving
}) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleInputChange = (field: keyof HomepageConfig, value: string) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB');
      return;
    }

    setUploadingImage(true);
    
    try {
      // Deletar imagem anterior se for do Storage
      if (localConfig.image_url.includes('supabase') && onDeleteImage) {
        await onDeleteImage(localConfig.image_url);
      }

      const imageUrl = await onUploadImage(file, config.service_type);
      
      if (imageUrl) {
        handleInputChange('image_url', imageUrl);
        toast.success('Imagem carregada com sucesso!');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    const success = await onUpdate(config.service_type, localConfig);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    setLocalConfig(config);
    setHasChanges(false);
  };

  const openPreview = () => {
    window.open('/', '_blank');
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="capitalize">{config.service_type}</span>
          <Button
            onClick={openPreview}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preview da Imagem */}
        <div className="space-y-2">
          <Label>Imagem Atual</Label>
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
            <img
              src={localConfig.image_url}
              alt={localConfig.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800';
              }}
            />
            {uploadingImage && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-sm">Carregando...</div>
              </div>
            )}
          </div>
        </div>

        {/* Upload de Nova Imagem */}
        <div className="space-y-2">
          <Label htmlFor={`image-upload-${config.service_type}`}>
            Carregar Nova Imagem
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id={`image-upload-${config.service_type}`}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="flex-1"
            />
            <Button
              onClick={() => document.getElementById(`image-upload-${config.service_type}`)?.click()}
              variant="outline"
              size="sm"
              disabled={uploadingImage}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Formatos aceitos: JPG, PNG, WebP, GIF (máx. 5MB)
          </p>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor={`title-${config.service_type}`}>Título</Label>
          <Input
            id={`title-${config.service_type}`}
            value={localConfig.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Título do card"
          />
        </div>

        {/* Texto do Botão */}
        <div className="space-y-2">
          <Label htmlFor={`button-text-${config.service_type}`}>Texto do Botão</Label>
          <Input
            id={`button-text-${config.service_type}`}
            value={localConfig.button_text}
            onChange={(e) => handleInputChange('button_text', e.target.value)}
            placeholder="Texto do botão"
          />
        </div>

        {/* Ícone do Botão */}
        <div className="space-y-2">
          <Label>Ícone do Botão</Label>
          <Select
            value={localConfig.button_icon}
            onValueChange={(value) => handleInputChange('button_icon', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um ícone" />
            </SelectTrigger>
            <SelectContent>
              {iconOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* URL de Destino */}
        <div className="space-y-2">
          <Label htmlFor={`href-${config.service_type}`}>URL de Destino</Label>
          <Input
            id={`href-${config.service_type}`}
            value={localConfig.href}
            onChange={(e) => handleInputChange('href', e.target.value)}
            placeholder="/caminho-da-pagina"
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || uploadingImage}
            className="flex-1 bg-indexa-purple hover:bg-indexa-purple/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={!hasChanges || isSaving}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {hasChanges && (
          <p className="text-sm text-amber-600 text-center">
            Há alterações não salvas
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default HomepageCardEditor;
