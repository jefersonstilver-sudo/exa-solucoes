import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Keyboard, 
  Mic, 
  FileText, 
  Upload, 
  X, 
  Loader2,
  Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VoiceRecordButton } from './VoiceRecordButton';
import { cn } from '@/lib/utils';

type InputMode = 'text' | 'voice' | 'file';

interface MultimodalInputProps {
  onSubmit: (content: string, type: 'text' | 'audio_url' | 'document_text') => Promise<void>;
  isProcessing?: boolean;
  placeholder?: string;
  className?: string;
}

export function MultimodalInput({
  onSubmit,
  isProcessing = false,
  placeholder = "Descreva o acordo que você quer fazer...",
  className,
}: MultimodalInputProps) {
  const [mode, setMode] = useState<InputMode>('text');
  const [textContent, setTextContent] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = async () => {
    if (!textContent.trim()) return;
    await onSubmit(textContent, 'text');
  };

  const handleAudioReady = async (audioUrl: string) => {
    await onSubmit(audioUrl, 'audio_url');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // Para arquivos de texto simples
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text();
      setFileContent(text);
      return;
    }

    // Para PDFs e outros arquivos, por enquanto apenas indicar que precisa de OCR
    // Em produção, você usaria um serviço de OCR
    setFileContent(`[Conteúdo do arquivo: ${file.name}]\n\nPor favor, descreva o conteúdo do documento no campo de texto.`);
  };

  const handleFileSubmit = async () => {
    if (!fileContent) return;
    await onSubmit(fileContent, 'document_text');
  };

  const clearFile = () => {
    setFileName(null);
    setFileContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const modes: { id: InputMode; icon: typeof Keyboard; label: string }[] = [
    { id: 'text', icon: Keyboard, label: 'Digitar' },
    { id: 'voice', icon: Mic, label: 'Falar' },
    { id: 'file', icon: FileText, label: 'Anexar' },
  ];

  return (
    <div className={cn("w-full max-w-2xl space-y-4", className)}>
      {/* Mode selector */}
      <div className="flex justify-center gap-2">
        {modes.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            disabled={isProcessing}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              mode === id
                ? "bg-[#9C1E1E] text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Input area based on mode */}
      <AnimatePresence mode="wait">
        {mode === 'text' && (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder={placeholder}
              disabled={isProcessing}
              className="min-h-[150px] text-base resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Dica: Seja específico sobre parceiro, prazos e contrapartidas
              </p>
              <Button
                onClick={handleTextSubmit}
                disabled={!textContent.trim() || isProcessing}
                className="bg-[#9C1E1E] hover:bg-[#7D1818] gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Processar com IA
              </Button>
            </div>
          </motion.div>
        )}

        {mode === 'voice' && (
          <motion.div
            key="voice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center py-8"
          >
            <p className="text-muted-foreground mb-6 text-center">
              Clique para gravar e descreva o acordo que você quer fazer
            </p>
            <VoiceRecordButton
              onTranscriptionComplete={(text) => {
                setTextContent(text);
                setMode('text');
              }}
              onAudioUrlReady={handleAudioReady}
              disabled={isProcessing}
              variant="default"
            />
            <p className="text-xs text-muted-foreground mt-4">
              Exemplo: "Quero fazer uma permuta com o Portal da Cidade..."
            </p>
          </motion.div>
        )}

        {mode === 'file' && (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {!fileName ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#9C1E1E] hover:bg-gray-50 transition-colors">
                <Upload className="h-10 w-10 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 font-medium">
                  Clique para enviar um documento
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF, DOCX ou TXT (máx. 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.doc"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-[#9C1E1E]" />
                    <div>
                      <p className="font-medium text-sm">{fileName}</p>
                      <p className="text-xs text-muted-foreground">Documento anexado</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFile}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {fileContent && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <strong>Prévia:</strong> {fileContent.substring(0, 200)}
                      {fileContent.length > 200 && '...'}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleFileSubmit}
                    disabled={!fileContent || isProcessing}
                    className="bg-[#9C1E1E] hover:bg-[#7D1818] gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Analisar Documento
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
