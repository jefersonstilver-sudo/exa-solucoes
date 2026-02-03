import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Sparkles, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientLogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogoProcessed: (logoUrl: string) => void;
}

type ProcessingState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export const ClientLogoUploadModal = ({
  isOpen,
  onClose,
  onLogoProcessed
}: ClientLogoUploadModalProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setProcessedUrl(null);
    setProcessingState('idle');
    setErrorMessage(null);
    setDragOver(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateFile = (file: File): boolean => {
    // Validar tipo (PNG preferido, mas aceitar imagens em geral)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPG ou WEBP.');
      return false;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);
    setProcessingState('idle');
    setProcessedUrl(null);
    setErrorMessage(null);

    // Criar preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      toast.error('Por favor, selecione uma imagem.');
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const processLogoWithAI = async () => {
    if (!selectedFile || !previewUrl) return;

    setProcessingState('uploading');
    setErrorMessage(null);

    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const base64Data = await base64Promise;

      setProcessingState('processing');

      // Chamar Edge Function para processar com IA
      const { data, error } = await supabase.functions.invoke('process-client-logo', {
        body: {
          imageBase64: base64Data,
          fileName: selectedFile.name
        }
      });

      if (error) {
        console.error('Error processing logo:', error);
        throw new Error(error.message || 'Erro ao processar logo');
      }

      if (!data?.success || !data?.logoUrl) {
        throw new Error(data?.error || 'Falha ao processar logo');
      }

      setProcessedUrl(data.logoUrl);
      setProcessingState('done');
      toast.success('Logo processada com sucesso!');

    } catch (error: any) {
      console.error('Error:', error);
      setProcessingState('error');
      setErrorMessage(error.message || 'Erro ao processar logo');
      toast.error('Erro ao processar logo. Tente novamente.');
    }
  };

  const handleConfirm = () => {
    if (processedUrl) {
      onLogoProcessed(processedUrl);
      handleClose();
    }
  };

  const getProcessingMessage = () => {
    switch (processingState) {
      case 'uploading':
        return 'Preparando imagem...';
      case 'processing':
        return 'IA removendo fundo e otimizando...';
      case 'done':
        return 'Logo pronta!';
      case 'error':
        return errorMessage || 'Erro no processamento';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Upload de Logo do Cliente
          </DialogTitle>
          <DialogDescription>
            Faça upload da logo. A IA irá remover o fundo e otimizar automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Área de Upload */}
          {!selectedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                ${dragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className={`h-10 w-10 mx-auto mb-3 ${dragOver ? 'text-primary' : 'text-slate-400'}`} />
              <p className="text-sm font-medium text-slate-700">
                Arraste a logo aqui ou clique para selecionar
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG ou WEBP até 5MB
              </p>
              <p className="text-xs text-primary/80 mt-2 font-medium">
                ✨ A IA remove o fundo automaticamente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview da Imagem */}
              <div className="flex gap-4 items-start">
                {/* Imagem Original */}
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-500 mb-2">Original</p>
                  <div className="relative aspect-square rounded-lg border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                    {previewUrl && (
                      <img 
                        src={previewUrl} 
                        alt="Original" 
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                  </div>
                </div>

                {/* Seta */}
                <div className="flex items-center justify-center pt-8">
                  <div className="text-slate-300">→</div>
                </div>

                {/* Imagem Processada */}
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-500 mb-2">Processada</p>
                  <div className="relative aspect-square rounded-lg border-2 border-slate-200 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    {processedUrl ? (
                      <img 
                        src={processedUrl} 
                        alt="Processada" 
                        className="max-w-full max-h-full object-contain p-2 filter brightness-0 invert"
                      />
                    ) : processingState === 'idle' ? (
                      <div className="text-slate-600 text-center p-2">
                        <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                        <p className="text-xs">Clique em processar</p>
                      </div>
                    ) : (
                      <div className="text-white text-center p-2">
                        <Loader2 className="h-8 w-8 mx-auto mb-1 animate-spin" />
                        <p className="text-xs">{getProcessingMessage()}</p>
                      </div>
                    )}
                    {processingState === 'done' && (
                      <div className="absolute top-2 right-2 p-1 bg-emerald-500 rounded-full">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status do Processamento */}
              {processingState !== 'idle' && processingState !== 'done' && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  processingState === 'error' 
                    ? 'bg-red-50 text-red-700' 
                    : 'bg-blue-50 text-blue-700'
                }`}>
                  {processingState === 'error' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span className="text-sm">{getProcessingMessage()}</span>
                </div>
              )}

              {/* Botão para trocar arquivo */}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetState}
                className="w-full"
              >
                <X className="h-4 w-4 mr-1" />
                Escolher outra imagem
              </Button>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            
            {selectedFile && processingState === 'idle' && (
              <Button 
                onClick={processLogoWithAI}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Processar com IA
              </Button>
            )}

            {processingState === 'error' && (
              <Button 
                onClick={processLogoWithAI}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Tentar Novamente
              </Button>
            )}

            {processingState === 'done' && processedUrl && (
              <Button 
                onClick={handleConfirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Usar esta Logo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
