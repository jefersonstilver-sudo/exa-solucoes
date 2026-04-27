import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Star, Image as ImageIcon, GripVertical, Move } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ImageFocusEditor from '../ImageFocusEditor';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface LocalImage {
  id: string;
  file?: File;
  url: string;
  isNew: boolean;
  originalPath?: string;
}

interface ImageGallery3Props {
  images: LocalImage[];
  onImagesChange: (images: LocalImage[]) => void;
  buildingId?: string;
  disabled?: boolean;
}

interface SortableImageProps {
  image: LocalImage;
  index: number;
  onRemove: (id: string) => void;
  onUploadClick: (index: number) => void;
  onAdjustFocus?: (image: LocalImage, index: number) => void;
  disabled?: boolean;
}

const SortableImage: React.FC<SortableImageProps> = ({ 
  image, 
  index, 
  onRemove, 
  onUploadClick,
  onAdjustFocus,
  disabled 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isPrimary = index === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative rounded-xl overflow-hidden border-2 transition-all
        ${isPrimary ? 'border-amber-400 bg-amber-50/50' : 'border-gray-200 bg-gray-50'}
        ${isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''}
      `}
    >
      {/* Drag handle */}
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-10 p-1 bg-black/50 rounded cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Primary badge */}
      {isPrimary && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-medium">
          <Star className="h-2.5 w-2.5" />
          Principal
        </div>
      )}

      {/* Image */}
      <div className="aspect-video">
        {image.url ? (
          <>
            <img
              src={image.url}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                {!image.isNew && image.originalPath && onAdjustFocus && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => onAdjustFocus(image, index)}
                    className="h-8 px-3"
                    title="Ajustar enquadramento"
                  >
                    <Move className="h-3 w-3 mr-1" />
                    Ajustar
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => onRemove(image.id)}
                  className="h-8 px-3"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remover
                </Button>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => onUploadClick(index)}
            disabled={disabled}
            className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ImageIcon className="h-8 w-8 mb-1" />
            <span className="text-xs">Adicionar foto</span>
          </button>
        )}
      </div>
    </div>
  );
};

const ImageGallery3: React.FC<ImageGallery3Props> = ({ 
  images, 
  onImagesChange, 
  buildingId,
  disabled = false 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [focusEditor, setFocusEditor] = useState<{
    open: boolean;
    slotIndex: number;
    imagePath: string;
    initialFocus: { x: number; y: number };
  } | null>(null);

  const focusFieldByIndex = ['imagem_principal_focus', 'imagem_2_focus', 'imagem_3_focus', 'imagem_4_focus'];

  const handleAdjustFocus = useCallback(async (image: LocalImage, index: number) => {
    if (!buildingId || !image.originalPath) {
      toast.error('Salve o prédio primeiro para ajustar enquadramento');
      return;
    }
    // Buscar o focus atual do banco
    const field = focusFieldByIndex[index];
    let initialFocus = { x: 50, y: 50 };
    try {
      const { data } = await supabase
        .from('buildings')
        .select(field)
        .eq('id', buildingId)
        .maybeSingle();
      if (data && (data as any)[field]) {
        initialFocus = (data as any)[field];
      }
    } catch (e) {
      console.warn('Não foi possível carregar foco atual, usando centro', e);
    }
    setFocusEditor({
      open: true,
      slotIndex: index,
      imagePath: image.originalPath,
      initialFocus,
    });
  }, [buildingId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ensure we always have 4 slots
  const imageSlots: LocalImage[] = [...images];
  while (imageSlots.length < 4) {
    imageSlots.push({
      id: `empty-${imageSlots.length}`,
      url: '',
      isNew: false,
    });
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = imageSlots.findIndex(img => img.id === active.id);
      const newIndex = imageSlots.findIndex(img => img.id === over.id);
      
      const newImages = arrayMove(imageSlots, oldIndex, newIndex).filter(img => img.url);
      onImagesChange(newImages);
    }
  };

  const handleFileSelect = useCallback(async (file: File, slotIndex: number) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    // Create local preview URL
    const previewUrl = URL.createObjectURL(file);
    
    const newImage: LocalImage = {
      id: `new-${Date.now()}-${slotIndex}`,
      file,
      url: previewUrl,
      isNew: true,
    };

    // Replace empty slot or add new image
    const newImages = images.filter(img => img.url);
    if (slotIndex < newImages.length) {
      newImages[slotIndex] = newImage;
    } else {
      newImages.push(newImage);
    }

    onImagesChange(newImages);
    toast.success('Foto adicionada! Será enviada ao salvar.');
  }, [images, onImagesChange]);

  const handleUploadClick = (index: number) => {
    setUploadingIndex(index);
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingIndex !== null) {
      handleFileSelect(file, uploadingIndex);
    }
    setUploadingIndex(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove?.isNew && imageToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    onImagesChange(images.filter(img => img.id !== id));
    toast.success('Foto removida');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Galeria de Fotos</span>
        </div>
        <span className="text-xs text-gray-500">
          Arraste para reordenar • Primeira foto é principal
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={imageSlots.map(img => img.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3">
            {imageSlots.map((image, index) => (
              <SortableImage
                key={image.id}
                image={image}
                index={index}
                onRemove={handleRemove}
                onUploadClick={handleUploadClick}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <p className="text-xs text-gray-500 text-center">
        Máximo 5MB por imagem • JPG, PNG, WebP
      </p>
    </div>
  );
};

export default ImageGallery3;
