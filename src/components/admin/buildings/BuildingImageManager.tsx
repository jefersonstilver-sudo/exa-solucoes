
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, Image as ImageIcon, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BuildingImageManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: any;
  onImagesUpdate: () => void;
}

const BuildingImageManager: React.FC<BuildingImageManagerProps> = ({
  open,
  onOpenChange,
  building,
  onImagesUpdate
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Construir array de imagens usando os novos campos individuais
  const imageSlots = Array.from({ length: 4 }, (_, index) => {
    let imageUrl = null;
    
    if (building) {
      // Priorizar os novos campos individuais
      if (index === 0 && building.imagem_principal) {
        imageUrl = building.imagem_principal;
      } else if (index === 1 && building.imagem_2) {
        imageUrl = building.imagem_2;
      } else if (index === 2 && building.imagem_3) {
        imageUrl = building.imagem_3;
      } else if (index === 3 && building.imagem_4) {
        imageUrl = building.imagem_4;
      }
      // Fallback para image_urls array (compatibilidade)
      else if (building.image_urls && building.image_urls[index]) {
        imageUrl = building.image_urls[index];
      }
    }
    
    return {
      index,
      imageUrl: imageUrl ? getImageUrl(imageUrl) : null
    };
  });

  function getImageUrl(path: string) {
    if (path.startsWith('http')) return path;
    return `${supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl}`;
  }

  const handleImageUpload = async (index: number, file: File) => {
    if (!building) return;

    setUploading(true);
    setUploadingIndex(index);

    try {
      // Validar arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }

      // Upload para o Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${building.id}-${index + 1}-${Date.now()}.${fileExt}`;
      const filePath = `predios/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('building-images')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Preparar atualização dos campos individuais e array
      const updateData: any = {};
      const currentImageUrls = building.image_urls || [];
      const newImageUrls = [...currentImageUrls];
      
      // Atualizar campo individual específico
      if (index === 0) {
        updateData.imagem_principal = filePath;
      } else if (index === 1) {
        updateData.imagem_2 = filePath;
      } else if (index === 2) {
        updateData.imagem_3 = filePath;
      } else if (index === 3) {
        updateData.imagem_4 = filePath;
      }
      
      // Atualizar array para compatibilidade
      newImageUrls[index] = filePath;
      updateData.image_urls = newImageUrls;

      const { error: updateError } = await supabase
        .from('buildings')
        .update(updateData)
        .eq('id', building.id);

      if (updateError) throw updateError;

      // Log da ação
      await supabase.rpc('log_building_action', {
        p_building_id: building.id,
        p_action_type: 'image_upload',
        p_description: `Imagem ${index + 1} ${index === 0 ? '(principal)' : ''} adicionada/atualizada`,
        p_new_values: { image_slot: index + 1, file_path: filePath }
      });

      toast.success(`Imagem ${index + 1} enviada com sucesso!`);
      onImagesUpdate();

    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error(error.message || 'Erro ao enviar imagem');
    } finally {
      setUploading(false);
      setUploadingIndex(null);
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (!building) return;

    try {
      const updateData: any = {};
      const currentImageUrls = building.image_urls || [];
      const newImageUrls = [...currentImageUrls];
      
      // Obter caminho da imagem para deletar do storage
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
      
      // Remover do storage se existir
      if (imagePath && !imagePath.startsWith('http')) {
        await supabase.storage
          .from('building-images')
          .remove([imagePath]);
      }

      // Atualizar array para compatibilidade
      newImageUrls[index] = null;
      updateData.image_urls = newImageUrls;

      const { error } = await supabase
        .from('buildings')
        .update(updateData)
        .eq('id', building.id);

      if (error) throw error;

      // Log da ação
      await supabase.rpc('log_building_action', {
        p_building_id: building.id,
        p_action_type: 'image_remove',
        p_description: `Imagem ${index + 1} ${index === 0 ? '(principal)' : ''} removida`,
        p_new_values: { image_slot: index + 1 }
      });

      toast.success(`Imagem ${index + 1} removida com sucesso!`);
      onImagesUpdate();

    } catch (error: any) {
      console.error('Erro ao remover imagem:', error);
      toast.error('Erro ao remover imagem');
    }
  };

  if (!building) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="h-6 w-6 mr-2 text-[#9C1E1E]" />
            Galeria de Imagens - {building.nome}
          </DialogTitle>
          <DialogDescription>
            Gerencie até 4 imagens do prédio. A primeira imagem será exibida como principal na loja online.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {imageSlots.map(({ index, imageUrl }) => (
            <Card key={index} className={`relative ${index === 0 ? 'ring-2 ring-yellow-400' : ''}`}>
              <CardContent className="p-4">
                <div className="text-center mb-3">
                  <h3 className="font-medium text-sm flex items-center justify-center">
                    {index === 0 && <Star className="h-4 w-4 mr-1 text-yellow-500" />}
                    Imagem {index + 1} 
                    {index === 0 && <span className="text-yellow-600 ml-1">(Principal)</span>}
                  </h3>
                </div>

                <div className="aspect-video bg-gray-100 rounded-lg relative overflow-hidden border-2 border-dashed border-gray-300">
                  {imageUrl ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={`${building.nome} - Imagem ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => fileInputRefs.current[index]?.click()}
                            disabled={uploading}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveImage(index)}
                            disabled={uploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <ImageIcon className="h-12 w-12 mb-2" />
                      <p className="text-sm">Nenhuma imagem</p>
                      {index === 0 && (
                        <p className="text-xs text-yellow-600 mt-1">Imagem principal</p>
                      )}
                    </div>
                  )}

                  {uploadingIndex === index && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-sm">Enviando...</div>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {imageUrl ? 'Substituir' : 'Adicionar'} Imagem
                  </Button>
                </div>

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
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Dicas importantes:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• A primeira imagem ⭐ é a <strong>principal</strong> e aparecerá em destaque na loja</li>
            <li>• As outras imagens aparecerão quando o cliente passar o mouse por cima</li>
            <li>• Tamanho máximo: 5MB por imagem</li>
            <li>• Formatos aceitos: JPG, PNG, WebP</li>
            <li>• Recomendado: proporção 16:9 para melhor exibição</li>
            <li>• As imagens são salvas tanto individualmente quanto em array para compatibilidade</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuildingImageManager;
