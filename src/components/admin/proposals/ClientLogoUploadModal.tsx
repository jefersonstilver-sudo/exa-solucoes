import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Sparkles, Check, AlertCircle, Image as ImageIcon, Building2, User, FileText, Wand2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientLogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogoProcessed: (logoUrl: string) => void;
  // Props para preview real na proposta
  previewCompanyName?: string;
  previewClientName?: string;
  previewClientDocLabel?: string;
  previewClientDocValue?: string;
}

type ProcessingState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export const ClientLogoUploadModal = ({
  isOpen,
  onClose,
  onLogoProcessed,
  previewCompanyName = 'Nome da Empresa',
  previewClientName = 'Nome do Responsável',
  previewClientDocLabel = 'CNPJ',
  previewClientDocValue = '00.000.000/0001-00'
}: ClientLogoUploadModalProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<'original' | 'processed'>('processed');
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [originalImageError, setOriginalImageError] = useState(false);
  const [processedImageError, setProcessedImageError] = useState(false);
  const [attemptedProcessing, setAttemptedProcessing] = useState(false);

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOriginalUrl(null);
    setProcessedUrl(null);
    setSelectedVariant('processed');
    setProcessingState('idle');
    setErrorMessage(null);
    setDragOver(false);
    setOriginalImageError(false);
    setProcessedImageError(false);
    setAttemptedProcessing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPG ou WEBP.');
      return false;
    }
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
    setOriginalUrl(null);
    setProcessedUrl(null);
    setErrorMessage(null);
    setOriginalImageError(false);
    setProcessedImageError(false);

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

    setAttemptedProcessing(true);
    setProcessingState('uploading');
    setErrorMessage(null);
    setOriginalImageError(false);
    setProcessedImageError(false);

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

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao processar logo');
      }

      // Salvar URLs com cache-busting para preview
      const cacheBuster = `?v=${Date.now()}`;
      setOriginalUrl(data.originalUrl ? data.originalUrl + cacheBuster : null);
      setProcessedUrl(data.processedUrl ? data.processedUrl + cacheBuster : null);
      
      // Se não tiver processedUrl, selecionar original por padrão
      if (!data.processedUrl) {
        setSelectedVariant('original');
      }

      setProcessingState('done');
      
      if (data.processed && data.processedUrl) {
        toast.success('Logo processada com sucesso!');
      } else {
        toast.info('Logo enviada! Processamento IA indisponível, usando original.');
      }

    } catch (error: any) {
      console.error('Error:', error);
      setProcessingState('error');
      setErrorMessage(error.message || 'Erro ao processar logo');
      toast.error('Erro ao processar logo. Tente novamente.');
    }
  };

  // Handler para usar o original (sem processamento IA)
  const handleUseOriginal = async () => {
    if (!selectedFile || !previewUrl) return;
    
    setProcessingState('uploading');
    setErrorMessage(null);
    setOriginalImageError(false);
    setProcessedImageError(false);

    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const base64Data = await base64Promise;

      // Chamar Edge Function apenas para upload (sem IA)
      const { data, error } = await supabase.functions.invoke('process-client-logo', {
        body: {
          imageBase64: base64Data,
          fileName: selectedFile.name,
          onlyUploadOriginal: true
        }
      });

      if (error) {
        console.error('Error uploading original logo:', error);
        throw new Error(error.message || 'Erro ao enviar logo');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao enviar logo');
      }

      // Salvar URL com cache-busting para preview
      const cacheBuster = `?v=${Date.now()}`;
      setOriginalUrl(data.originalUrl ? data.originalUrl + cacheBuster : null);
      setProcessedUrl(null);
      setSelectedVariant('original');
      setProcessingState('done');
      
      toast.success('Logo enviada com sucesso!');

    } catch (error: any) {
      console.error('Error:', error);
      setProcessingState('error');
      setErrorMessage(error.message || 'Erro ao enviar logo');
      toast.error('Erro ao enviar logo. Tente novamente.');
    }
  };

  const handleConfirm = () => {
    // Usar a URL sem cache-buster para salvar
    let finalUrl: string | null = null;
    
    if (selectedVariant === 'processed' && processedUrl) {
      finalUrl = processedUrl.split('?')[0]; // Remove cache-buster
    } else if (originalUrl) {
      finalUrl = originalUrl.split('?')[0];
    }

    if (finalUrl) {
      onLogoProcessed(finalUrl);
      handleClose();
    } else {
      toast.error('Nenhuma logo disponível para aplicar.');
    }
  };

  const getProcessingMessage = () => {
    switch (processingState) {
      case 'uploading':
        return 'Enviando imagem...';
      case 'processing':
        return 'IA removendo fundo e otimizando...';
      case 'done':
        return 'Pronto!';
      case 'error':
        return errorMessage || 'Erro no processamento';
      default:
        return '';
    }
  };

  // Qual URL usar no preview da proposta
  const previewLogoUrl = selectedVariant === 'processed' && processedUrl 
    ? processedUrl 
    : originalUrl;

  const canConfirm = processingState === 'done' && (originalUrl || processedUrl);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl bg-white/80 backdrop-blur-2xl border-white/40 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Sparkles className="h-5 w-5 text-[#9C1E1E]" />
            Upload de Logo do Cliente
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Faça upload da logo. Você pode usar a versão original ou processar com IA para remover o fundo.
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
                relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
                ${dragOver 
                  ? 'border-[#9C1E1E] bg-[#9C1E1E]/5' 
                  : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }
              `}
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className={`h-12 w-12 mx-auto mb-3 ${dragOver ? 'text-[#9C1E1E]' : 'text-slate-400'}`} />
              <p className="text-base font-medium text-slate-700">
                Arraste a logo aqui ou clique para selecionar
              </p>
              <p className="text-sm text-slate-500 mt-1">
                PNG, JPG ou WEBP até 5MB
              </p>
              <p className="text-sm text-[#9C1E1E] mt-3 font-medium flex items-center justify-center gap-1.5">
                <Wand2 className="h-4 w-4" />
                A IA pode remover o fundo automaticamente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Grid de versões: Original | Processada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card Original */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">Original</h3>
                    {processingState === 'done' && originalUrl && (
                      <RadioGroup value={selectedVariant} onValueChange={(v) => setSelectedVariant(v as 'original' | 'processed')}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="original" id="original" className="border-[#9C1E1E] text-[#9C1E1E]" />
                          <Label htmlFor="original" className="text-xs cursor-pointer">Usar esta</Label>
                        </div>
                      </RadioGroup>
                    )}
                  </div>
                  <div className={`
                    relative h-36 rounded-lg overflow-hidden flex items-center justify-center p-4
                    bg-gradient-to-r from-[#4a0f0f] via-[#6B1515] to-[#7D1818] border-2 transition-all
                    ${selectedVariant === 'original' && processingState === 'done' 
                      ? 'border-[#9C1E1E] ring-2 ring-[#9C1E1E]/20' 
                      : 'border-white/20'}
                  `}>
                    {previewUrl && !originalImageError && (
                      <img 
                        key={previewUrl}
                        src={previewUrl} 
                        alt="Original" 
                        className="max-w-full max-h-full object-contain filter brightness-0 invert"
                        onError={() => setOriginalImageError(true)}
                      />
                    )}
                    {originalImageError && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white/80">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs">Erro ao carregar</p>
                        </div>
                      </div>
                    )}
                    {selectedVariant === 'original' && processingState === 'done' && (
                      <div className="absolute top-2 right-2 bg-[#9C1E1E] text-white px-2 py-1 rounded-full text-xs font-medium">
                        Selecionada
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Processada (IA) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Wand2 className="h-4 w-4 text-[#9C1E1E]" />
                      Otimizada (IA)
                    </h3>
                    {processingState === 'done' && processedUrl && (
                      <RadioGroup value={selectedVariant} onValueChange={(v) => setSelectedVariant(v as 'original' | 'processed')}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="processed" id="processed" className="border-[#9C1E1E] text-[#9C1E1E]" />
                          <Label htmlFor="processed" className="text-xs cursor-pointer">Usar esta</Label>
                        </div>
                      </RadioGroup>
                    )}
                  </div>
                  <div className={`
                    relative h-36 rounded-lg overflow-hidden flex items-center justify-center p-4
                    bg-gradient-to-r from-[#4a0f0f] via-[#6B1515] to-[#7D1818] border-2 transition-all
                    ${selectedVariant === 'processed' && processingState === 'done' && processedUrl
                      ? 'border-[#9C1E1E] ring-2 ring-[#9C1E1E]/20' 
                      : 'border-white/20'}
                  `}>
                    {processedUrl ? (
                      <>
                        <img 
                          src={processedUrl} 
                          alt="Processada" 
                          className="max-w-full max-h-full object-contain filter brightness-0 invert"
                          onError={() => setProcessedImageError(true)}
                        />
                        {processedImageError && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white/80">
                              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                              <p className="text-xs">Erro ao carregar</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : processingState === 'idle' ? (
                      <div className="text-white/60 text-center p-4">
                        <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Clique em "Processar" para otimizar</p>
                      </div>
                    ) : processingState === 'uploading' || processingState === 'processing' ? (
                      <div className="text-white text-center p-4">
                        <Loader2 className="h-10 w-10 mx-auto mb-2 animate-spin" />
                        <p className="text-sm font-medium">{getProcessingMessage()}</p>
                      </div>
                    ) : processingState === 'error' ? (
                      <div className="text-white/80 text-center p-4">
                        <AlertCircle className="h-10 w-10 mx-auto mb-2 text-red-300" />
                        <p className="text-sm">{errorMessage || 'Erro no processamento'}</p>
                        <p className="text-xs mt-1 opacity-70">Use a versão original</p>
                      </div>
                    ) : attemptedProcessing ? (
                      <div className="text-white/60 text-center p-4">
                        <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">IA não retornou imagem</p>
                      </div>
                    ) : (
                      <div className="text-white/60 text-center p-4">
                        <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Clique em "Processar" para otimizar</p>
                      </div>
                    )}
                    {selectedVariant === 'processed' && processingState === 'done' && processedUrl && (
                      <div className="absolute top-2 right-2 bg-white text-[#9C1E1E] px-2 py-1 rounded-full text-xs font-medium">
                        Selecionada
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção Preview na Proposta removida para layout compacto */}

              {/* Botão para trocar arquivo */}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetState}
                className="w-full text-slate-600 hover:text-slate-800"
              >
                <X className="h-4 w-4 mr-1" />
                Escolher outra imagem
              </Button>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-2 border-t border-slate-200">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </Button>
            
            {selectedFile && processingState === 'idle' && (
              <>
                <Button 
                  onClick={handleUseOriginal}
                  variant="outline"
                  className="flex-1 border-[#9C1E1E] text-[#9C1E1E] hover:bg-[#9C1E1E]/10"
                >
                  <Check className="h-4 w-4 mr-1.5" />
                  Usar Original
                </Button>
                <Button 
                  onClick={processLogoWithAI}
                  className="flex-1 bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
                >
                  <Wand2 className="h-4 w-4 mr-1.5" />
                  Otimizar com IA
                </Button>
              </>
            )}

            {processingState === 'error' && (
              <Button 
                onClick={processLogoWithAI}
                className="flex-1 bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
              >
                <Wand2 className="h-4 w-4 mr-1.5" />
                Tentar Novamente
              </Button>
            )}

            {canConfirm && (
              <Button 
                onClick={handleConfirm}
                className="flex-1 bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
              >
                <Check className="h-4 w-4 mr-1.5" />
                Aplicar Logo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
