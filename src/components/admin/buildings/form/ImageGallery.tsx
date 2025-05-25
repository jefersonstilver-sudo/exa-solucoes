
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, X, Star, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageGalleryProps {
  building?: any;
  onSuccess: () => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ building, onSuccess }) => {
  const [uploadingIndex, setUploadingIndex] = React.useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function getImageUrl(path: string) {
    if (path.startsWith('http')) return path;
    return `${supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl}`;
  }

  const imageSlots = Array.from({ length: 4 }, (_, index) => {
    let imageUrl = null;
    
    if (building) {
      if (index === 0 && building.imagem_principal) {
        imageUrl = building.imagem_principal;
      } else if (index === 1 && building.imagem_2) {
        imageUrl = building.imagem_2;
      } else if (index === 2 && building.imagem_3) {
        imageUrl = building.imagem_3;
      } else if (index === 3 && building.imagem_4) {
        imageUrl = building.imagem_4;
      } else if (building.image_urls && building.image_urls[index]) {
        imageUrl = building.image_urls[index];
      }
    }
    
    return {
      index,
      imageUrl: imageUrl ? getImageUrl(imageUrl) : null
    };
  });

  const handleImageUpload = async (index: number, file: File) => {
    if (!building) {
      toast.error('Salve o prédio primeiro antes de fazer upload de imagens');
      return;
    }

    setUploadingIndex(index);

    try {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const buildingId = building.id;
      const fileName = `${buildingId}-${index + 1}-${Date.now()}.${fileExt}`;
      const filePath = `predios/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('building-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const updateData: any = {};
      const currentImageUrls = building.image_urls || [];
      const newImageUrls = [...currentImageUrls];
      
      if (index === 0) {
        updateData.imagem_principal = filePath;
      } else if (index === 1) {
        updateData.imagem_2 = filePath;
      } else if (index === 2) {
        updateData.imagem_3 = filePath;
      } else if (index === 3) {
        updateData.imagem_4 = filePath;
      }
      
      newImageUrls[index] = filePath;
      updateData.image_urls = newImageUrls;

      const { error: updateError } = await supabase
        .from('buildings')
        .update(updateData)
        .eq('id', building.id);

      if (updateError) throw updateError;

      await supabase.rpc('log_building_action', {
        p_building_id: building.id,
        p_action_type: 'image_upload',
        p_description: `Imagem ${index + 1} ${index === 0 ? '(principal)' : ''} adicionada/atualizada`,
        p_new_values: { image_slot: index + 1, file_path: filePath }
      });

      toast.success(`Imagem ${index + 1} enviada com sucesso!`);
      onSuccess();

    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error(error.message || 'Erro ao enviar imagem');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (!building) return;

    try {
      const updateData: any = {};
      const currentImageUrls = building.image_urls || [];
      const newImageUrls = [...currentImageUrls];
      
      let imagePath = null;
      if (index === 0 && building.imagem_principal) {
        imagePath = building.imagem_principal;
        updateData.imagem_principal = null;
      } else if (index === 1 && building.imagem_2) {
        imagePath = building.imagem_2;
        updateData.imagem_2 = null;
      } else if (index === 2 && building.imagem_3) {
        imagePath = building.imagem_3;
        updateData.imagem_3 = null;
      } else if (index === 3 && building.imagem_4) {
        imagePath = building.imagem_4;
        updateData.imagem_4 = null;
      } else if (newImageUrls[index]) {
        imagePath = newImageUrls[index];
      }
      
      if (imagePath && !imagePath.startsWith('http')) {
        await supabase.storage
          .from('building-images')
          .remove([imagePath]);
      }

      newImageUrls[index] = null;
      updateData.image_urls = newImageUrls;

      const { error } = await supabase
        .from('buildings')
        .update(updateData)
        .eq('id', building.id);

      if (error) throw error;

      await supabase.rpc('log_building_action', {
        p_building_id: building.id,
        p_action_type: 'image_remove',
        p_description: `Imagem ${index + 1} ${index === 0 ? '(principal)' : ''} removida`,
        p_new_values: { image_slot: index + 1 }
      });

      toast.success(`Imagem ${index + 1} removida com sucesso!`);
      onSuccess();

    } catch (error: any) {
      console.error('Erro ao remover imagem:', error);
      toast.error('Erro ao remover imagem');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Camera className="h-5 w-5 mr-2" />
          Galeria de Fotos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {imageSlots.map(({ index, imageUrl }) => (
            <div key={index} className={`relative border-2 border-dashed rounded-lg p-2 ${index === 0 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}>
              <div className="text-center mb-2">
                <div className="text-xs font-medium flex items-center justify-center">
                  {index === 0 && <Star className="h-3 w-3 mr-1 text-yellow-500" />}
                  Foto {index + 1}
                  {index === 0 && <span className="text-yellow-600 ml-1">(Principal)</span>}
                </div>
              </div>

              <div className="aspect-video bg-gray-100 rounded relative overflow-hidden">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => fileInputRefs.current[index]?.click()}
                          disabled={uploadingIndex === index}
                          className="h-8 px-2"
                        >
                          <Upload className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveImage(index)}
                          disabled={uploadingIndex === index}
                          className="h-8 px-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <ImageIcon className="h-8 w-8 mb-1" />
                    <p className="text-xs">Sem foto</p>
                  </div>
                )}

                {uploadingIndex === index && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-xs">Enviando...</div>
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2 h-7 text-xs"
                onClick={() => fileInputRefs.current[index]?.click()}
                disabled={uploadingIndex === index}
              >
                <Upload className="h-3 w-3 mr-1" />
                {imageUrl ? 'Trocar' : 'Adicionar'}
              </Button>

              <input
                ref={(el) => {
                  fileInputRefs.current[index] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(index, file);
                  }
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <p>• Primeira foto ⭐ é principal na loja online</p>
          <p>• Máximo 5MB por imagem • Formatos: JPG, PNG, WebP</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageGallery;
