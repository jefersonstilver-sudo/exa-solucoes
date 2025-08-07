
import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { VideoTitleInput } from '@/components/video-upload/VideoTitleInput';
import { VideoUploadScheduleForm, ScheduleRule } from '@/components/video-upload/VideoUploadScheduleForm';
import { Button } from '@/components/ui/button';

interface VideoSlotUploadProps {
  slotPosition: number;
  uploading: boolean;
  isUploading: boolean;
  onUpload: (slotPosition: number, file: File, title: string, scheduleRules?: ScheduleRule[]) => void;
}

export const VideoSlotUpload: React.FC<VideoSlotUploadProps> = ({
  slotPosition,
  uploading,
  isUploading,
  onUpload
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const validateTitle = (title: string): boolean => {
    if (!title.trim()) {
      setTitleError('Título é obrigatório');
      return false;
    }
    if (title.length < 3) {
      setTitleError('Título deve ter pelo menos 3 caracteres');
      return false;
    }
    if (title.length > 50) {
      setTitleError('Título deve ter no máximo 50 caracteres');
      return false;
    }
    setTitleError('');
    return true;
  };

  const handleFileSelect = (file: File) => {
    // Validar tipo de arquivo
    const validTypes = ['video/mp4', 'video/quicktime', 'video/avi', 'video/mov'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor, selecione um arquivo de vídeo válido (MP4, MOV, AVI)');
      return;
    }

    // Validar tamanho (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 100MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleContinueToSchedule = () => {
    if (!validateTitle(videoTitle)) {
      return;
    }

    if (!selectedFile) {
      alert('Por favor, selecione um arquivo de vídeo');
      return;
    }

    setShowScheduleForm(true);
  };

  const handleScheduleSubmit = (scheduleRules: ScheduleRule[]) => {
    if (!selectedFile) return;
    
    onUpload(slotPosition, selectedFile, videoTitle, scheduleRules);
    
    // Reset after upload
    setSelectedFile(null);
    setVideoTitle('');
    setTitleError('');
    setShowScheduleForm(false);
  };

  const handleBackFromSchedule = () => {
    setShowScheduleForm(false);
  };

  const canUpload = selectedFile && videoTitle.length >= 3 && videoTitle.length <= 50 && !uploading && !isUploading;

  // Mostrar formulário de agendamento se estiver nessa etapa
  if (showScheduleForm && selectedFile) {
    return (
      <VideoUploadScheduleForm
        videoTitle={videoTitle}
        fileName={selectedFile.name}
        onBack={handleBackFromSchedule}
        onSubmit={handleScheduleSubmit}
        uploading={isUploading}
      />
    );
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-6 space-y-4 max-w-full overflow-hidden">
      <div className="text-center">
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-sm text-gray-600 mb-4">
          Clique para enviar vídeo ou arraste aqui
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Formatos aceitos: MP4, MOV, AVI (máx. 100MB, horizontal, até 45s)
        </p>
      </div>

      {/* Título do Vídeo */}
      <VideoTitleInput
        title={videoTitle}
        onTitleChange={setVideoTitle}
        error={titleError}
        placeholder={`Ex: Campanha Slot ${slotPosition}`}
      />

      {/* Seleção de Arquivo */}
      <div>
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/avi,video/mov"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileSelect(file);
            }
          }}
          className="hidden"
          id={`upload-${slotPosition}`}
          disabled={uploading || isUploading}
        />
        
        <label 
          htmlFor={`upload-${slotPosition}`}
          className={`cursor-pointer inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
            (uploading || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Upload className="h-4 w-4 mr-2" />
          {selectedFile ? `Arquivo: ${selectedFile.name}` : 'Selecionar Arquivo'}
        </label>
      </div>

      {/* Preview do arquivo selecionado */}
      {selectedFile && (
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium">Arquivo selecionado:</p>
          <p className="text-xs text-gray-600">{selectedFile.name}</p>
          <p className="text-xs text-gray-600">
            Tamanho: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      )}

      {/* Botão para continuar para agendamento */}
      <Button
        onClick={handleContinueToSchedule}
        disabled={!canUpload}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Enviando...
          </>
        ) : (
          'Continuar para Agendamento'
        )}
      </Button>

      {/* Dicas */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 <strong>Dicas para um bom título:</strong></p>
        <p>• Use palavras-chave relevantes</p>
        <p>• Seja claro e descritivo</p>
        <p>• Evite caracteres especiais</p>
      </div>
    </div>
  );
};
