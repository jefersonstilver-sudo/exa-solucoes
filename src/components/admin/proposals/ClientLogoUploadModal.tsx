import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Sparkles, Check, AlertCircle, Image as ImageIcon, Wand2, CheckCircle2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientLogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogoProcessed: (logoUrl: string) => void;
  previewCompanyName?: string;
  previewClientName?: string;
  previewClientDocLabel?: string;
  previewClientDocValue?: string;
}

type ProcessingState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';
type SelectedVariant = 'original' | 'css-optimized' | 'ai-processed';

export const ClientLogoUploadModal = ({
  isOpen,
  onClose,
  onLogoProcessed,
}: ClientLogoUploadModalProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<SelectedVariant>('css-optimized');
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [originalImageError, setOriginalImageError] = useState(false);
  const [cssImageError, setCssImageError] = useState(false);
  const [processedImageError, setProcessedImageError] = useState(false);
  const [uploadedOriginal, setUploadedOriginal] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStatusMessage, setAiStatusMessage] = useState('');
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const AI_STATUS_MESSAGES = [
    'Analisando tipo de logo...',
    'Removendo fundo da imagem...',
    'Ajustando cores e contraste...',
    'Otimizando para alta qualidade...',
    'Quase pronto, finalizando...',
  ];

  // Animated progress effect during AI processing
  useEffect(() => {
    if (processingState === 'processing') {
      setAiProgress(0);
      setAiStatusMessage(AI_STATUS_MESSAGES[0]);
      let step = 0;
      let progress = 0;

      progressIntervalRef.current = setInterval(() => {
        progress += Math.random() * 8 + 2; // 2-10% per tick
        if (progress > 90) progress = 90;
        setAiProgress(Math.round(progress));

        const msgIndex = Math.min(Math.floor(progress / 20), AI_STATUS_MESSAGES.length - 1);
        if (msgIndex !== step) {
          step = msgIndex;
          setAiStatusMessage(AI_STATUS_MESSAGES[step]);
        }
      }, 800);

      return () => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      };
    } else if (processingState === 'done' && aiProgress > 0) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setAiProgress(100);
      setAiStatusMessage('Logo otimizada com sucesso!');
    } else if (processingState === 'error') {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setAiProgress(0);
      setAiStatusMessage('');
    }
  }, [processingState]);

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOriginalUrl(null);
    setProcessedUrl(null);
    setSelectedVariant('css-optimized');
    setProcessingState('idle');
    setErrorMessage(null);
    setDragOver(false);
    setOriginalImageError(false);
    setCssImageError(false);
    setProcessedImageError(false);
    setUploadedOriginal(false);
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
    setCssImageError(false);
    setProcessedImageError(false);
    setUploadedOriginal(false);

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

  // Upload apenas o original (para card 1 e 2)
  const uploadOriginal = async (): Promise<string | null> => {
    if (!selectedFile || !previewUrl) return null;
    if (uploadedOriginal && originalUrl) return originalUrl;
    
    setProcessingState('uploading');
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const base64Data = await base64Promise;

      const { data, error } = await supabase.functions.invoke('process-client-logo', {
        body: {
          imageBase64: base64Data,
          fileName: selectedFile.name,
          onlyUploadOriginal: true
        }
      });

      if (error) throw new Error(error.message || 'Erro ao enviar logo');
      if (!data?.success) throw new Error(data?.error || 'Falha ao enviar logo');

      const cacheBuster = `?v=${Date.now()}`;
      const url = data.originalUrl ? data.originalUrl + cacheBuster : null;
      setOriginalUrl(url);
      setUploadedOriginal(true);
      setProcessingState('done');
      toast.success('Logo enviada com sucesso!');
      return url;
    } catch (error: any) {
      console.error('Error:', error);
      setProcessingState('error');
      setErrorMessage(error.message || 'Erro ao enviar logo');
      toast.error('Erro ao enviar logo. Tente novamente.');
      return null;
    }
  };

  // Processar com IA (para card 3)
  const processLogoWithAI = async () => {
    if (!selectedFile || !previewUrl) return;

    setProcessingState('uploading');
    setErrorMessage(null);
    setProcessedImageError(false);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const base64Data = await base64Promise;

      setProcessingState('processing');

      const { data, error } = await supabase.functions.invoke('process-client-logo', {
        body: {
          imageBase64: base64Data,
          fileName: selectedFile.name
        }
      });

      if (error) throw new Error(error.message || 'Erro ao processar logo');
      if (!data?.success) throw new Error(data?.error || 'Falha ao processar logo');

      const cacheBuster = `?v=${Date.now()}`;
      if (!uploadedOriginal) {
        setOriginalUrl(data.originalUrl ? data.originalUrl + cacheBuster : null);
        setUploadedOriginal(true);
      }
      setProcessedUrl(data.processedUrl ? data.processedUrl + cacheBuster : null);
      setProcessingState('done');
      
      if (data.processed && data.processedUrl) {
        setSelectedVariant('ai-processed');
        toast.success('Logo processada com IA com sucesso!');
      } else {
        toast.info('IA não retornou imagem processada. Use Original ou CSS.');
      }
    } catch (error: any) {
      console.error('Error:', error);
      setProcessingState('error');
      setErrorMessage(error.message || 'Erro ao processar logo');
      toast.error('Erro ao processar logo. Tente novamente.');
    }
  };

  const handleConfirm = (overrideUrl?: string) => {
    let finalUrl: string | null = null;
    
    if (selectedVariant === 'ai-processed' && processedUrl) {
      finalUrl = processedUrl.split('?')[0];
    } else if (selectedVariant === 'original') {
      const url = overrideUrl || originalUrl;
      if (url) finalUrl = url.split('?')[0] + '#original';
    } else if (selectedVariant === 'css-optimized') {
      const url = overrideUrl || originalUrl;
      if (url) finalUrl = url.split('?')[0];
    }

    if (finalUrl) {
      onLogoProcessed(finalUrl);
      handleClose();
    } else {
      toast.error('Nenhuma logo disponível para aplicar.');
    }
  };

  // Para cards Original e CSS, upload on demand quando confirmar
  const handleApply = async () => {
    if (!uploadedOriginal && selectedVariant !== 'ai-processed') {
      const url = await uploadOriginal();
      if (url) {
        handleConfirm(url);
      }
    } else {
      handleConfirm();
    }
  };

  const getProcessingMessage = () => {
    switch (processingState) {
      case 'uploading': return 'Enviando imagem...';
      case 'processing': return 'IA removendo fundo e otimizando...';
      case 'done': return 'Pronto!';
      case 'error': return errorMessage || 'Erro no processamento';
      default: return '';
    }
  };

  const canConfirm = previewUrl && (
    (selectedVariant === 'original') || 
    (selectedVariant === 'css-optimized') || 
    (selectedVariant === 'ai-processed' && processedUrl)
  );

  const isProcessing = processingState === 'uploading' || processingState === 'processing';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl bg-white/80 backdrop-blur-2xl border-white/40 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Sparkles className="h-5 w-5 text-[#9C1E1E]" />
            Upload de Logo do Cliente
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Faça upload da logo e escolha entre 3 versões: original, branco (CSS) ou otimizada por IA.
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
              {/* RadioGroup unificada para 3 cards */}
              <RadioGroup 
                value={selectedVariant} 
                onValueChange={(v) => setSelectedVariant(v as SelectedVariant)}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {/* Card 1 - Original */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="original" id="variant-original" className="border-[#9C1E1E] text-[#9C1E1E]" />
                    <Label htmlFor="variant-original" className="text-sm font-semibold text-slate-700 cursor-pointer">
                      Original
                    </Label>
                  </div>
                  <label htmlFor="variant-original" className="cursor-pointer block">
                    <div className={`
                      relative h-36 rounded-lg overflow-hidden flex items-center justify-center p-4
                      bg-gradient-to-r from-[#4a0f0f] via-[#6B1515] to-[#7D1818]
                      border-2 transition-all
                      ${selectedVariant === 'original' 
                        ? 'border-[#9C1E1E] ring-2 ring-[#9C1E1E]/20' 
                        : 'border-white/20 hover:border-white/30'}
                    `}>
                      {previewUrl && !originalImageError ? (
                        <img 
                          src={previewUrl} 
                          alt="Original" 
                          className="max-w-full max-h-full object-contain"
                          onError={() => setOriginalImageError(true)}
                        />
                      ) : originalImageError ? (
                        <div className="text-center text-slate-500">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs">Erro ao carregar</p>
                        </div>
                      ) : null}
                      {selectedVariant === 'original' && (
                        <div className="absolute top-2 right-2 bg-[#9C1E1E] text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                          Selecionada
                        </div>
                      )}
                    </div>
                  </label>
                  <p className="text-[11px] text-slate-500 text-center">Imagem sem alterações</p>
                </div>

                {/* Card 2 - Branco (CSS) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="css-optimized" id="variant-css" className="border-[#9C1E1E] text-[#9C1E1E]" />
                    <Label htmlFor="variant-css" className="text-sm font-semibold text-slate-700 cursor-pointer">
                      Branco (CSS)
                    </Label>
                  </div>
                  <label htmlFor="variant-css" className="cursor-pointer block">
                    <div className={`
                      relative h-36 rounded-lg overflow-hidden flex items-center justify-center p-4
                      bg-gradient-to-r from-[#4a0f0f] via-[#6B1515] to-[#7D1818] border-2 transition-all
                      ${selectedVariant === 'css-optimized' 
                        ? 'border-[#9C1E1E] ring-2 ring-[#9C1E1E]/20' 
                        : 'border-white/20 hover:border-white/40'}
                    `}>
                      {previewUrl && !cssImageError ? (
                        <img 
                          src={previewUrl} 
                          alt="Branco CSS" 
                          className="max-w-full max-h-full object-contain filter brightness-0 invert"
                          onError={() => setCssImageError(true)}
                        />
                      ) : cssImageError ? (
                        <div className="text-center text-white/80">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs">Erro ao carregar</p>
                        </div>
                      ) : null}
                      {selectedVariant === 'css-optimized' && (
                        <div className="absolute top-2 right-2 bg-white text-[#9C1E1E] px-2 py-0.5 rounded-full text-[10px] font-medium">
                          Selecionada
                        </div>
                      )}
                    </div>
                  </label>
                  <p className="text-[11px] text-slate-500 text-center">Filtro CSS brightness-0 invert</p>
                </div>

                {/* Card 3 - Otimizada (IA) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem 
                      value="ai-processed" 
                      id="variant-ai" 
                      className="border-[#9C1E1E] text-[#9C1E1E]" 
                      disabled={!processedUrl}
                    />
                    <Label htmlFor="variant-ai" className="text-sm font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5">
                      <Wand2 className="h-3.5 w-3.5 text-[#9C1E1E]" />
                      Otimizada (IA)
                    </Label>
                  </div>
                  <div className={`
                    relative h-36 rounded-lg overflow-hidden flex items-center justify-center p-4
                    bg-gradient-to-r from-[#4a0f0f] via-[#6B1515] to-[#7D1818] border-2 transition-all
                    ${selectedVariant === 'ai-processed' && processedUrl
                      ? 'border-[#9C1E1E] ring-2 ring-[#9C1E1E]/20' 
                      : 'border-white/20'}
                  `}>
                    {processedUrl && !processedImageError ? (
                      <>
                        <img 
                          src={processedUrl} 
                          alt="Processada IA" 
                          className="max-w-full max-h-full object-contain"
                          onError={() => setProcessedImageError(true)}
                        />
                        {selectedVariant === 'ai-processed' && (
                          <div className="absolute top-2 right-2 bg-white text-[#9C1E1E] px-2 py-0.5 rounded-full text-[10px] font-medium">
                            Selecionada
                          </div>
                        )}
                      </>
                    ) : processedImageError ? (
                      <div className="text-center text-white/80">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-xs">Erro ao carregar</p>
                      </div>
                    ) : isProcessing ? (
                      <div className="text-white text-center p-3 w-full space-y-3">
                        <div className="relative">
                          <Wand2 className="h-8 w-8 mx-auto text-white animate-pulse" />
                          <div className="absolute inset-0 h-8 w-8 mx-auto rounded-full bg-white/10 animate-ping" style={{ animationDuration: '2s' }} />
                        </div>
                        <div className="space-y-1.5 w-full px-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-white/70 font-medium">{aiStatusMessage}</span>
                            <span className="text-white font-bold">{aiProgress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-white/60 via-white to-white/60 rounded-full transition-all duration-500 ease-out relative"
                              style={{ width: `${aiProgress}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                            </div>
                          </div>
                        </div>
                        <p className="text-[9px] text-white/50">Designer IA trabalhando...</p>
                      </div>
                  </div>
                  <p className="text-[11px] text-slate-500 text-center">IA remove fundo e converte</p>
                </div>
              </RadioGroup>

              {/* Botão para trocar arquivo */}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetState}
                className="w-full text-slate-600 hover:text-slate-800"
                disabled={isProcessing}
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
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            
            {selectedFile && !isProcessing && (processingState === 'idle' || processingState === 'error' || (processingState === 'done' && !processedUrl)) && (
              <Button 
                onClick={processLogoWithAI}
                variant="outline"
                className="flex-1 border-[#9C1E1E] text-[#9C1E1E] hover:bg-[#9C1E1E]/10"
              >
                <Wand2 className="h-4 w-4 mr-1.5" />
                Otimizar com IA
              </Button>
            )}

            {canConfirm && !isProcessing && (
              <Button 
                onClick={handleApply}
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
